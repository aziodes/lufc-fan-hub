// Rebuilds data/snapshot.json — the data index.html falls back to when the
// live endpoints fail.
//
// Why this exists: the fallbacks used to be hand-written arrays in index.html,
// and they went stale three times in one month (played fixtures listed as
// upcoming, an expired countdown stuck on "KICK OFF!", a squad 11 players out
// of date). This snapshot is refreshed by .github/workflows/snapshot.yml, so
// nobody has to remember to sweep it — and the page date-filters it on read,
// so even an old snapshot never shows a past game as upcoming.
//
// Reads through the deployed site's own proxies, so it needs no API key here.
// Each section is refreshed independently: if one source fails, the previous
// snapshot's copy of that section is kept rather than wiped. The file is only
// rewritten when some section's data actually changed, and each section's
// `asOf` is the time its data was last written — so the page's "snapshot"
// label can only ever understate how fresh the data is, never overstate it.
//
// Usage: node scripts/snapshot.mjs   (SITE_URL overrides the default origin)
// Exits 1 if any section failed, so a broken source turns the Action red.

import { readFile, writeFile, mkdir } from 'node:fs/promises'

const SITE = process.env.SITE_URL || 'https://lufc-fan-hub.vercel.app'
const TEAM_ID = 341
const OUT = new URL('../data/snapshot.json', import.meta.url)

// Same rule as SEASON_START in index.html: Aug–Dec => this year's season
const now = new Date()
const SEASON = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1

async function football(path) {
  const r = await fetch(`${SITE}/api/football?path=${encodeURIComponent(path)}`)
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}`)
  return r.json()
}

// Only the fields the page's renderers read — a raw season is ~40 KB, this is ~6 KB
const slim = m => ({
  utcDate: m.utcDate,
  status: m.status,
  matchday: m.matchday,
  competition: { code: m.competition?.code, name: m.competition?.name },
  homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
  awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
  score: { fullTime: m.score?.fullTime ?? { home: null, away: null } },
})

const byDate = (a, b) => new Date(a.utcDate) - new Date(b.utcDate)

const SECTIONS = {
  // The whole season in one call: the page derives upcoming fixtures (by date)
  // and recent results (FINISHED) from it, plus last season's closing results
  // for the rollover window before this season's first game is played.
  async matches() {
    const cur = await football(`/teams/${TEAM_ID}/matches?season=${SEASON}`)
    const matches = (cur.matches || []).map(slim).sort(byDate)
    if (!matches.length) throw new Error('season has no matches')

    let prevResults = []
    if (!matches.some(m => m.status === 'FINISHED')) {
      const prev = await football(`/teams/${TEAM_ID}/matches?status=FINISHED&season=${SEASON - 1}`)
      prevResults = (prev.matches || []).map(slim).sort(byDate).slice(-6)
    }
    return { season: SEASON, matches, prevResults }
  },

  async standings() {
    for (const comp of ['PL', 'ELC']) {
      try {
        const d = await football(`/competitions/${comp}/standings`)
        const row = (d.standings?.[0]?.table || []).find(t => t.team.id === TEAM_ID)
        if (row) {
          const { team, ...rest } = row
          return { comp, season: { startDate: d.season?.startDate }, row: rest }
        }
      } catch {}
    }
    throw new Error('team not found in PL or ELC table')
  },

  async squad() {
    const r = await fetch(`${SITE}/api/squad`)
    if (!r.ok) throw new Error(`/api/squad -> HTTP ${r.status}`)
    const d = await r.json()
    // Same sanity floor the page applies before trusting the live squad
    if (!Array.isArray(d.squad) || d.squad.length < 15) throw new Error('squad looks truncated')
    return { players: d.squad }
  },
}

const strip = s => { if (!s) return s; const { asOf, ...rest } = s; return rest }

let prev = {}
try { prev = JSON.parse(await readFile(OUT, 'utf8')) } catch {}

const next = {}
const failed = []
let changed = false

for (const [name, build] of Object.entries(SECTIONS)) {
  try {
    const data = await build()
    if (JSON.stringify(data) === JSON.stringify(strip(prev[name]))) {
      next[name] = prev[name]
      console.log(`${name}: unchanged`)
    } else {
      next[name] = { asOf: now.toISOString(), ...data }
      changed = true
      console.log(`${name}: updated`)
    }
  } catch (err) {
    failed.push(name)
    console.error(`${name}: FAILED (${err.message}) — keeping previous copy`)
    if (prev[name]) next[name] = prev[name]
  }
}

if (changed) {
  await mkdir(new URL('.', OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(next, null, 1) + '\n')
  console.log('wrote data/snapshot.json')
} else {
  console.log('no changes — data/snapshot.json left as is')
}

if (failed.length) {
  console.error(`::error::snapshot sections failed: ${failed.join(', ')}`)
  process.exit(1)
}
