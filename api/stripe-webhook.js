// Stripe -> Printful fulfillment bridge.
//
// On a paid Checkout session, submits a real order to Printful using the
// shipping address Stripe collected. This is the step that actually causes a
// t-shirt to get printed and posted — everything before this point (the shop
// listing, the checkout session) is just getting to a successful payment.
//
// Verifies the webhook signature by hand (HMAC-SHA256 per Stripe's documented
// scheme) rather than pulling in the `stripe` SDK, matching the rest of this
// repo's no-dependencies approach. This needs the RAW request body — Vercel's
// default JSON body-parsing would re-serialize it and break the signature, so
// it's disabled below via `config.api.bodyParser = false`.
//
// Setup:
//   1. Stripe dashboard -> Developers -> Webhooks -> Add endpoint
//      URL: https://<your-domain>/api/stripe-webhook
//      Event: checkout.session.completed
//   2. Copy its signing secret into STRIPE_WEBHOOK_SECRET.
//   3. PRINTFUL_API_KEY must also be set (same key api/shop.js uses).
//
// Known limitation: if Stripe redelivers this webhook (it retries on any
// non-2xx response or timeout), the same order could be submitted to
// Printful twice. Printful's `external_id` field is set to the Stripe
// session id below so a duplicate is at least traceable, but nothing here
// currently checks for and skips an already-fulfilled session — that would
// need a persistent store (e.g. Vercel KV) to do properly, which is outside
// what this pass adds. Low-volume fan-site risk; revisit if this ever sells
// more than a handful of orders a day.

import crypto from 'node:crypto'

export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader) return false
  const parts = Object.fromEntries(
    sigHeader.split(',').map(p => {
      const [k, v] = p.split('=')
      return [k, v]
    })
  )
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  // Reject anything older than 5 minutes — basic replay protection
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(signature, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('POST only')
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const printfulKey = process.env.PRINTFUL_API_KEY
  if (!webhookSecret || !printfulKey) {
    console.error('stripe-webhook: STRIPE_WEBHOOK_SECRET or PRINTFUL_API_KEY not set')
    return res.status(500).send('Not configured')
  }

  const rawBody = await readRawBody(req)
  const ok = verifyStripeSignature(rawBody, req.headers['stripe-signature'], webhookSecret)
  if (!ok) {
    return res.status(400).send('Invalid signature')
  }

  let event
  try {
    event = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).send('Bad JSON')
  }

  if (event.type !== 'checkout.session.completed') {
    // Not an error — Stripe sends every event type to every endpoint that
    // subscribes broadly; just acknowledge and ignore what we don't handle.
    return res.status(200).send('Ignored')
  }

  const session = event.data?.object
  const meta = session?.metadata || {}
  const shipping = session?.shipping_details || session?.shipping
  const address = shipping?.address

  if (!meta.printfulSyncVariantId || !address) {
    console.error('stripe-webhook: missing metadata or shipping address', { sessionId: session?.id })
    return res.status(400).send('Missing order data')
  }

  try {
    const orderRes = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${printfulKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: session.id,
        recipient: {
          name: shipping?.name || session?.customer_details?.name || 'Customer',
          address1: address.line1,
          address2: address.line2 || '',
          city: address.city,
          state_code: address.state || '',
          country_code: address.country,
          zip: address.postal_code,
          email: session?.customer_details?.email,
        },
        items: [
          {
            sync_variant_id: Number(meta.printfulSyncVariantId),
            quantity: Number(meta.quantity) || 1,
          },
        ],
        confirm: true, // submit for fulfillment immediately — bills your Printful account at cost
      }),
    })

    const orderJson = await orderRes.json()
    if (!orderRes.ok) {
      console.error('stripe-webhook: Printful order failed', orderJson)
      return res.status(502).send('Printful order failed')
    }

    return res.status(200).send('OK')
  } catch (err) {
    console.error('stripe-webhook: fulfillment error', err)
    return res.status(502).send('Fulfillment error')
  }
}
