// Serverless squad endpoint for the Squad section. The Wikipedia fetch + parse
// lives in _squad-source.js (shared with api/poll.js) — see there for why this
// site uses Wikipedia rather than football-data.org for the squad.

import { getSquad } from './_squad-source.js'

export default async function handler(req, res) {
  try {
    const { page, revised, squad, onLoan } = await getSquad()
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    return res.status(200).json({ source: 'wikipedia', page, revised, squad, onLoan })
  } catch (err) {
    // The client falls back to football-data.org, then the snapshot
    return res.status(502).json({ error: String(err.message || err) })
  }
}
