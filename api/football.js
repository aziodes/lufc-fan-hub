// Serverless proxy for football-data.org.
//
// Two reasons this exists:
//  1. The free tier returns `Access-Control-Allow-Origin: http://localhost`, so
//     the browser cannot call it from any deployed origin. Server-side has no
//     CORS restriction.
//  2. It keeps the API key out of the client bundle.
//
// Set FOOTBALL_DATA_KEY in the Vercel project environment.

const UPSTREAM = 'https://api.football-data.org/v4';

// Only the paths this site actually uses — prevents the function becoming an
// open proxy that burns the rate limit for someone else.
const ALLOWED = [
  /^\/teams\/\d+$/,
  /^\/teams\/\d+\/matches(\?.*)?$/,
  /^\/competitions\/[A-Z]{2,4}\/standings(\?.*)?$/,
];

export default async function handler(req, res) {
  const path = req.query.path;

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing path parameter' });
  }
  if (!ALLOWED.some(re => re.test(path))) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    return res.status(500).json({ error: 'FOOTBALL_DATA_KEY not configured' });
  }

  try {
    const upstream = await fetch(UPSTREAM + path, {
      headers: { 'X-Auth-Token': key },
    });
    const body = await upstream.text();

    // Live scores need a short TTL; everything else can sit on the CDN longer.
    const isLive = path.includes('IN_PLAY') || path.includes('PAUSED');
    res.setHeader(
      'Cache-Control',
      isLive
        ? 's-maxage=30, stale-while-revalidate=60'
        : 's-maxage=300, stale-while-revalidate=600'
    );
    res.setHeader('Content-Type', 'application/json');
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: String(err) });
  }
}
