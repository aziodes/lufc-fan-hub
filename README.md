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
| `api/squad.js`, `api/_squad-source.js` | Squad, parsed from Wikipedia — keeps up with transfers better than football-data.org's free tier. |
| `api/poll.js` | Fan poll: Man of the Match for the latest result, votes in Upstash Redis. |
| `api/shop.js`, `api/checkout.js`, `api/stripe-webhook.js`, `api/_shop-catalog.js` | Real store: Stripe Checkout → Printful fulfillment. See `MERCH_SETUP.md`. |
| `data/snapshot.json` | Fallback data for the football sections. Generated — don't hand-edit. |
| `scripts/snapshot.mjs`, `.github/workflows/snapshot.yml` | Rebuild the snapshot daily from the live endpoints. |
| `legacy-react/` | The original React/Vite version, superseded. Kept for reference; not built or deployed. |

## Data sources

Every section is either live from a free source or falls back to something
honest and dated — nothing is fabricated.

| Section | Source | Fallback when it fails |
|---------|--------|------------------------|
| News + Ticker | `api/news.js` (Google News RSS); allorigins.win as second try | link to Google News (no stored headlines) |
| Fixtures / Results / Standings / Match Reports | `api/football.js` (football-data.org v4, Team ID 341) | `data/snapshot.json` |
| Squad | `api/squad.js` (Wikipedia); football-data.org as fallback | `data/snapshot.json` |
| Gallery | Wikimedia Commons API (no key, CORS-enabled) | emoji-tile placeholders |
| Forum | Giscus (GitHub Discussions) — **live** | static preview threads |
| Poll | `api/poll.js` — Man of the Match for Leeds' latest result, current squad as options, votes in Upstash Redis | "not switched on yet" until Redis is connected; never invented numbers |
| Shop | Stripe + Printful — **not configured**, shows "opening soon" | — |

### Fallback snapshot

The fallbacks used to be hand-written arrays in `index.html`. They went stale
three times in one month: played games listed as upcoming, a countdown stuck on
"KICK OFF!", a squad 11 players out of date. Now:

- A GitHub Action (`.github/workflows/snapshot.yml`) runs `scripts/snapshot.mjs`
  daily at 05:17 UTC. It reads through the deployed site's own proxies (no key
  needed) and commits `data/snapshot.json` **only when the data changed** —
  roughly after each match and in transfer windows. Each commit redeploys.
- The page date-filters the snapshot on read, so even an old one never lists a
  played game as upcoming or counts down to a kick-off that's already happened.
- Section badges read `Snapshot · <date>`, the date the data was last written,
  so a fallback can't pass as live.
- If a source breaks, that section keeps its previous copy and the run goes red
  (GitHub emails you). Run it by hand from the Actions tab (`workflow_dispatch`)
  or locally with `node scripts/snapshot.mjs`.

## Configuration

Server-side keys live in the Vercel project environment, never in the page:

```bash
vercel env add FOOTBALL_DATA_KEY production     # free: https://www.football-data.org/client/register
```

**Poll vote store.** Vercel dashboard → this project → Storage → Upstash
Redis → Create/Connect (free tier). That injects `KV_REST_API_URL` and
`KV_REST_API_TOKEN` (the `UPSTASH_REDIS_REST_*` names work too); redeploy and the
poll switches on. The question picks itself — always the latest finished
match — so there's nothing to update between games. One vote per browser
per match, at most 5 per IP per match; IPs are only stored as hashes.

The football proxy exists because football-data.org's free tier pins
`Access-Control-Allow-Origin` to `http://localhost` — the browser can't call
it from a deployed origin at all, so it has to go server-side.

Client-side config is the `CFG` block near the top of `index.html`:

- **Forum (live).** `GISCUS_REPO`, `GISCUS_REPO_ID`, `GISCUS_CATEGORY`,
  `GISCUS_CATEGORY_ID` are set to `aziodes/lufc-fan-hub` / `Announcements`.
  Discussions is enabled on the repo and the Giscus GitHub App
  (https://github.com/apps/giscus) is installed on it — both are required and
  both are done.

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

A plain static server doesn't run anything under `api/`, so locally the
football sections show the snapshot, News shows its link-out card, and the Shop
shows "opening soon". To exercise the functions, use `vercel dev` instead.

## Deploying

Push to `main`. To deploy by hand: `vercel --prod`.

## Not affiliated with Leeds United AFC.
