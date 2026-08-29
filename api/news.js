// Serverless proxy for the Google News RSS feed.
//
// Replaces the third-party allorigins.win CORS proxy, which is a single point of
// failure outside our control (it was returning connection failures, silently
// dropping the site's news section to static fallback data).
//
// Returns the raw RSS XML; the client parses it with DOMParser.

const FEED = 'https://news.google.com/rss/search';

export default async function handler(req, res) {
  const q = typeof req.query.q === 'string' && req.query.q.trim()
    ? req.query.q.trim().slice(0, 120)
    : '"Leeds United"';

  const url = `${FEED}?${new URLSearchParams({
    q,
    hl: 'en-GB',
    gl: 'GB',
    ceid: 'GB:en',
  })}`;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LUFCFanHub/1.0)' },
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream ${upstream.status}` });
    }
    const xml = await upstream.text();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return res.status(200).send(xml);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: String(err) });
  }
}
