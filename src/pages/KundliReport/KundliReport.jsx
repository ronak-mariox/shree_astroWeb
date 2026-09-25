import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { fetchCurrentKundli, fetchKundliOverview, messageOf, shortDate } from '../../api/index.js'
import { TABS } from './tabs/index.js'
import './KundliReport.css'

const ICONS = {
  chart: '⬡',
  matching: '♥',
  'mangal-dosha': '♂',
  'sade-sati': '♄',
  mahadasha: '◎',
  career: '◆',
  finance: '₹',
  health: '♥',
  marriage: '⚭',
  lucky: '7',
}

const BARE_TABS = new Set(['chart'])

/** Overview polling while the provider batch is still running. */
const POLL_INTERVAL_MS = 3000
const POLL_MAX_MS = 60000

function birthOf(user) {
  const details = user?.birthDetails
  if (!details) return null
  return {
    dob: details.dateOfBirth ? shortDate(details.dateOfBirth) : '',
    tob: details.timeOfBirth || '',
    place: details.place?.formatted || '',
  }
}

function StateCard({ title, text, spinner, children }) {
  return (
    <div className="kundli-report__state">
      {spinner && <span className="kundli-report__spinner" aria-hidden="true" />}
      {title && <p className="kundli-report__state-title">{title}</p>}
      {text && <p className="kundli-report__state-text">{text}</p>}
      {children}
    </div>
  )
}

/**
 * One profile's report. Mounted with `key={profileId}` so the overview and the
 * per-tab section cache reset naturally when the profile changes.
 */
function Report({ profileId, name, birth }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [overview, setOverview] = useState(null)
  const [overviewError, setOverviewError] = useState('')
  const [timedOut, setTimedOut] = useState(false)
  const [attempt, setAttempt] = useState(0)

  /** Lazily loaded tab sections, keyed by section name — shared by every tab for this profile. */
  const [sections, setSections] = useState({})
  const inflight = useRef(new Set())

  // Load the overview; poll while the batch is still pending.
  useEffect(() => {
    let active = true
    let timer = null
    const startedAt = Date.now()

    const tick = async () => {
      try {
        const data = await fetchKundliOverview(profileId)
        if (!active) return
        setOverview(data)
        setOverviewError('')
        if (data.status === 'pending') {
          if (Date.now() - startedAt >= POLL_MAX_MS) setTimedOut(true)
          else timer = setTimeout(tick, POLL_INTERVAL_MS)
        }
      } catch (error) {
        if (active) setOverviewError(messageOf(error, 'Could not load your kundli.'))
      }
    }
    tick()

    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [profileId, attempt])

  /**
   * Fetch-once cache for the tab sections. `key` identifies the section
   * ("dasha", "doshas", "antardasha:Jupiter" …); `fetcher` is only invoked the
   * first time, or again after an error when `force` is set.
   */
  const loadSection = useCallback((key, fetcher, { force = false } = {}) => {
    if (inflight.current.has(key)) return
    setSections((prev) => {
      const entry = prev[key]
      if (entry && entry.status !== 'error' && !force) return prev
      return { ...prev, [key]: { status: 'loading' } }
    })
    inflight.current.add(key)
    fetcher()
      .then((data) => setSections((prev) => ({ ...prev, [key]: { status: 'ready', data } })))
      .catch((error) => setSections((prev) => ({ ...prev, [key]: { status: 'error', error: messageOf(error) } })))
      .finally(() => inflight.current.delete(key))
  }, [])

  const requested = searchParams.get('tab')
  const active = TABS.find((t) => t.key === requested) || TABS[0]
  const Panel = active.Component

  const selectTab = (key) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', key)
    setSearchParams(next, { replace: true })
  }

  const retry = () => {
    setTimedOut(false)
    setOverviewError('')
    setAttempt((n) => n + 1)
  }

  const pending = overview?.status === 'pending' && !timedOut

  if (!overview && !overviewError) {
    return <StateCard spinner text="Loading your kundli…" />
  }

  if (overviewError && !overview) {
    return (
      <StateCard title="Could not load this kundli" text={overviewError}>
        <div className="kundli-report__state-actions">
          <button type="button" className="kundli-report__btn kundli-report__btn--primary" onClick={retry}>
            Try again
          </button>
          <Link to="/kundli" className="kundli-report__btn kundli-report__btn--outline">
            Generate a new kundli
          </Link>
        </div>
      </StateCard>
    )
  }

  if (pending) {
    return (
      <StateCard
        spinner
        title="Preparing your chart…"
        text="Calculating planetary positions. This usually takes a few seconds."
      />
    )
  }

  if (overview?.status === 'failed') {
    return (
      <StateCard
        title="We couldn't generate this kundli"
        text="The astrology provider did not return your chart. Please try again in a moment."
      >
        <div className="kundli-report__state-actions">
          <button type="button" className="kundli-report__btn kundli-report__btn--primary" onClick={retry}>
            Try again
          </button>
          <Link to="/kundli" className="kundli-report__btn kundli-report__btn--outline">
            Regenerate from birth details
          </Link>
        </div>
      </StateCard>
    )
  }

  /** The birth this chart was cast for comes with the overview; the account's details are only a fallback while it loads. */
  const chartBirth = overview?.birth
    ? {
        dob: overview.birth.dateOfBirth ? shortDate(overview.birth.dateOfBirth) : '',
        tob: overview.birth.timeOfBirth || '',
        place: overview.birth.place?.formatted || '',
      }
    : birth
  const report = { profileId, overview, name, birth: chartBirth, sections, loadSection }

  return (
    <div className="kundli-report__layout">
      <nav className="kundli-report__sidebar" aria-label="Report sections">
        <ul className="kundli-report__tabs" role="tablist">
          {TABS.map((t) => {
            const isActive = t.key === active.key
            return (
              <li key={t.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`kundli-report__tab${isActive ? ' kundli-report__tab--active' : ''}`}
                  onClick={() => selectTab(t.key)}
                >
                  <span className="kundli-report__tab-icon" aria-hidden="true">
                    {ICONS[t.key]}
                  </span>
                  <span className="kundli-report__tab-label">{t.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="kundli-report__main">
        {(timedOut || overview?.status === 'partial') && (
          <p className="kundli-report__notice" role="status">
            {timedOut
              ? 'Your chart is still being prepared. Some sections may be incomplete — refresh in a moment.'
              : 'Some sections could not be generated yet. They are retried automatically when you open them.'}
          </p>
        )}
        <div
          className={`kundli-report__panel${BARE_TABS.has(active.key) ? ' kundli-report__panel--bare' : ''}`}
          role="tabpanel"
        >
          <Panel report={report} />
        </div>
      </div>
    </div>
  )
}

export default function KundliReport() {
  const { isLoggedIn, user } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const profileId = searchParams.get('profile') || ''

  /** Set (to the navigation key it applies to) when `/kundli/me` finds nothing — so each fresh visit re-checks. */
  const [noProfileFor, setNoProfileFor] = useState(null)

  // No ?profile= → fall back to the kundli for the account's current birth details.
  useEffect(() => {
    if (!isLoggedIn || profileId) return undefined
    let active = true
    const visit = location.key
    fetchCurrentKundli()
      .then((result) => {
        if (!active) return
        if (result?.found) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('profile', result.profileId)
            return next
          }, { replace: true })
        } else {
          setNoProfileFor(visit)
        }
      })
      .catch(() => {
        if (active) setNoProfileFor(visit)
      })
    return () => {
      active = false
    }
  }, [isLoggedIn, profileId, location.key, setSearchParams])

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  const name = location.state?.name || user?.birthDetails?.fullName || user?.name || 'Your Kundli'
  const noProfile = !profileId && noProfileFor === location.key

  let body
  if (profileId) {
    body = <Report key={profileId} profileId={profileId} name={name} birth={birthOf(user)} />
  } else if (noProfile) {
    body = (
      <StateCard title="Generate your kundli first" text="Enter your birth details and we'll prepare your full Vedic report.">
        <Link to="/kundli" className="kundli-report__btn kundli-report__btn--primary">
          Go to Free Kundli
        </Link>
      </StateCard>
    )
  } else {
    body = <StateCard spinner text="Looking up your saved kundli…" />
  }

  return (
    <section className="kundli-report">
      <div className="kundli-report__topbar">
        <div className="container">
          <div className="kundli-report__topbar-inner">
            <Link to="/kundli" className="kundli-report__back">
              ← Back
            </Link>
            <div className="kundli-report__who">
              <p className="kundli-report__eyebrow">Kundli Report for</p>
              <h1 className="kundli-report__name">{name}</h1>
            </div>
            <div className="kundli-report__actions">
              <button
                type="button"
                className="kundli-report__btn kundli-report__btn--primary"
                onClick={() => window.print()}
                disabled={!profileId}
              >
                Download PDF
              </button>
              <Link to="/astrologers" className="kundli-report__btn kundli-report__btn--outline">
                Consult Astrologer
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">{body}</div>
    </section>
  )
}
