# LUFC Fan Hub

Unofficial Leeds United fan site. Single-file vanilla HTML/CSS/JS — no build step.

## Branches

| Branch | What it is |
|--------|-----------|
| `main` | v1 — mixed live/static baseline |
| `live-fork` | Working branch — all sections free-API backed or removed |

## Preview

```bash
python3 -m http.server 7723 --directory .
# open http://localhost:7723/lufc-standalone.html
```

Or open `lufc-standalone.html` directly in a browser (some API calls may CORS-fail without a server).

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

## Configuration

Edit the `CFG` block near the top of `lufc-standalone.html`:

```js
const CFG = {
  API_KEY: '',          // football-data.org free key → https://www.football-data.org/client/register
  // Optional upgrades — leave empty to use static fallbacks
  GISCUS_REPO: '',          // e.g. 'yourname/lufc-fan-hub' — https://giscus.app
  GISCUS_REPO_ID: '',
  GISCUS_CATEGORY_ID: '',
  JSONBIN_BIN_ID: '',       // https://jsonbin.io (free) — shared poll votes
};
```

## Deploying

Single file — drop on any static host (Vercel, Netlify, GitHub Pages):

```bash
# Vercel example
vercel --prod
```

No build config needed. Point root to `lufc-standalone.html` or rename to `index.html`.

## Not affiliated with Leeds United AFC.
