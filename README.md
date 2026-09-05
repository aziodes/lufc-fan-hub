# LUFC Fan Hub

Unofficial Leeds United fan site. Single-file vanilla HTML/CSS/JS — no build step.

## Branches

| Branch | What it is |
|--------|-----------|
| `main` | v1 — mixed live/static baseline |
| `live-fork` | Working branch — all sections free-API backed or removed |

## Layout

| Path | What |
|------|------|
| `index.html` | The site. Single self-contained file, no build step. |
| `api/football.js` | Serverless proxy for football-data.org (see below). |
| `api/news.js` | Serverless proxy for the Google News RSS feed. |
| `api/squad.js` | Squad source, parsed from Wikipedia (kept current post-transfer-window better than football-data.org's free tier does). |
| `api/shop.js` / `api/checkout.js` / `api/stripe-webhook.js` / `api/_shop-catalog.js` | Real e-commerce: Stripe Checkout -> Printful fulfillment. See `MERCH_SETUP.md`. |
| `legacy-react/` | The original React/Vite version, superseded. Kept for reference; not built or deployed. |

## Preview

```bash
python3 -m http.server 7723 --directory .
# open http://localhost:7723/index.html
```

Or open `index.html` directly in a browser (some API calls may CORS-fail without a server).

## Live data sources

| Section | Source |
|---------|--------|
| Ticker + News | Google News RSS via allorigins.win proxy |
| Fixtures / Results / Standings | football-data.org v4 (free tier, Team ID 341) |
| Squad | football-data.org v4 |
| Match Reports | Generated from results API |
| Gallery | Wikimedia Commons API (no key, CORS-enabled) |
| Forum | Giscus (GitHub Discussions) — see setup below |
| Poll votes | localStorage / JSONbin.io (optional) |
| Shop | Printful (products/fulfillment) + Stripe (payment) — see `MERCH_SETUP.md` |

## Configuration

Football data goes through `api/football.js`, a serverless proxy. It exists because
football-data.org's free tier returns `Access-Control-Allow-Origin: http://localhost`,
so the browser cannot call it from a deployed origin — and it keeps the key server-side.

Set the key in the hosting environment (not in the page):

```bash
vercel env add FOOTBALL_DATA_KEY production
```

Get a free key at https://www.football-data.org/client/register

Optional upgrades, in the `CFG` block near the top of `index.html` — leave empty to
use the static fallbacks:

```js
GISCUS_REPO / GISCUS_REPO_ID / GISCUS_CATEGORY_ID  // live forum, https://giscus.app
JSONBIN_BIN_ID                                     // shared poll votes, https://jsonbin.io
```

Giscus needs a **public** repo with Discussions enabled.

## Merchandise

The Shop section is real e-commerce, not a demo — Stripe Checkout for payment,
Printful for print-on-demand fulfillment. It ships with an empty product
catalog and shows an honest "opening soon" state until you configure it.
Setup (two accounts, some keys, a licensing decision that's on you):
see `MERCH_SETUP.md`.

## Deploying

Pushing to the connected branch deploys automatically. To deploy by hand:

```bash
vercel --prod
```

## Local development

`python3 -m http.server` serves the page but **not** `api/football.js`, so the football
sections fall back to static data locally. To exercise the proxy, run:

```bash
vercel dev
```

## Not affiliated with Leeds United AFC.
