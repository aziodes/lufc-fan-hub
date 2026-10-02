// Squad source, parsed from Wikipedia. Shared by api/squad.js (the Squad
// section) and api/poll.js (Man of the Match options), so both see one squad.
//
// Why not football-data.org (which every other football section here uses):
// its free tier lags badly on squad changes and exposes no shirt numbers. On
// 2026-09-02, a day after deadline day, it still listed Gnonto and Ramazani
// (both out on loan) and had neither Bahoya nor Bard (both signed 1 Sep).
// Wikipedia's club page had all four correct, carried official squad numbers,
// and listed loanees separately — so it is the better source for this section.
//
// Tradeoff: Wikipedia is user-editable. The parse below is deliberately strict
// and the caller falls back to football-data.org if this returns anything that
// doesn't look like a real squad.

const WIKI = 'https://en.wikipedia.org/w/api.php';
const PAGE = 'Leeds United F.C.';

// Wikipedia's {{fs player}} uses 3-letter FIFA/IOC codes; the client's FLAGS
// map is keyed by full country name, so normalise here.
const NAT = {
  ENG: 'England', SCO: 'Scotland', WAL: 'Wales', NIR: 'Northern Ireland',
  IRL: 'Republic of Ireland', FRA: 'France', ESP: 'Spain', GER: 'Germany',
  NED: 'Netherlands', BEL: 'Belgium', POR: 'Portugal', ITA: 'Italy',
  USA: 'United States', BRA: 'Brazil', ARG: 'Argentina', DEN: 'Denmark',
  SWE: 'Sweden', NOR: 'Norway', POL: 'Poland', GHA: 'Ghana', NGA: 'Nigeria',
  SEN: 'Senegal', JAM: 'Jamaica', AUS: 'Australia', CAN: 'Canada', JPN: 'Japan',
  KOR: 'South Korea', SRB: 'Serbia', CRO: 'Croatia', AUT: 'Austria',
  SUI: 'Switzerland', MAR: 'Morocco', CMR: 'Cameroon', ALG: 'Algeria',
  TUR: 'Turkey', GRE: 'Greece', HUN: 'Hungary', CZE: 'Czech Republic',
  SVK: 'Slovakia', ROU: 'Romania', FIN: 'Finland', ISL: 'Iceland',
  KVX: 'Kosovo', ALB: 'Albania', SVN: 'Slovenia', UKR: 'Ukraine',
  MNE: 'Montenegro', MKD: 'North Macedonia', BIH: 'Bosnia-Herzegovina',
  URU: 'Uruguay', COL: 'Colombia', CHI: 'Chile', MEX: 'Mexico', EGY: 'Egypt',
  CIV: 'Ivory Coast', TUN: 'Tunisia', BUL: 'Bulgaria', SUR: 'Suriname',
  RUS: 'Russia', NZL: 'New Zealand', PAR: 'Paraguay', VEN: 'Venezuela',
  ECU: 'Ecuador', PER: 'Peru', VIE: 'Vietnam', CHN: 'China', IND: 'India',
};

const POS = { GK: 'GK', DF: 'DEF', MF: 'MF', FW: 'FW' };

// {{fs player|no=1|nat=ENG|pos=GK|name=[[James Trafford]]}}
// Handles a missing number, and both [[Link]] and [[Link|Display]] names.
const PLAYER_RE = /\{\{fs player\s*\|\s*no=(\d*)\s*\|\s*nat=([A-Za-z]{2,4})\s*\|\s*pos=([A-Z]{2})\s*\|\s*name=\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// "Daniel James (footballer)" and "Harry Wilson (footballer, born 1997)" are
// article titles, not names — strip the disambiguator.
function cleanName(link, display) {
  return (display || link).replace(/\s*\([^)]*\)\s*$/, '').trim()
}

function parseSection(wikitext, heading) {
  const start = wikitext.indexOf(`===${heading}===`)
  if (start === -1) return null
  // Section runs until the next heading of the same or higher level
  const rest = wikitext.slice(start + heading.length + 6)
  const next = rest.search(/\n==/)
  const body = next === -1 ? rest : rest.slice(0, next)

  const players = []
  let m
  PLAYER_RE.lastIndex = 0
  while ((m = PLAYER_RE.exec(body)) !== null) {
    const [, no, nat, pos, link, display] = m
    players.push({
      number: no ? Number(no) : null,
      name: cleanName(link, display),
      nationality: NAT[nat.toUpperCase()] || nat,
      position: POS[pos] || pos,
    })
  }
  return players
}

// Returns { revised, squad, onLoan }. Throws if Wikipedia is unreachable or the
// page structure changed under us — a half-parsed squad is never returned.
export async function getSquad() {
  const url = `${WIKI}?${new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    titles: PAGE,
    rvslots: 'main',
    rvprop: 'content|timestamp',
    formatversion: '2',
    format: 'json',
  })}`

  const upstream = await fetch(url, {
    headers: { 'User-Agent': 'LUFCFanHub/1.0 (unofficial fan site)' },
  })
  if (!upstream.ok) throw new Error(`Wikipedia ${upstream.status}`)

  const json = await upstream.json()
  const rev = json?.query?.pages?.[0]?.revisions?.[0]
  const wikitext = rev?.slots?.main?.content
  if (!wikitext) throw new Error('No wikitext in response')

  const squad = parseSection(wikitext, 'First-team squad')
  const onLoan = parseSection(wikitext, 'Out on loan') || []

  // Strict sanity gate — if the page structure changed under us, say so
  // rather than serving a half-parsed squad. Callers fall back.
  if (!squad || squad.length < 15) {
    throw new Error(`Squad parse failed or implausibly small (${squad ? squad.length : 0})`)
  }
  return { page: PAGE, revised: rev.timestamp, squad, onLoan }
}
