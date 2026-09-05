// Product listing for the Shop section.
//
// Looks up each configured product in _shop-catalog.js against Printful's
// Sync Variant API to get its real current name/image/availability — so if
// you pause or delete a product in your Printful dashboard, it disappears
// here too instead of the site continuing to sell something that no longer
// exists.
//
// Needs PRINTFUL_API_KEY (Settings -> API in your Printful dashboard) once
// CATALOG in _shop-catalog.js is non-empty. Until then this returns
// {configured:false} and the client shows the "opening soon" fallback.

import { CATALOG } from './_shop-catalog.js'

export default async function handler(req, res) {
  if (!CATALOG.length) {
    return res.status(200).json({ configured: false, products: [] })
  }

  const key = process.env.PRINTFUL_API_KEY
  if (!key) {
    return res.status(200).json({
      configured: false,
      products: [],
      error: 'CATALOG has products but PRINTFUL_API_KEY is not set',
    })
  }

  try {
    const products = await Promise.all(
      CATALOG.map(async item => {
        const r = await fetch(
          `https://api.printful.com/store/variants/${item.printfulSyncVariantId}`,
          { headers: { Authorization: `Bearer ${key}` } }
        )
        if (!r.ok) return { ...item, available: false }

        const json = await r.json()
        const variant = json?.result
        return {
          id: item.id,
          name: variant?.name || item.name,
          image: variant?.files?.find(f => f.type === 'preview')?.preview_url || variant?.product?.image,
          priceCents: item.priceCents,
          currency: item.currency || 'gbp',
          available: true,
        }
      })
    )

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800')
    return res.status(200).json({
      configured: true,
      products: products.filter(p => p.available),
    })
  } catch (err) {
    return res.status(502).json({ configured: false, products: [], error: String(err) })
  }
}
