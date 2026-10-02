// Fan poll: Man of the Match for Leeds' most recent result.
//
// The question picks itself — it is always about the latest FINISHED Leeds
// match, so it rolls over after every game and can't go stale the way a fixed
// "Player of the Season" question did. Options are the current first-team
// squad (same Wikipedia source as the Squad section). The server decides both
// the match and the valid options; the browser only ever submits a choice, so
// nobody can invent a candidate or vote on an arbitrary key.
//
// Votes live in Upstash Redis (Vercel Marketplace -> Storage -> Upstash Redis
// -> Connect to this project), which injects KV_REST_API_URL/KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL/_TOKEN). Without them the poll reports
// `configured: false` and the page shows it as not switched on yet — it never
// shows invented numbers.
//
//   GET  /api/poll                          -> current match, options, counts
//   POST /api/poll {match, choice}          -> records a vote, returns counts
//
// Abuse limits are deliberately light (it's a fan poll): one vote per browser
// is enforced client-side, and at most VOTES_PER_IP votes per match per IP
// server-side — loose enough for a pub full of fans on one Wi-Fi.

import crypto from 'node:crypto'
import { getSquad } from './_squad-source.js'

const TEAM_ID = 341
const VOTES_PER_IP = 5
const TTL = 120 * 24 * 3600   // keep a match's tally ~a season

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

async function redis(commands) {
  const r = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`)
  const out = await r.json()
  const err = out.find(x => x.error)
  if (err) throw new Error(`Redis: ${err.error}`)
  return out.map(x => x.result)
}

// Warm-instance cache: the current match and squad change at most a few times
// a week, and every vote needs them to validate against
let cached = null, cachedAt = 0
async function currentPoll() {
  if (cached && Date.now() - cachedAt < 10 * 60 * 1000) return cached

  const key = process.env.FOOTBALL_DATA_KEY
  if (!key) throw new Error('FOOTBALL_DATA_KEY not configured')
  // limit=N returns the most recent N finished matches
  const r = await fetch(
    `https://api.football-data.org/v4/teams/${TEAM_ID}/matches?status=FINISHED&limit=1`,
    { headers: { 'X-Auth-Token': key } }
  )
  if (!r.ok) throw new Error(`football-data ${r.status}`)
  const m = (await r.json()).matches?.[0] || null

  const { squad } = await getSquad()
  cached = {
    match: m && {
      id: String(m.id),
      utcDate: m.utcDate,
      competition: { code: m.competition?.code, name: m.competition?.name },
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      score: { fullTime: m.score.fullTime },
    },
    options: squad.map(p => p.name),
  }
  cachedAt = Date.now()
  return cached
}

// HGETALL comes back as a flat [field, value, field, value, …] list
function toCounts(flat, options) {
  const counts = Object.fromEntries(options.map(o => [o, 0]))
  for (let i = 0; i < (flat || []).length; i += 2) {
    if (flat[i] in counts) counts[flat[i]] = Number(flat[i + 1]) || 0
  }
  return counts
}

export default async function handler(req, res) {
  const configured = Boolean(REDIS_URL && REDIS_TOKEN)

  let poll
  try {
    poll = await currentPoll()
  } catch (err) {
    return res.status(502).json({ error: String(err.message || err) })
  }
  const { match, options } = poll
  const base = { configured, open: Boolean(match), match, options }

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30')
    if (!configured || !match) return res.status(200).json({ ...base, counts: null, total: 0 })
    try {
      const [flat] = await redis([['HGETALL', `poll:${match.id}`]])
      const counts = toCounts(flat, options)
      return res.status(200).json({ ...base, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) })
    } catch (err) {
      return res.status(502).json({ ...base, error: String(err.message || err) })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' })
  res.setHeader('Cache-Control', 'no-store')
  if (!configured) return res.status(503).json({ error: 'Poll not switched on yet' })
  if (!match) return res.status(409).json({ error: 'No match to vote on yet' })

  const { match: votedMatch, choice } = req.body || {}
  if (String(votedMatch) !== match.id) {
    return res.status(409).json({ error: 'Voting has moved on to the latest match', match })
  }
  if (typeof choice !== 'string' || !options.includes(choice)) {
    return res.status(400).json({ error: 'Not a current squad player' })
  }

  // Hash, never store, the IP — it only needs to be countable per match
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const ipKey = `poll:${match.id}:ip:` + crypto.createHash('sha256').update(`${match.id}:${ip}`).digest('hex').slice(0, 24)

  try {
    const [n] = await redis([['INCR', ipKey], ['EXPIRE', ipKey, TTL]])
    if (n > VOTES_PER_IP) return res.status(429).json({ error: 'Vote limit reached for this match' })

    const [, , flat] = await redis([
      ['HINCRBY', `poll:${match.id}`, choice, 1],
      ['EXPIRE', `poll:${match.id}`, TTL],
      ['HGETALL', `poll:${match.id}`],
    ])
    const counts = toCounts(flat, options)
    return res.status(200).json({ ...base, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) })
  } catch (err) {
    return res.status(502).json({ error: String(err.message || err) })
  }
}
