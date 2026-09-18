# Turning the Shop section on

The code is real and working — Stripe Checkout for payment, Printful for
print-and-ship fulfillment. What's missing is entirely stuff only you can do:
two accounts, a licensing call, and pasting a few keys.

## 0. Read this first: the licensing question

This is an unofficial fan site (the footer already says so). Printing and
selling items that use Leeds United's crest, name, or colours in a way that
implies official merchandise is a trademark issue — the club's own disclaimer
elsewhere on this site doesn't cover commercial sale of branded goods. The
club actively enforces this: unauthorised use of a registered mark on goods
can be a **criminal offence** under s.92 Trade Marks Act 1994, not just a
civil letter (leedsunited.com/en/news/leeds-united-brand-protection).

**Decision (2026-09-18): "LEEDS" and "LS11" only.** Not "LUFC" / "Leeds
United" / "Leeds Utd" — those sit inside the club's actual registered word
marks (Leeds United Football Club Limited holds 7 registered marks, mostly
in the clothing class); dropping the crest and keeping the name as text is
not a workaround, word marks are if anything easier to enforce than a logo.
Not "Dirty Leeds" either — that's already a registered trademark, but held
by an unrelated third party (Dirty Leeds Company), not the club, so it swaps
one infringement risk for a different, currently-active one. "LEEDS" alone
and the "LS11" postcode are genuinely lower risk: place names and postcodes
aren't ownable as general trademarks.

**That covers the words. It does not cover the look.** Passing off doesn't
require any word or logo at all — it asks whether a reasonable buyer would
take the item for official merch. Royal blue + gold laid out in a kit-style
block, or a badge-shaped composition, reads as "official" regardless of what
text is or isn't on it, and is the same exposure as using the name — just
without a register entry to check first. So alongside the text rule: no
kit-style two-tone layout, no badge-shaped composition, no colour pairing in
club proportions. An accent colour used generically is fine; recreating the
kit's look is not, independent of whether "LEEDS" is printed on it.

Options, safest first:
- **Fan-original designs, text-only, no kit-style layout** — "LEEDS" / "LS11"
  text art, Yorkshire-themed imagery, your own illustration. Current plan.
- **Ask the club.** Some clubs run official licensee/creator programs.
- **Full crest/branding/kit-look reproduction** — the highest-risk option.
  That's a legal call for you to make, not something to route around
  technically, and no combination of wording changes it.

None of this is legal advice — it's my read of public sources, not a
solicitor's. Worth a real one before spending money on inventory, given the
criminal-offence framing above.

Nothing below cares which you pick — it's the same pipeline either way. This
step is on you regardless of the code.

## 1. Printful account

1. Sign up at printful.com (free).
2. Create a Store (Dashboard → Stores → add a "Manual Order / API" store —
   you don't need Shopify/Etsy/etc., you're calling the API directly).
3. Upload your artwork and sync at least one product. Note its **sync variant
   ID** (Products → click a variant → the ID is in the URL/details panel).
4. Dashboard → Settings → API → generate a **Private Token**. This is
   `PRINTFUL_API_KEY`.
5. Printful bills *you* at cost price for every order that gets confirmed —
   add a payment method under Billing before going live, or fulfillment will
   fail after a customer has already paid you via Stripe.

## 2. Stripe account

1. Sign up at stripe.com (free to create; they take a % + fixed fee per
   transaction, no monthly cost).
2. Developers → API keys → copy the **Secret key** (starts `sk_live_...` in
   live mode, `sk_test_...` while testing). This is `STRIPE_SECRET_KEY`.
3. Developers → Webhooks → Add endpoint:
   - URL: `https://lufc-fan-hub.vercel.app/api/stripe-webhook`
   - Event to send: `checkout.session.completed`
4. Copy that endpoint's **Signing secret** (`whsec_...`). This is
   `STRIPE_WEBHOOK_SECRET`.
5. Test in Stripe's **test mode** first (test card `4242 4242 4242 4242`, any
   future expiry, any CVC) — confirm a real order lands in your Printful
   dashboard before flipping to live keys.

## 3. Set the environment variables

```bash
vercel env add PRINTFUL_API_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
```

Repeat for `preview` / `development` if you want the shop live there too.

## 4. Add products

Edit `api/_shop-catalog.js` — one entry per sync variant, with the retail
price you're setting (Printful's cost price is separate and shown in your
dashboard; the difference is your margin):

```js
export const CATALOG = [
  { id: 'home-shirt-m', printfulSyncVariantId: 123456789, name: 'Fan Home Shirt — M', priceCents: 3499, currency: 'gbp' },
]
```

Commit and push. `/api/shop` will start returning real products, and the
"Opening Soon" badge on the site flips to "Shop Open" automatically.

## 5. What's already handled for you

- Card details never touch this site — Stripe's own hosted Checkout page
  collects them.
- Price and product name are always read from `_shop-catalog.js` server-side;
  nothing the browser sends can change what gets charged.
- The webhook signature is verified before any order is created, so a request
  claiming to be Stripe that isn't gets rejected.
- If `CATALOG` is empty or a key is missing, the site shows the honest
  "opening soon" state — it never fabricates products or prices.

## Known limitation

If Stripe redelivers the webhook (it retries on any failure), the same paid
order could be submitted to Printful twice — there's no de-duplication store
wired up yet. Low risk at fan-site volume; worth adding a persistent
idempotency check (e.g. Vercel KV) before this does meaningful volume.
