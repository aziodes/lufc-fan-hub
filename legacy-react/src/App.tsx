import { useState, useEffect, useRef } from 'react'
import './index.css'

// ─── Data ───────────────────────────────────────────────────────────────────

const NEWS = [
  {
    id: 1,
    title: "Season Review: A Brilliant Return to the Top Flight",
    excerpt: "After two seasons away, Leeds United's homecoming to the Premier League was everything the fans dreamed of — grit, flair and Elland Road rocking every matchday.",
    date: "19 May 2025",
    category: "Club News",
  },
  {
    id: 2,
    title: "Transfer Window: Who Could Be Heading to LS11?",
    excerpt: "With the summer window approaching, sources close to the club suggest at least three high-profile signings are in advanced stages of negotiation.",
    date: "15 May 2025",
    category: "Transfers",
  },
  {
    id: 3,
    title: "Farke's Men Eye European Football Next Season",
    excerpt: "A strong second half of the campaign has the Whites sitting in contention for a European place — something the club hasn't achieved since 2001.",
    date: "10 May 2025",
    category: "Premier League",
  },
]

const FIXTURES = [
  { opponent: "Arsenal", date: "24 May 2025", venue: "A", competition: "PL" },
  { opponent: "Chelsea", date: "31 May 2025", venue: "H", competition: "PL" },
  { opponent: "Aston Villa", date: "7 Jun 2025", venue: "A", competition: "PL" },
  { opponent: "Newcastle Utd", date: "14 Jun 2025", venue: "H", competition: "PL" },
  { opponent: "Tottenham", date: "21 Jun 2025", venue: "A", competition: "PL" },
]

const RESULTS = [
  { opponent: "Everton", score: "3–1", result: "W" },
  { opponent: "Brentford", score: "1–1", result: "D" },
  { opponent: "Wolves", score: "2–0", result: "W" },
  { opponent: "Man Utd", score: "0–2", result: "L" },
  { opponent: "Fulham", score: "1–0", result: "W" },
]

const SQUAD = [
  { num: 1,  name: "Illan Meslier",        pos: "GK",  flag: "🇫🇷", form: 82 },
  { num: 2,  name: "Luke Ayling",          pos: "RB",  flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", form: 74 },
  { num: 5,  name: "Joe Rodon",            pos: "CB",  flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", form: 88 },
  { num: 10, name: "Brenden Aaronson",     pos: "MF",  flag: "🇺🇸", form: 79 },
  { num: 11, name: "Jack Harrison",        pos: "LW",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", form: 85 },
  { num: 17, name: "Crysencio Summerville",pos: "FW",  flag: "🇳🇱", form: 91 },
  { num: 9,  name: "Patrick Bamford",      pos: "ST",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", form: 77 },
  { num: 8,  name: "Marc Roca",            pos: "MF",  flag: "🇪🇸", form: 83 },
]

const TIMELINE = [
  { year: "1919", title: "Leeds United Founded", desc: "The club rises from the ashes of Leeds City, beginning a new era for football in Yorkshire.", icon: "⚽" },
  { year: "1969", title: "First Division Champions", desc: "Don Revie's legendary side — Bremner, Hunter, Charlton, Lorimer — claim the First Division title in style.", icon: "🏆" },
  { year: "1972", title: "FA Cup Winners", desc: "The Centenary FA Cup Final at Wembley. Allan Clarke's diving header secures the trophy.", icon: "🥇" },
  { year: "1974", title: "Division One Champions Again", desc: "Revie's last great triumph as the Whites reclaim the title in his final season at the helm.", icon: "🏅" },
  { year: "1992", title: "Division One Champions", desc: "Howard Wilkinson leads Leeds to the final First Division title before the Premier League era begins.", icon: "🏆" },
  { year: "2001", title: "Champions League Semi-Finalists", desc: "David O'Leary's young guns stun Europe, reaching the semi-finals with wins over Lazio, Deportivo and AC Milan.", icon: "⭐" },
  { year: "2020", title: "Back in the Premier League!", desc: "Marcelo Bielsa's remarkable Leeds promoted after 16 years away. The whole city erupts.", icon: "🎉" },
  { year: "2022", title: "Premier League Survival", desc: "A dramatic final-day survival — Jesse Marsch leads Leeds to safety in one of the most tense conclusions in club history.", icon: "💪" },
  { year: "2024", title: "Return to the Top Flight", desc: "Promotion back to the Premier League under Daniel Farke. Forever Leeds, forever bouncing back.", icon: "🚀" },
]

const POLL_OPTIONS = [
  { label: "Crysencio Summerville", votes: 47 },
  { label: "Joe Rodon", votes: 28 },
  { label: "Jack Harrison", votes: 15 },
  { label: "Illan Meslier", votes: 10 },
]

const TICKER_ITEMS = [
  "🔵 LUFC secure top-half Premier League finish ⚽",
  "🏟️ Elland Road sold out for next home fixture",
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Academy starlet called up to England U21s",
  "🌟 Club legend Billy Bremner remembered on anniversary",
  "📰 Transfer targets confirmed: three new signings expected",
  "💛 Season tickets for 2025/26 now on sale — don't miss out",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useIntersection(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])
  return val
}

// ─── Components ──────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false)
  const links = [
    { label: "Home",        href: "#home" },
    { label: "Fixtures",    href: "#fixtures" },
    { label: "Squad",       href: "#squad" },
    { label: "History",     href: "#history" },
    { label: "Elland Road", href: "#elland-road" },
    { label: "Fan Zone",    href: "#fan-zone" },
  ]
  return (
    <nav style={{ background: '#0A1628', borderBottom: '3px solid #FFCD00', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <a href="#home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.6rem' }}>⚽</span>
          <span style={{ color: '#FFCD00', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            LUFC <span style={{ color: '#fff' }}>Fan Hub</span>
          </span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '2rem' }} className="hidden-mobile">
          {links.map(l => (
            <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', display: 'none' }}
          className="show-mobile"
          aria-label="Menu"
        >
          <div style={{ width: 24, height: 2, background: '#FFCD00', margin: '5px 0' }}/>
          <div style={{ width: 24, height: 2, background: '#FFCD00', margin: '5px 0' }}/>
          <div style={{ width: 24, height: 2, background: '#FFCD00', margin: '5px 0' }}/>
        </button>
      </div>

      {open && (
        <div style={{ background: '#0A1628', borderTop: '1px solid #1D428A', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {links.map(l => (
            <a key={l.href} href={l.href} className="nav-link" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div style={{ background: '#FFCD00', padding: '0.65rem 0', overflow: 'hidden' }}>
      <div className="ticker-inner" style={{ color: '#0A1628', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.04em' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ padding: '0 1.5rem' }}>
            {item}
            <span style={{ marginLeft: '1.5rem', opacity: 0.4 }}>|</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section id="home" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A1628 0%, #1D428A 55%, #0A1628 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
      padding: '5rem 1.5rem 4rem',
    }}>
      {/* Diagonal gold stripe */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '50%',
        background: 'linear-gradient(135deg, transparent 40%, rgba(255,205,0,0.055) 40%, rgba(255,205,0,0.055) 60%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,205,0,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', right: '15%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(29,66,138,0.3)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
        <div className="float-ball" style={{ fontSize: '5rem', marginBottom: '1.5rem', display: 'block' }}>⚽</div>

        <p style={{ color: '#FFCD00', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.85 }}>
          Leeds United FC
        </p>

        <h1 style={{
          fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
          fontWeight: 900,
          color: '#FFCD00',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          marginBottom: '1.25rem',
          textShadow: '0 4px 30px rgba(255,205,0,0.3)',
          textTransform: 'uppercase',
        }}>
          Marching On<br/>Together
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', marginBottom: '2.5rem', letterSpacing: '0.04em' }}>
          The Pride of Yorkshire — Est. 1919 — Elland Road, Leeds
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#fixtures" style={{
            background: '#FFCD00', color: '#0A1628', fontWeight: 800,
            padding: '0.85rem 2rem', borderRadius: 4, textDecoration: 'none',
            letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.9rem',
            transition: 'transform 0.15s, background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >Our Fixtures</a>
          <a href="#fan-zone" style={{
            background: 'transparent', color: '#FFCD00', border: '2px solid #FFCD00',
            fontWeight: 800, padding: '0.85rem 2rem', borderRadius: 4, textDecoration: 'none',
            letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.9rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FFCD00'; e.currentTarget.style.color = '#0A1628' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFCD00' }}
          >Join the Fan Zone</a>
        </div>
      </div>
    </section>
  )
}

function NewsCard({ item }: { item: typeof NEWS[0] }) {
  return (
    <div className="card-hover" style={{
      background: 'linear-gradient(160deg, #16274a 0%, #1a2f55 100%)',
      border: '1px solid rgba(29,66,138,0.5)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Image placeholder */}
      <div style={{
        height: 180,
        background: 'linear-gradient(135deg, #1D428A 0%, #0A1628 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3.5rem',
      }}>⚽</div>

      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span style={{
            background: '#FFCD00', color: '#0A1628', fontWeight: 700,
            fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.2rem 0.6rem', borderRadius: 3,
          }}>{item.category}</span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>{item.date}</span>
        </div>
        <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', marginBottom: '0.6rem', lineHeight: 1.4 }}>{item.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>{item.excerpt}</p>
        <span style={{ color: '#FFCD00', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.04em', cursor: 'pointer' }}>
          Read More →
        </span>
      </div>
    </div>
  )
}

function LatestNews() {
  const { ref, visible } = useIntersection()
  return (
    <section ref={ref} className={visible ? 'section-visible' : 'section-hidden'} style={{ padding: '5rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ color: '#FFCD00', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '0.5rem' }}>From the Club</p>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.02em' }}>Latest News</h2>
        <div style={{ width: 60, height: 4, background: '#FFCD00', marginTop: '0.75rem', borderRadius: 2 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
        {NEWS.map(item => <NewsCard key={item.id} item={item} />)}
      </div>
    </section>
  )
}

function Fixtures() {
  const { ref, visible } = useIntersection()
  const resultColor: Record<string, string> = { W: '#22c55e', D: '#FFCD00', L: '#ef4444' }
  const resultBg: Record<string, string>   = { W: 'rgba(34,197,94,0.15)', D: 'rgba(255,205,0,0.15)', L: 'rgba(239,68,68,0.15)' }
  return (
    <section id="fixtures" ref={ref} className={visible ? 'section-visible' : 'section-hidden'}
      style={{ background: 'linear-gradient(180deg, #0d1f3e 0%, #0A1628 100%)', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ color: '#FFCD00', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '0.5rem' }}>This Season</p>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>Fixtures &amp; Results</h2>
        <div style={{ width: 60, height: 4, background: '#FFCD00', marginBottom: '3rem', borderRadius: 2 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
          {/* Upcoming */}
          <div>
            <h3 style={{ color: '#FFCD00', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.25rem', borderLeft: '4px solid #FFCD00', paddingLeft: '0.75rem' }}>
              Upcoming Fixtures
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {FIXTURES.map((f, i) => (
                <div key={i} style={{
                  background: 'rgba(29,66,138,0.18)',
                  border: '1px solid rgba(29,66,138,0.4)',
                  borderRadius: 6,
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                      {f.venue === 'H' ? 'Leeds Utd' : f.opponent} <span style={{ color: 'rgba(255,255,255,0.4)' }}>vs</span> {f.venue === 'H' ? f.opponent : 'Leeds Utd'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{f.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ background: f.venue === 'H' ? '#1D428A' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: 3, letterSpacing: '0.05em' }}>
                      {f.venue === 'H' ? 'HOME' : 'AWAY'}
                    </span>
                    <span style={{ background: 'rgba(255,205,0,0.12)', color: '#FFCD00', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: 3 }}>{f.competition}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div>
            <h3 style={{ color: '#FFCD00', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.25rem', borderLeft: '4px solid #FFCD00', paddingLeft: '0.75rem' }}>
              Recent Results
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {RESULTS.map((r, i) => (
                <div key={i} style={{
                  background: 'rgba(29,66,138,0.18)',
                  border: '1px solid rgba(29,66,138,0.4)',
                  borderRadius: 6,
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <span style={{
                      background: resultBg[r.result], color: resultColor[r.result],
                      fontWeight: 800, fontSize: '0.75rem', width: 28, height: 28,
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{r.result}</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>vs {r.opponent}</span>
                  </div>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.05em' }}>{r.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Squad() {
  const { ref, visible } = useIntersection()
  return (
    <section id="squad" ref={ref} className={visible ? 'section-visible' : 'section-hidden'} style={{ padding: '5rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <p style={{ color: '#FFCD00', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '0.5rem' }}>2024/25 Season</p>
      <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>The Squad</h2>
      <div style={{ width: 60, height: 4, background: '#FFCD00', marginBottom: '3rem', borderRadius: 2 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {SQUAD.map(p => (
          <div key={p.num} className="card-hover" style={{
            background: 'linear-gradient(160deg, #16274a 0%, #1a2f55 100%)',
            border: '1px solid rgba(29,66,138,0.45)',
            borderRadius: 8,
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative number watermark */}
            <div style={{
              position: 'absolute', right: -10, top: -10,
              fontSize: '6rem', fontWeight: 900, color: 'rgba(29,66,138,0.18)', lineHeight: 1, userSelect: 'none',
            }}>{p.num}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#FFCD00', color: '#0A1628',
                fontWeight: 900, fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{p.num}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{p.flag}</span>
                  <span style={{ background: 'rgba(29,66,138,0.5)', color: '#FFCD00', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 3, letterSpacing: '0.06em' }}>{p.pos}</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Form Rating</span>
                <span style={{ color: '#FFCD00', fontWeight: 800, fontSize: '0.8rem' }}>{p.form}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.form}%`, background: 'linear-gradient(90deg, #FFCD00, #e6b800)', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function History() {
  const { ref, visible } = useIntersection(0.05)
  return (
    <section id="history" ref={ref} className={visible ? 'section-visible' : 'section-hidden'}
      style={{ background: 'linear-gradient(180deg, #0d1f3e 0%, #0A1628 100%)', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <p style={{ color: '#FFCD00', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '0.5rem', textAlign: 'center' }}>Est. 1919</p>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.5rem', textAlign: 'center' }}>Our Story</h2>
        <div style={{ width: 60, height: 4, background: '#FFCD00', margin: '0 auto 3.5rem', borderRadius: 2 }} />

        <div className="timeline-container" style={{ position: 'relative' }}>
          {TIMELINE.map((item, i) => {
            const isLeft = i % 2 === 0
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: isLeft ? 'flex-start' : 'flex-end',
                marginBottom: '2.5rem',
                position: 'relative',
              }}>
                {/* Year bubble on the line */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '1.5rem',
                  transform: 'translate(-50%, -50%)',
                  background: '#FFCD00',
                  color: '#0A1628',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: 20,
                  zIndex: 2,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}>{item.year}</div>

                {/* Content card */}
                <div style={{
                  width: 'calc(50% - 3rem)',
                  background: 'rgba(29,66,138,0.18)',
                  border: '1px solid rgba(29,66,138,0.45)',
                  borderRadius: 8,
                  padding: '1.25rem',
                  marginTop: '0.5rem',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                  <div style={{ color: '#FFCD00', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{item.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.85rem', lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile timeline override */}
      <style>{`
        @media (max-width: 640px) {
          .timeline-container::before { left: 12px !important; }
        }
      `}</style>
    </section>
  )
}

function StatCounter({ target, label, suffix = '' }: { target: number, label: string, suffix?: string }) {
  const { ref, visible } = useIntersection(0.2)
  const val = useCountUp(target, visible)
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#FFCD00', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {val.toLocaleString()}{suffix}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.5rem' }}>{label}</div>
    </div>
  )
}

function EllandRoad() {
  const { ref, visible } = useIntersection()
  return (
    <section id="elland-road" ref={ref} className={visible ? 'section-visible' : 'section-hidden'}
      style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #1D428A 50%, #0A1628 100%)',
        padding: '5rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Background texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,205,0,0.015) 40px, rgba(255,205,0,0.015) 80px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <p style={{ color: '#FFCD00', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '0.5rem' }}>LS11 7DJ</p>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '3rem' }}>
          Elland Road<br/>
          <span style={{ color: '#FFCD00' }}>Our Fortress</span>
        </h2>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid rgba(255,205,0,0.2)',
          marginBottom: '3rem',
          background: 'rgba(10,22,40,0.6)',
        }}>
          {[
            { target: 37890, label: "Capacity" },
            { target: 1919, label: "Year Established" },
            { target: 4, label: "Stands" },
            { target: 100, label: "Years of History", suffix: "+" },
          ].map((s, i) => (
            <div key={i} style={{ borderRight: i < 3 ? '1px solid rgba(255,205,0,0.15)' : 'none' }}>
              <StatCounter target={s.target} label={s.label} suffix={s.suffix} />
            </div>
          ))}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.75, maxWidth: 680, margin: '0 auto 2.5rem', fontStyle: 'italic' }}>
          "Elland Road is more than a stadium — it's the beating heart of Leeds. When 37,000 voices rise as one, belting out 'Marching On Together', there is nowhere on earth like it. Built on passion, powered by loyalty, our fortress has stood for over a century."
        </p>

        <a href="#" style={{
          display: 'inline-block',
          background: '#FFCD00', color: '#0A1628',
          fontWeight: 800, padding: '0.9rem 2.5rem',
          borderRadius: 4, textDecoration: 'none',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontSize: '0.9rem',
          transition: 'transform 0.15s, background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >Get Tickets</a>
      </div>
    </section>
  )
}

function Poll() {
  const total = POLL_OPTIONS.reduce((sum, o) => sum + o.votes, 0)
  const [votes, setVotes] = useState(POLL_OPTIONS.map(o => o.votes))
  const [voted, setVoted] = useState<number | null>(null)

  function handleVote(i: number) {
    if (voted !== null) return
    const updated = votes.map((v, idx) => idx === i ? v + 1 : v)
    setVotes(updated)
    setVoted(i)
  }

  const totalVotes = votes.reduce((s, v) => s + v, 0)

  return (
    <div style={{
      background: 'rgba(29,66,138,0.2)',
      border: '1px solid rgba(29,66,138,0.45)',
      borderRadius: 8,
      padding: '1.5rem',
    }}>
      <h3 style={{ color: '#FFCD00', fontWeight: 800, fontSize: '0.95rem', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        🗳️ Fan Poll
      </h3>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
        Who was LUFC's Player of the Season?
      </p>
      {POLL_OPTIONS.map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round((votes[i] / totalVotes) * 100) : 0
        return (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <button onClick={() => handleVote(i)} style={{
                background: 'none', border: 'none', color: voted === i ? '#FFCD00' : 'rgba(255,255,255,0.8)',
                cursor: voted !== null ? 'default' : 'pointer',
                fontWeight: voted === i ? 700 : 500,
                fontSize: '0.875rem', padding: 0,
                textAlign: 'left',
              }}>
                {voted === i && '✓ '}{opt.label}
              </button>
              {voted !== null && <span style={{ color: '#FFCD00', fontWeight: 700, fontSize: '0.85rem' }}>{pct}%</span>}
            </div>
            {voted !== null && (
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 5, height: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: i === voted ? '#FFCD00' : '#1D428A',
                  borderRadius: 5,
                  transition: 'width 0.9s cubic-bezier(0.25,0.46,0.45,0.94)',
                }} />
              </div>
            )}
          </div>
        )
      })}
      {voted === null && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Click a name to cast your vote</p>}
      {voted !== null && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Total votes: {totalVotes.toLocaleString()}</p>}
    </div>
  )
}

function FanZone() {
  const { ref, visible } = useIntersection()
  return (
    <section id="fan-zone" ref={ref} className={visible ? 'section-visible' : 'section-hidden'} style={{ padding: '5rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <p style={{ color: '#FFCD00', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Community</p>
      <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>Join the Fan Zone</h2>
      <div style={{ width: 60, height: 4, background: '#FFCD00', marginBottom: '3rem', borderRadius: 2 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
        {/* Supporters Club */}
        <div className="card-hover" style={{ background: 'linear-gradient(160deg, #16274a, #1a2f55)', border: '1px solid rgba(29,66,138,0.45)', borderRadius: 8, padding: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ color: '#FFCD00', fontWeight: 800, marginBottom: '0.5rem' }}>Supporters' Club</h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            Join over <strong style={{ color: '#fff' }}>24,500</strong> members worldwide in the official LUFC Fan Hub Supporters' Club. Match tickets, merchandise discounts, and exclusive events.
          </p>
          <a href="#" style={{ background: '#FFCD00', color: '#0A1628', fontWeight: 800, padding: '0.6rem 1.5rem', borderRadius: 4, textDecoration: 'none', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-block' }}>Join Now</a>
        </div>

        {/* Away Day Guides */}
        <div className="card-hover" style={{ background: 'linear-gradient(160deg, #16274a, #1a2f55)', border: '1px solid rgba(29,66,138,0.45)', borderRadius: 8, padding: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚌</div>
          <h3 style={{ color: '#FFCD00', fontWeight: 800, marginBottom: '0.5rem' }}>Away Day Guides</h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            Planning your next away trip? Our fan-written guides cover travel, pubs, parking, and ground info for every Premier League ground.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[{ ground: "Anfield", tip: "Lime St → Kirkdale, 20 min walk" }, { ground: "Old Trafford", tip: "Metrolink to Old Trafford tram" }].map((g, i) => (
              <div key={i} style={{ background: 'rgba(29,66,138,0.25)', padding: '0.5rem 0.75rem', borderRadius: 4, borderLeft: '3px solid #FFCD00' }}>
                <span style={{ color: '#FFCD00', fontWeight: 700, fontSize: '0.8rem' }}>{g.ground}: </span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>{g.tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fan Chants */}
        <div className="card-hover" style={{ background: 'linear-gradient(160deg, #16274a, #1a2f55)', border: '1px solid rgba(29,66,138,0.45)', borderRadius: 8, padding: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎵</div>
          <h3 style={{ color: '#FFCD00', fontWeight: 800, marginBottom: '0.5rem' }}>Fan Chants &amp; Songs</h3>
          <div style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(255,205,0,0.2)', borderRadius: 6, padding: '1rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: '0.75rem' }}>
            "Here we go with Leeds United,<br/>
            We're gonna give the boys a hand,<br/>
            Stand up and sing for Leeds United,<br/>
            They are the greatest in the land.
            <br/><br/>
            Everyday we're all gonna say,<br/>
            We love you Leeds! Leeds! Leeds!<br/>
            <strong style={{ color: '#FFCD00' }}>Marching on together,<br/>
            We're gonna see you win!"</strong>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>— Marching On Together (1972)</span>
        </div>
      </div>

      {/* Poll */}
      <Poll />
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#060f1e', borderTop: '3px solid #1D428A' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem' }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.6rem' }}>⚽</span>
            <span style={{ color: '#FFCD00', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>LUFC Fan Hub</span>
          </div>
          <p style={{ color: '#FFCD00', fontWeight: 800, fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>Forever Leeds.</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', lineHeight: 1.6 }}>
            The online home for Leeds United fans worldwide. We bleed blue and gold.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Quick Links</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {["Home", "Fixtures", "Squad", "History", "Elland Road", "Fan Zone"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFCD00')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              >{l}</a>
            ))}
          </div>
        </div>

        {/* Social */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Follow Us</h4>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { icon: "𝕏", label: "Twitter/X" },
              { icon: "📸", label: "Instagram" },
              { icon: "📘", label: "Facebook" },
              { icon: "▶️", label: "YouTube" },
            ].map(s => (
              <button key={s.label} aria-label={s.label} style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#FFCD00', color: '#0A1628',
                border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#FFCD00' }}
              >{s.icon}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
        <p>This is an unofficial fan site. Not affiliated with Leeds United AFC.</p>
        <p style={{ marginTop: '0.3rem' }}>© 2025 LUFC Fan Hub. All rights reserved. MOT. 🔵💛</p>
      </div>
    </footer>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <Navbar />
      <Ticker />
      <Hero />
      <LatestNews />
      <Fixtures />
      <Squad />
      <History />
      <EllandRoad />
      <FanZone />
      <Footer />
    </>
  )
}
