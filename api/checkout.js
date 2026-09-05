// Creates a Stripe Checkout Session for one catalog item.
//
// Calls Stripe's REST API directly (no `stripe` npm package) so this repo
// stays a zero-build static site plus small functions — same reasoning as
// api/football.js and api/news.js using plain fetch instead of SDKs.
//
// Price and product name are ALWAYS resolved server-side from
// _shop-catalog.js by id — never taken from the request body. A client can
// only ever buy exactly what's in the catalog at exactly the price listed
// there; there is no field a browser could tamper with to change what gets
// charged.
//
// Needs STRIPE_SECRET_KEY (from your Stripe dashboard, Developers -> API keys
// -> Secret key). Card details are never seen by this site — Stripe's own
// hosted Checkout page collects them.

import { findProduct } from './_shop-catalog.js'

// Countries Printful can ship a print-on-demand order to. Trim or extend to
// match where you're actually willing to ship.
const SHIPPING_COUNTRIES = ['GB', 'IE', 'US', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' })
  }

  const { productId, quantity } = req.body || {}
  const product = findProduct(productId)
  if (!product) {
    return res.status(400).json({ error: 'Unknown product' })
  }
  // Clamp rather than trust the client's number
  const qty = Math.min(10, Math.max(1, Number(quantity) || 1))

  const origin = req.headers.origin || 'https://lufc-fan-hub.vercel.app'

  const params = new URLSearchParams()
  params.append('mode', 'payment')
  params.append('payment_method_types[]', 'card')
  params.append('line_items[0][quantity]', String(qty))
  params.append('line_items[0][price_data][currency]', product.currency || 'gbp')
  params.append('line_items[0][price_data][unit_amount]', String(product.priceCents))
  params.append('line_items[0][price_data][product_data][name]', product.name)
  SHIPPING_COUNTRIES.forEach(c => params.append('shipping_address_collection[allowed_countries][]', c))
  params.append('success_url', `${origin}/?checkout=success#shop`)
  params.append('cancel_url', `${origin}/?checkout=cancelled#shop`)
  // The webhook uses this to know exactly what to fulfill, without trusting
  // anything else Stripe hands back
  params.append('metadata[productId]', product.id)
  params.append('metadata[quantity]', String(qty))
  params.append('metadata[printfulSyncVariantId]', String(product.printfulSyncVariantId))

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    const json = await stripeRes.json()
    if (!stripeRes.ok) {
      return res.status(502).json({ error: json?.error?.message || 'Stripe error' })
    }
    return res.status(200).json({ url: json.url })
  } catch (err) {
    return res.status(502).json({ error: String(err) })
  }
}
