// Single source of truth for what's sellable and at what price.
//
// This is NOT the Printful catalog — it's OUR mapping of "this product card
// on the site" -> "this exact Printful sync variant" -> "this is what we
// charge for it." Both api/shop.js (product listing) and api/checkout.js
// (payment) import this file, so a card the client sees always corresponds to
// a real fulfillable variant, and the price charged always matches the price
// shown — neither is ever taken from client input.
//
// TO ADD A REAL PRODUCT:
//   1. In your Printful dashboard, sync a product (upload your own artwork —
//      this is the step that requires a licensing decision; see
//      MERCH_SETUP.md) and note its numeric sync variant ID.
//   2. Add a row below with that variantId and your retail price in pence.
//   3. Printful's Catalog API supplies the product name/image/description
//      automatically — you only decide price and which variants sell.
//
// Leave this array empty and the Shop section shows "opening soon" instead
// of fabricating products, the same way every other optional section here
// degrades when it isn't configured.

export const CATALOG = [
  // {
  //   id: 'home-shirt-m',                 // stable id for cart/checkout requests
  //   printfulSyncVariantId: 123456789,    // from your Printful Store dashboard
  //   name: 'Fan Home Shirt — M',
  //   priceCents: 3499,                    // £34.99 — YOU set this; Printful bills you at cost
  //   currency: 'gbp',
  // },
]

export function findProduct(id) {
  return CATALOG.find(p => p.id === id) || null
}
