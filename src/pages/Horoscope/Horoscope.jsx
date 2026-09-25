import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchCompatibility, fetchDailyHoroscope, messageOf, shortDate } from '../../api/index.js'
import iconStarOutline from '../../assets/pages/horoscope/icon-star-outline.svg'
import iconSparkle from '../../assets/pages/horoscope/icon-sparkle.svg'
import imgAries from '../../assets/pages/horoscope/aries.png'
import imgTaurus from '../../assets/pages/horoscope/taurus.png'
import imgGemini from '../../assets/pages/horoscope/gemini.png'
import imgCancer from '../../assets/pages/horoscope/cancer.png'
import imgLeo from '../../assets/pages/horoscope/leo.png'
import imgVirgo from '../../assets/pages/horoscope/virgo.png'
import imgLibra from '../../assets/pages/horoscope/libra.png'
import imgScorpio from '../../assets/pages/horoscope/scorpio.png'
import imgSagittarius from '../../assets/pages/horoscope/sagittarius.png'
import imgCapricorn from '../../assets/pages/horoscope/capricorn.png'
import imgAquarius from '../../assets/pages/horoscope/aquarius.png'
import imgPisces from '../../assets/pages/horoscope/pisces.png'
import './Horoscope.css'

/** Only Daily has a backend (`GET /horoscope/daily`); weekly/monthly/yearly are hidden until one exists. */
const PERIODS = [{ key: 'daily', label: 'Daily' }]
const COMING_SOON = 'Weekly, monthly and yearly horoscopes are coming soon'

const ELEMENT_COLORS = {
  Fire: '#f97316',
  Earth: '#16a34a',
  Air: '#0ea5e9',
  Water: '#2563eb',
}

/* Sign cards keep their original order and label text; each sign now shows its own illustration. */
const SIGNS = [
  {
    key: 'aries',
    label: 'ARIES',
    name: 'Aries',
    dates: 'Mar 21 – Apr 19',
    element: 'Fire',
    ruler: 'Mars',
    image: imgAries,
  },
  {
    key: 'virgo',
    label: 'VIRGO',
    name: 'Virgo',
    dates: 'Aug 23 – Sep 22',
    element: 'Earth',
    ruler: 'Mercury',
    image: imgVirgo,
  },
  {
    key: 'sagittarius',
    label: 'SAGITTAIRUS',
    name: 'Sagittarius',
    dates: 'Nov 22 – Dec 21',
    element: 'Fire',
    ruler: 'Jupiter',
    image: imgSagittarius,
  },
  {
    key: 'cancer',
    label: 'CANCER',
    name: 'Cancer',
    dates: 'Jun 21 – Jul 22',
    element: 'Water',
    ruler: 'Moon',
    image: imgCancer,
  },
  {
    key: 'leo',
    label: 'LEO',
    name: 'Leo',
    dates: 'Jul 23 – Aug 22',
    element: 'Fire',
    ruler: 'Sun',
    image: imgLeo,
  },
  {
    key: 'taurus',
    label: 'TAURUS',
    name: 'Taurus',
    dates: 'Apr 20 – May 20',
    element: 'Earth',
    ruler: 'Venus',
    image: imgTaurus,
  },
  {
    key: 'libra',
    label: 'LIBRA',
    name: 'Libra',
    dates: 'Sep 23 – Oct 22',
    element: 'Air',
    ruler: 'Venus',
    image: imgLibra,
  },
  {
    key: 'scorpio',
    label: 'Scorpio',
    name: 'Scorpio',
    dates: 'Oct 23 – Nov 21',
    element: 'Water',
    ruler: 'Mars',
    image: imgScorpio,
  },
  {
    key: 'gemini',
    label: 'GEMINI',
    name: 'Gemini',
    dates: 'May 21 – Jun 20',
    element: 'Air',
    ruler: 'Mercury',
    image: imgGemini,
  },
  {
    key: 'capricorn',
    label: 'CAPRICORN',
    name: 'Capricorn',
    dates: 'Dec 22 – Jan 19',
    element: 'Earth',
    ruler: 'Saturn',
    image: imgCapricorn,
  },
  {
    key: 'aquarius',
    label: 'AQUARIUS',
    name: 'Aquarius',
    dates: 'Jan 20 – Feb 18',
    element: 'Air',
    ruler: 'Saturn',
    image: imgAquarius,
  },
  {
    key: 'pisces',
    label: 'PISCES',
    name: 'Pisces',
    dates: 'Feb 19 – Mar 20',
    element: 'Water',
    ruler: 'Jupiter',
    image: imgPisces,
  },
]

const CHINESE_ZODIAC = [
  { emoji: '🐭', name: 'Rat', trait: 'Clever & Quick-witted', years: '1948, 1960, 1972, 1984, 1996, 2008, 2020' },
  { emoji: '🐂', name: 'Ox', trait: 'Diligent & Dependable', years: '1949, 1961, 1973, 1985, 1997, 2009, 2021' },
  { emoji: '🐯', name: 'Tiger', trait: 'Brave & Powerful', years: '1950, 1962, 1974, 1986, 1998, 2010, 2022' },
  { emoji: '🐰', name: 'Rabbit', trait: 'Gentle & Elegant', years: '1951, 1963, 1975, 1987, 1999, 2011, 2023' },
  { emoji: '🐲', name: 'Dragon', trait: 'Confident & Ambitious', years: '1952, 1964, 1976, 1988, 2000, 2012, 2024' },
  { emoji: '🐍', name: 'Snake', trait: 'Wise & Analytical', years: '1953, 1965, 1977, 1989, 2001, 2013, 2025' },
]

/** Reading cards, each fed by one or more of the API's `sections`. */
const ASPECTS = [
  { key: 'love', icon: '♥', title: 'Love & Relationships', sections: ['personal_life', 'emotions'] },
  { key: 'career', icon: '◆', title: 'Career & Finance', sections: ['profession'] },
  { key: 'health', icon: '✦', title: 'Health & Wellness', sections: ['health'] },
  { key: 'travel', icon: '✈', title: 'Travel', sections: ['travel'] },
  { key: 'luck', icon: '☘', title: 'Luck', sections: ['luck'] },
]

const PERIOD_KEYS = PERIODS.map((x) => x.key)
const SIGN_KEYS = SIGNS.map((x) => x.key)

const compatLabel = (score) => {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 60) return 'Good'
  return 'Fair'
}

const SIGN_NAME = Object.fromEntries(SIGNS.map((s) => [s.key, s.name]))

/** How many of the eleven real pairings the side card shows. */
const COMPAT_SHOWN = 4

export default function Horoscope() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [period, setPeriod] = useState(() => {
    const v = searchParams.get('period')
    return PERIOD_KEYS.includes(v) ? v : 'daily'
  })
  const [sign, setSign] = useState(() => {
    const v = searchParams.get('sign')
    return SIGN_KEYS.includes(v) ? v : 'leo'
  })

  /** Daily readings cached per sign for the life of the page: { [sign]: { status, data, error } }. */
  const [readings, setReadings] = useState({})
  /** Real sign-to-sign compatibility (`GET /horoscope/compatibility`), keyed by sign like `readings`. */
  const [compat, setCompat] = useState({})
  /** Signs with a request in flight — results are keyed by sign, so a late resolve is always safe to keep. */
  const inflight = useRef(new Set())

  useEffect(() => {
    if (readings[sign] || inflight.current.has(sign)) return
    inflight.current.add(sign)
    fetchDailyHoroscope(sign)
      .then((data) => setReadings((prev) => ({ ...prev, [sign]: { status: 'ready', data } })))
      .catch((error) =>
        setReadings((prev) => ({
          ...prev,
          [sign]: { status: 'error', error: messageOf(error, "Could not load today's horoscope.") },
        })),
      )
      .finally(() => inflight.current.delete(sign))
  }, [sign, readings])

  const compatInflight = useRef(new Set())

  useEffect(() => {
    if (compat[sign] || compatInflight.current.has(sign)) return
    compatInflight.current.add(sign)
    fetchCompatibility(sign)
      .then((data) => setCompat((prev) => ({ ...prev, [sign]: { status: 'ready', items: data.items } })))
      .catch((error) =>
        setCompat((prev) => ({ ...prev, [sign]: { status: 'error', error: messageOf(error, 'Could not load compatibility.') } })),
      )
      .finally(() => compatInflight.current.delete(sign))
  }, [sign, compat])

  /** Dropping the cached entry makes the effect above fetch it again. */
  const retryReading = () => {
    setReadings((prev) => {
      const { [sign]: _dropped, ...rest } = prev
      return rest
    })
  }

  const syncParams = (nextSign, nextPeriod) => {
    const next = new URLSearchParams(searchParams)
    next.set('sign', nextSign)
    next.set('period', nextPeriod)
    setSearchParams(next, { replace: true })
  }

  const selectPeriod = (key) => {
    setPeriod(key)
    syncParams(sign, key)
  }

  const selectSign = (key) => {
    setSign(key)
    syncParams(key, period)
  }

  const current = SIGNS.find((s) => s.key === sign) || SIGNS[4]
  const reading = readings[sign] || { status: 'loading' }
  const data = reading.status === 'ready' ? reading.data : null
  const sections = data?.sections || {}
  const compatState = compat[sign] || { status: 'loading' }
  const compatRows = (compatState.items || []).slice(0, COMPAT_SHOWN)

  return (
    <section className="horoscope-page">
      <div className="horoscope-page__hero">
        <div className="container">
          <div className="horoscope-page__hero-inner">
            <span className="horoscope-page__pill">
              <img src={iconStarOutline} alt="" className="horoscope-page__pill-icon" />
              Vedic &amp; Western Astrology
            </span>
            <h1 className="horoscope-page__title">Horoscope</h1>
            <p className="horoscope-page__subtitle">
              Daily predictions for all 12 zodiac signs, powered by Vedic wisdom.
            </p>
            <div className="horoscope-page__periods" role="tablist" aria-label="Horoscope period" title={COMING_SOON}>
              {PERIODS.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  role="tab"
                  aria-selected={period === x.key}
                  className={`horoscope-page__period${period === x.key ? ' horoscope-page__period--active' : ''}`}
                  onClick={() => selectPeriod(x.key)}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="horoscope-page__content">
          <h2 className="horoscope-page__section-title">Select Your Zodiac Sign</h2>
          <ul className="horoscope-page__signs">
            {SIGNS.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  aria-pressed={sign === s.key}
                  className={`horoscope-page__sign${sign === s.key ? ' horoscope-page__sign--active' : ''}`}
                  onClick={() => selectSign(s.key)}
                >
                  <span className="horoscope-page__sign-img">
                    <img src={s.image} alt="" />
                  </span>
                  <span className="horoscope-page__sign-name">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="horoscope-page__panel">
            <article className="horoscope-page__reading" aria-busy={reading.status === 'loading'}>
              <header className="horoscope-page__reading-head">
                <div className="horoscope-page__reading-tile">
                  <img src={current.image} alt="" />
                </div>
                <div className="horoscope-page__reading-meta">
                  <div className="horoscope-page__reading-name-row">
                    <h3 className="horoscope-page__reading-name">{current.name}</h3>
                    <span className="horoscope-page__element" style={{ background: ELEMENT_COLORS[current.element] }}>
                      {current.element}
                    </span>
                  </div>
                  <p className="horoscope-page__reading-dates">
                    {current.dates} · Ruled by {current.ruler}
                    {data?.date ? ` · ${shortDate(data.date)}` : ''}
                  </p>
                  {data?.stale && (
                    <p className="horoscope-page__stale" role="status">
                      Today&apos;s reading ({shortDate(data.requested_date)}) isn&apos;t available yet — showing the latest one
                      from {shortDate(data.date)}.
                    </p>
                  )}
                </div>
              </header>

              <div className="horoscope-page__reading-body">
                {reading.status === 'error' && (
                  <div className="horoscope-page__error" role="alert">
                    <p>{reading.error}</p>
                    <button type="button" className="horoscope-page__retry" onClick={retryReading}>
                      Try again
                    </button>
                  </div>
                )}

                {reading.status !== 'error' && (
                  <div className={`horoscope-page__aspects${reading.status === 'loading' ? ' horoscope-page__aspects--loading' : ''}`}>
                    {ASPECTS.map((a) => {
                      const paragraphs = a.sections.map((k) => sections[k]).filter(Boolean)
                      return (
                        <div key={a.key} className="horoscope-page__aspect">
                          <div className="horoscope-page__aspect-head">
                            <span className="horoscope-page__aspect-icon" aria-hidden="true">
                              {a.icon}
                            </span>
                            <h4 className="horoscope-page__aspect-title">{a.title}</h4>
                          </div>
                          {reading.status === 'loading' ? (
                            <>
                              <span className="horoscope-page__skeleton" />
                              <span className="horoscope-page__skeleton horoscope-page__skeleton--short" />
                            </>
                          ) : paragraphs.length ? (
                            paragraphs.map((text, i) => (
                              <p key={i} className="horoscope-page__aspect-text">
                                {text}
                              </p>
                            ))
                          ) : (
                            <p className="horoscope-page__aspect-text horoscope-page__aspect-text--muted">
                              No reading for this area today.
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </article>

            <aside className="horoscope-page__side">
              <div className="horoscope-page__side-card horoscope-page__side-card--raised">
                <h3 className="horoscope-page__side-title">Personalized Horoscope</h3>
                <p className="horoscope-page__side-text">
                  Get a personalized horoscope based on your exact birth details for deeper, more accurate insights.
                </p>
                <Link to="/kundli" className="horoscope-page__cta">
                  <img src={iconSparkle} alt="" className="horoscope-page__cta-icon" />
                  Generate Personal Report
                </Link>
              </div>

              <div className="horoscope-page__side-card">
                <h3 className="horoscope-page__side-title">Quick Compatibility</h3>
                {compatState.status === 'error' && (
                  <p className="horoscope-page__compat-note" role="alert">
                    {compatState.error}
                  </p>
                )}
                {compatState.status === 'loading' && (
                  <ul className="horoscope-page__compat" aria-busy="true">
                    {Array.from({ length: COMPAT_SHOWN }, (_, i) => (
                      <li key={i} className="horoscope-page__compat-row">
                        <span className="horoscope-page__skeleton horoscope-page__skeleton--short" />
                        <div className="horoscope-page__compat-bar" />
                      </li>
                    ))}
                  </ul>
                )}
                {compatState.status === 'ready' && (
                  <ul className="horoscope-page__compat">
                    {compatRows.map((c) => (
                      <li key={c.partner_sign} className="horoscope-page__compat-row" title={c.report}>
                        <div className="horoscope-page__compat-top">
                          <span className="horoscope-page__compat-name">{SIGN_NAME[c.partner_sign] || c.partner_sign}</span>
                          <span className="horoscope-page__compat-value">
                            {c.percentage ?? '—'}% · {compatLabel(c.percentage ?? 0)}
                          </span>
                        </div>
                        <div className="horoscope-page__compat-bar">
                          <span className="horoscope-page__compat-fill" style={{ width: `${c.percentage ?? 0}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>

          <div className="horoscope-page__chinese">
            <h2 className="horoscope-page__chinese-title">Chinese Zodiac</h2>
            <p className="horoscope-page__chinese-subtitle">Discover your Chinese zodiac sign based on your birth year</p>
            <ul className="horoscope-page__chinese-grid">
              {CHINESE_ZODIAC.map((z) => (
                <li key={z.name} className="horoscope-page__chinese-card">
                  <span className="horoscope-page__chinese-emoji" aria-hidden="true">
                    {z.emoji}
                  </span>
                  <p className="horoscope-page__chinese-name">{z.name}</p>
                  <p className="horoscope-page__chinese-trait">{z.trait}</p>
                  <p className="horoscope-page__chinese-years">{z.years}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
