# LUFC Fan Hub

Unofficial Leeds United fan site. One self-contained `index.html` (vanilla
HTML/CSS/JS, no build step) plus a handful of serverless functions under
`api/`. Deployed on Vercel; **pushing to `main` deploys automatically.**

Live: https://lufc-fan-hub.vercel.app

## Layout

| Path | What |
|------|------|
| `index.html` | The whole site. No build step — open it or serve the folder. |
| `api/football.js` | Proxy for football-data.org (fixtures, results, standings). |
| `api/news.js` | Proxy for the Google News RSS feed (news cards + ticker). |
| `api/squad.js` | Squad, parsed from Wikipedia — keeps up with transfers better than football-data.org's free tier. |
| `api/shop.js`, `api/checkout.js`, `api/stripe-webhook.js`, `api/_shop-catalog.js` | Real store: Stripe Checkout → Printful fulfillment. See `MERCH_SETUP.md`. |
| `legacy-react/` | The original React/Vite version, superseded. Kept for reference; not built or deployed. |

## Data sources

Every section is either live from a free source or shows an honest "preview /
opening soon" fallback — nothing is fabricated.

| Section | Source | Fallback when it fails |
|---------|--------|------------------------|
| News + Ticker | `api/news.js` (Google News RSS); allorigins.win as second try | static preview cards |
| Fixtures / Results / Standings / Match Reports | `api/football.js` (football-data.org v4, Team ID 341) | static snapshot |
| Squad | `api/squad.js` (Wikipedia); football-data.org as fallback | static snapshot |
| Gallery | Wikimedia Commons API (no key, CORS-enabled) | emoji-tile placeholders |
| Forum | Giscus (GitHub Discussions) — **live** | static preview threads |
| Poll | localStorage (per-browser); JSONbin.io if configured | — |
| Shop | Stripe + Printful — **not configured**, shows "opening soon" | — |

## Configuration

Server-side keys live in the Vercel project environment, never in the page:

```bash
vercel env add FOOTBALL_DATA_KEY production     # free: https://www.football-data.org/client/register
```

The football proxy exists because football-data.org's free tier pins
`Access-Control-Allow-Origin` to `http://localhost` — the browser can't call
it from a deployed origin at all, so it has to go server-side.

Client-side config is the `CFG` block near the top of `index.html`:

- **Forum (live).** `GISCUS_REPO`, `GISCUS_REPO_ID`, `GISCUS_CATEGORY`,
  `GISCUS_CATEGORY_ID` are set to `aziodes/lufc-fan-hub` / `Announcements`.
  Discussions is enabled on the repo and the Giscus GitHub App
  (https://github.com/apps/giscus) is installed on it — both are required and
  both are done.
- **Poll (optional).** Set `JSONBIN_BIN_ID` to share votes across visitors;
  empty means per-browser localStorage only.

## Merchandise

The Shop is real e-commerce — Stripe Checkout for payment, Printful for
print-on-demand fulfillment — shipped with an empty catalog so it shows
"opening soon" rather than fake products. Going live needs a Printful
account, a Stripe account, a trademark/licensing decision, and three env
vars. All of it is in `MERCH_SETUP.md`.

## Local development

```bash
python3 -m http.server 7723 --directory .
# http://localhost:7723/index.html
```

A plain static server doesn't run anything under `api/`, so the News,
Fixtures, Squad and Shop sections fall back to their static/preview states
locally. To exercise the functions, use `vercel dev` instead.

## Deploying

Push to `main`. To deploy by hand: `vercel --prod`.

## Not affiliated with Leeds United AFC.
