import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import {
  fetchAstrologer,
  fetchAstrologerReviews,
  fetchFavourites,
  joinLabels,
  messageOf,
  minutesOf,
  shortDate,
  titleCase,
  toggleFavourite,
} from '../../api/index.js'
import {
  availabilityText,
  consultationsLabel,
  expertiseLabels,
  formatCount,
  initialsAvatar,
  photoOf,
  photoUrl,
  priceOf,
  rateOf,
  ratingLabel,
  statusOf,
  topicLabel,
} from '../../components/astrologers/astrologerView.js'
import starOutline from '../../assets/pages/astrologer-profile/star-outline.svg'
import verifiedIcon from '../../assets/pages/astrologer-profile/verified.svg'
import iconCall from '../../assets/pages/astrologer-profile/icon-call.svg'
import iconChat from '../../assets/pages/astrologer-profile/icon-chat.svg'
import iconCalendar from '../../assets/pages/astrologer-profile/icon-calendar.svg'
import iconResponse from '../../assets/pages/astrologer-profile/icon-response.svg'
import iconLocation from '../../assets/pages/astrologer-profile/icon-location.svg'
import iconVerifiedSince from '../../assets/pages/astrologer-profile/icon-verified-since.svg'
import iconTopRated from '../../assets/pages/astrologer-profile/icon-top-rated.svg'
import iconExpertise from '../../assets/pages/astrologer-profile/icon-expertise.svg'
import starLg from '../../assets/pages/astrologer-profile/star-lg.svg'
import starXs from '../../assets/pages/astrologer-profile/star-xs.svg'
import starSm from '../../assets/pages/astrologer-profile/star-sm.svg'
import starSmEmpty from '../../assets/pages/astrologer-profile/star-sm-empty.svg'
import './AstrologerProfile.css'

const REVIEWS_PAGE = 10

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'expertise', label: 'Expertise' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'availability', label: 'Availability' },
]

const BREAKDOWN_ROWS = [
  { stars: 5, key: 'five' },
  { stars: 4, key: 'four' },
  { stars: 3, key: 'three' },
  { stars: 2, key: 'two' },
  { stars: 1, key: 'one' },
]

/* ------------------------------------------------------------- view model */

function statusPill(astrologer) {
  const status = statusOf(astrologer)
  if (status.key === 'online') return { key: 'online', label: 'Online Now' }
  if (status.key === 'busy') return { key: 'busy', label: `Busy · ~${status.waitMinutes} min` }
  return { key: 'offline', label: 'Offline' }
}

function taglineOf(astrologer) {
  if (astrologer.tagline) return astrologer.tagline
  const parts = expertiseLabels(astrologer.expertise).slice(0, 2)
  if (astrologer.experienceYears) parts.push(`${astrologer.experienceYears} Years Experience`)
  return parts.join(' · ')
}

function statsOf(astrologer) {
  const chat = rateOf(astrologer.rates?.chat)
  const call = rateOf(astrologer.rates?.call)
  const price = chat ?? call
  const languages = astrologer.languages ?? []
  return [
    {
      value: Number(astrologer.ratingCount) > 0 ? `${ratingLabel(astrologer.rating, astrologer.ratingCount)}★` : 'New',
      label: 'Rating',
      sub: Number(astrologer.ratingCount) > 0 ? `${formatCount(astrologer.ratingCount)} reviews` : 'No reviews yet',
    },
    { value: `${astrologer.experienceYears || 0} Yrs`, label: 'Experience', sub: 'Of practice' },
    {
      value: astrologer.consultations > 0 ? `${formatCount(astrologer.consultations)}+` : 'New',
      label: 'Consultations',
      sub: 'Completed',
    },
    {
      value: price ? `₹${price.now}/min` : '—',
      label: 'Price',
      sub: chat && call ? `Chat · Call ₹${call.now}/min` : chat ? 'Chat, per minute' : call ? 'Call, per minute' : 'On request',
    },
    { value: String(languages.length), label: 'Languages', sub: joinLabels(languages) || '—' },
  ]
}

function aboutParagraphs(astrologer) {
  const about = String(astrologer.about || '').trim()
  if (about) return about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const skills = expertiseLabels(astrologer.expertise)
  const years = astrologer.experienceYears ? ` with ${astrologer.experienceYears} years of practice` : ''
  return [`${astrologer.name} is a verified Shree Astro astrologer${years}${skills.length ? ` specialising in ${skills.join(', ')}` : ''}.`]
}

function expertiseCards(astrologer) {
  const years = astrologer.experienceYears ? `${astrologer.experienceYears} yrs` : 'Expertise'
  const cards = expertiseLabels(astrologer.expertise).map((title) => ({ title, tag: years }))
  ;(astrologer.specializations ?? []).forEach((title) => cards.push({ title, tag: 'Specialisation' }))
  ;(astrologer.topics ?? []).forEach((id) => cards.push({ title: topicLabel(id), tag: 'Topic' }))
  const seen = new Set()
  return cards.filter((card) => {
    const key = card.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function reviewView(review) {
  const channel = review.channel ? titleCase(review.channel) : ''
  const duration = review.durationSeconds ? minutesOf(review.durationSeconds) : ''
  return {
    id: review.id,
    name: review.reviewer || 'Anonymous',
    photo: photoUrl(review.avatar) || initialsAvatar(review.reviewer),
    meta: [channel, duration].filter(Boolean).join(' · '),
    date: shortDate(review.at),
    stars: Math.round(Number(review.rating) || 0),
    text: review.comment,
    reply: review.reply,
  }
}

/* --------------------------------------------------------------- pieces */

function ReviewStars({ count }) {
  return (
    <div className="astrologer-profile__review-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <img
          key={i}
          className="astrologer-profile__review-star"
          src={i < count ? starSm : starSmEmpty}
          alt=""
        />
      ))}
    </div>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 21s-6.7-4.35-9.33-8.1C.6 9.93 1.6 5.9 5.05 4.6c2.03-.77 4.3-.1 5.6 1.6l1.35 1.75 1.35-1.75c1.3-1.7 3.57-2.37 5.6-1.6 3.45 1.3 4.45 5.33 2.38 8.3C18.7 16.65 12 21 12 21z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InstantActions({ astrologer, className = '' }) {
  const hasCall = Boolean(rateOf(astrologer.rates?.call))
  const hasChat = Boolean(rateOf(astrologer.rates?.chat))
  return (
    <div className={`astrologer-profile__actions ${className}`.trim()}>
      {hasCall && (
        <Link to={`/intake/${astrologer.id}?mode=call`} className="astrologer-profile__action astrologer-profile__action--call">
          <img src={iconCall} alt="" />
          Instant Call
        </Link>
      )}
      {hasChat && (
        <Link
          to={`/intake/${astrologer.id}?mode=chat`}
          className={`astrologer-profile__action${hasCall ? '' : ' astrologer-profile__action--call'}`}
        >
          <img className="icon-ink" src={iconChat} alt="" />
          Instant Chat
        </Link>
      )}
    </div>
  )
}

function OverviewPanel({ profile }) {
  const chips = profile.specializations?.length ? profile.specializations : expertiseLabels(profile.expertise)
  return (
    <div className="astrologer-profile__panel">
      <h3 className="astrologer-profile__panel-title">About {profile.name}</h3>
      {aboutParagraphs(profile).map((paragraph, i) => (
        <p key={i} className="astrologer-profile__about">
          {paragraph}
        </p>
      ))}
      {chips.length > 0 && (
        <ul className="astrologer-profile__chips">
          {chips.map((item) => (
            <li key={item} className="astrologer-profile__chip">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ExpertisePanel({ profile }) {
  const cards = expertiseCards(profile)
  return (
    <div className="astrologer-profile__panel">
      <h3 className="astrologer-profile__panel-title">Areas of Expertise</h3>
      {cards.length > 0 ? (
        <ul className="astrologer-profile__expertise">
          {cards.map((item) => (
            <li key={item.title} className="astrologer-profile__expertise-item">
              <span className="astrologer-profile__expertise-icon">
                <img src={iconExpertise} alt="" />
              </span>
              <div className="astrologer-profile__expertise-body">
                <div className="astrologer-profile__expertise-head">
                  <span className="astrologer-profile__expertise-title">{item.title}</span>
                  <span className="astrologer-profile__expertise-years">{item.tag}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="astrologer-profile__about">This astrologer has not listed their areas of expertise yet.</p>
      )}
    </div>
  )
}

function ReviewsPanel({ profile, reviews, hasMore, loadingMore, error, onLoadMore }) {
  const breakdown = profile.ratingBreakdown ?? {}
  const total = BREAKDOWN_ROWS.reduce((sum, row) => sum + (Number(breakdown[row.key]) || 0), 0) || Number(profile.ratingCount) || 0
  const rounded = Math.round(Number(profile.rating) || 0)
  return (
    <div className="astrologer-profile__panel">
      <div className="astrologer-profile__summary">
        <div className="astrologer-profile__summary-score">
          <span className="astrologer-profile__summary-number">{ratingLabel(profile.rating, profile.ratingCount)}</span>
          <div className="astrologer-profile__summary-stars">
            {Array.from({ length: 5 }, (_, i) => (
              <img
                key={i}
                className="astrologer-profile__summary-star"
                src={starLg}
                alt=""
                style={i < rounded ? undefined : { opacity: 0.25 }}
              />
            ))}
          </div>
          <span className="astrologer-profile__summary-count">{formatCount(profile.ratingCount)} reviews</span>
        </div>
        <div className="astrologer-profile__bars">
          {BREAKDOWN_ROWS.map((row) => {
            const pct = total ? Math.round(((Number(breakdown[row.key]) || 0) / total) * 100) : 0
            return (
              <div key={row.stars} className="astrologer-profile__bar-row">
                <span className="astrologer-profile__bar-num">{row.stars}</span>
                <img className="astrologer-profile__bar-star" src={starXs} alt="" />
                <div className="astrologer-profile__bar-track">
                  <div className="astrologer-profile__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="astrologer-profile__bar-pct">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
      {reviews.length > 0 ? (
        <ul className="astrologer-profile__reviews">
          {reviews.map(reviewView).map((review) => (
            <li key={review.id} className="astrologer-profile__review">
              <img className="astrologer-profile__review-photo" src={review.photo} alt={review.name} />
              <div className="astrologer-profile__review-body">
                <div className="astrologer-profile__review-head">
                  <div className="astrologer-profile__review-who">
                    <span className="astrologer-profile__review-name">{review.name}</span>
                    {review.meta && <span className="astrologer-profile__review-city">{review.meta}</span>}
                  </div>
                  <span className="astrologer-profile__review-date">{review.date}</span>
                </div>
                <ReviewStars count={review.stars} />
                {review.text && <p className="astrologer-profile__review-text">{review.text}</p>}
                {review.reply && (
                  <p className="astrologer-profile__review-reply">
                    <strong>Reply from {profile.name}:</strong> {review.reply}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="astrologer-profile__about astrologer-profile__reviews-empty">No reviews yet — be the first to consult and share your experience.</p>
      )}
      {error && (
        <p className="astrologer-profile__inline-error" role="alert">
          {error}
        </p>
      )}
      {hasMore && (
        <div className="astrologer-profile__more">
          <button type="button" className="astrologer-profile__load-more" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more reviews'}
          </button>
        </div>
      )}
    </div>
  )
}

function AvailabilityPanel({ profile }) {
  const pill = statusPill(profile)
  return (
    <div className="astrologer-profile__panel">
      <h3 className="astrologer-profile__panel-title">Availability</h3>
      <p className="astrologer-profile__availability-sub">{availabilityText(profile)}</p>
      <div className="astrologer-profile__live">
        <span className={`astrologer-profile__online astrologer-profile__online--${pill.key}`}>
          <span className="astrologer-profile__online-dot" />
          {pill.label}
        </span>
        <p className="astrologer-profile__live-note">
          {pill.key === 'online'
            ? 'Connect right away — your consultation starts as soon as the astrologer accepts.'
            : pill.key === 'busy'
              ? 'The astrologer is in another consultation. Send a request now and you will be connected as soon as they are free.'
              : 'The astrologer is not taking consultations right now. You can still send a request, and they will pick it up when they come online.'}
        </p>
      </div>
      <InstantActions astrologer={profile} className="astrologer-profile__actions--inline" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="astrologer-profile">
      <div className="container">
        <div className="astrologer-profile__inner astrologer-profile__notice">
          <h1 className="astrologer-profile__notice-title">Astrologer not found</h1>
          <p className="astrologer-profile__notice-text">
            This astrologer is not available right now. They may have gone off the platform or the link may be out of date.
          </p>
          <Link to="/astrologers" className="astrologer-profile__notice-link">
            Browse all astrologers
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadError({ message, onRetry }) {
  return (
    <div className="astrologer-profile">
      <div className="container">
        <div className="astrologer-profile__inner astrologer-profile__notice" role="alert">
          <h1 className="astrologer-profile__notice-title">Could not load this profile</h1>
          <p className="astrologer-profile__notice-text">{message}</p>
          <button type="button" className="astrologer-profile__notice-link" onClick={onRetry}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="astrologer-profile" aria-busy="true">
      <div className="astrologer-profile__breadcrumb-bar">
        <div className="container">
          <nav className="astrologer-profile__inner astrologer-profile__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">›</span>
            <Link to="/astrologers">Astrologers</Link>
          </nav>
        </div>
      </div>
      <div className="container">
        <div className="astrologer-profile__inner astrologer-profile__layout">
          <div className="astrologer-profile__main">
            <section className="astrologer-profile__card">
              <div className="astrologer-profile__band" />
              <div className="astrologer-profile__identity">
                <div className="astrologer-profile__hero">
                  <div className="astrologer-profile__avatar astrologer-profile__bone" />
                  <div className="astrologer-profile__heading">
                    <div className="astrologer-profile__bone astrologer-profile__bone--title" />
                    <div className="astrologer-profile__bone astrologer-profile__bone--line" />
                  </div>
                </div>
                <ul className="astrologer-profile__stats">
                  {Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className="astrologer-profile__stat">
                      <span className="astrologer-profile__bone astrologer-profile__bone--stat" />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <section className="astrologer-profile__tabs-card">
              <div className="astrologer-profile__panel">
                <div className="astrologer-profile__bone astrologer-profile__bone--title" />
                <div className="astrologer-profile__bone astrologer-profile__bone--para" />
                <div className="astrologer-profile__bone astrologer-profile__bone--para" />
              </div>
            </section>
          </div>
          <aside className="astrologer-profile__sidebar">
            <div className="astrologer-profile__price-card">
              <div className="astrologer-profile__bone astrologer-profile__bone--price" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page */

export default function AstrologerProfile() {
  const { id } = useParams()
  const { isLoggedIn } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${id}|${reloadKey}`
  /** `loading` is "what is on screen was fetched for a different astrologer". */
  const [result, setResult] = useState({ key: null, profile: null, error: null })
  const loading = result.key !== requestKey
  const { profile, error } = result

  const [reviews, setReviews] = useState([])
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsDone, setReviewsDone] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')

  const [favourite, setFavourite] = useState(false)
  const [favBusy, setFavBusy] = useState(false)

  const paramTab = searchParams.get('tab')
  const initialTab = TABS.some((t) => t.key === paramTab) ? paramTab : 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    let cancelled = false
    const [astrologerId] = requestKey.split('|')
    fetchAstrologer(astrologerId)
      .then((data) => {
        if (cancelled) return
        const initial = data.reviews ?? []
        setReviews(initial)
        setReviewsPage(1)
        setReviewsDone(initial.length < REVIEWS_PAGE)
        setReviewsError('')
        setResult({ key: requestKey, profile: data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: requestKey, profile: null, error: err })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey])

  useEffect(() => {
    if (!isLoggedIn) return undefined
    let cancelled = false
    fetchFavourites()
      .then((items) => {
        if (!cancelled) setFavourite(items.some((item) => item.id === id))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, id])

  const onToggleFavourite = async () => {
    if (favBusy) return
    setFavBusy(true)
    const previous = favourite
    setFavourite(!previous)
    try {
      setFavourite(await toggleFavourite(id))
    } catch {
      setFavourite(previous)
    } finally {
      setFavBusy(false)
    }
  }

  const loadMoreReviews = async () => {
    const nextPage = reviewsPage + 1
    setReviewsLoading(true)
    setReviewsError('')
    try {
      const more = await fetchAstrologerReviews(id, nextPage, REVIEWS_PAGE)
      setReviews((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        return [...prev, ...more.filter((r) => !seen.has(r.id))]
      })
      setReviewsPage(nextPage)
      if (more.length < REVIEWS_PAGE) setReviewsDone(true)
    } catch (err) {
      setReviewsError(messageOf(err, 'Could not load more reviews.'))
    } finally {
      setReviewsLoading(false)
    }
  }

  const selectTab = (key) => {
    setActiveTab(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'overview') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next, { replace: true })
  }

  if (loading) return <ProfileSkeleton />
  if (error?.status === 404) return <NotFound />
  if (error || !profile) {
    return <LoadError message={messageOf(error, 'Could not load this profile.')} onRetry={() => setReloadKey((n) => n + 1)} />
  }

  const isFavourite = isLoggedIn && favourite
  const pill = statusPill(profile)
  const chatRate = rateOf(profile.rates?.chat)
  const callRate = rateOf(profile.rates?.call)
  const price = priceOf(profile.rates)
  const badges = (profile.badges ?? []).map(titleCase)
  const totalMinutes = (Number(profile.chatMinutes) || 0) + (Number(profile.callMinutes) || 0)
  const quickInfo = [
    { icon: iconResponse, label: 'Availability', value: pill.label },
    { icon: iconLocation, label: 'Languages', value: joinLabels(profile.languages) || '—' },
    {
      icon: iconVerifiedSince,
      label: 'Time Consulted',
      value: totalMinutes > 0 ? `${formatCount(totalMinutes)} min · ${consultationsLabel(profile.consultations)}` : consultationsLabel(profile.consultations),
    },
    { icon: iconTopRated, label: 'Badges', value: badges.length ? badges.join(', ') : 'Verified Astrologer' },
  ]

  return (
    <div className="astrologer-profile">
      <div className="astrologer-profile__breadcrumb-bar">
        <div className="container">
          <nav className="astrologer-profile__inner astrologer-profile__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">›</span>
            <Link to="/astrologers">Astrologers</Link>
            <span aria-hidden="true">›</span>
            <span className="astrologer-profile__breadcrumb-current">{profile.name}</span>
          </nav>
        </div>
      </div>

      <div className="container">
        <div className="astrologer-profile__inner astrologer-profile__layout">
          <div className="astrologer-profile__main">
            <section className="astrologer-profile__card">
              <div className="astrologer-profile__band">
                <img className="astrologer-profile__band-star" src={starOutline} alt="" />
              </div>
              <div className="astrologer-profile__identity">
                <div className="astrologer-profile__hero">
                  <div className="astrologer-profile__avatar">
                    <img src={photoOf(profile)} alt={profile.name} />
                  </div>
                  <div className="astrologer-profile__heading">
                    <div className="astrologer-profile__name-row">
                      <h1 className="astrologer-profile__name">{profile.name}</h1>
                      <img className="astrologer-profile__verified" src={verifiedIcon} alt="Verified" />
                    </div>
                    <p className="astrologer-profile__tagline">{taglineOf(profile)}</p>
                  </div>
                  <div className="astrologer-profile__hero-side">
                    <span className={`astrologer-profile__online astrologer-profile__online--${pill.key}`}>
                      <span className="astrologer-profile__online-dot" />
                      {pill.label}
                    </span>
                    {isLoggedIn && (
                      <button
                        type="button"
                        className={`astrologer-profile__fav${isFavourite ? ' astrologer-profile__fav--active' : ''}`}
                        aria-pressed={isFavourite}
                        aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                        title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                        onClick={onToggleFavourite}
                        disabled={favBusy}
                      >
                        <HeartIcon filled={isFavourite} />
                      </button>
                    )}
                  </div>
                </div>
                <ul className="astrologer-profile__stats">
                  {statsOf(profile).map((stat) => (
                    <li key={stat.label} className="astrologer-profile__stat">
                      <span className="astrologer-profile__stat-value">{stat.value}</span>
                      <span className="astrologer-profile__stat-label">{stat.label}</span>
                      <span className="astrologer-profile__stat-sub">{stat.sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="astrologer-profile__tabs-card">
              <div className="astrologer-profile__tabs" role="tablist">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    className={`astrologer-profile__tab${activeTab === tab.key ? ' astrologer-profile__tab--active' : ''}`}
                    onClick={() => selectTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === 'overview' && <OverviewPanel profile={profile} />}
              {activeTab === 'expertise' && <ExpertisePanel profile={profile} />}
              {activeTab === 'reviews' && (
                <ReviewsPanel
                  profile={profile}
                  reviews={reviews}
                  hasMore={!reviewsDone}
                  loadingMore={reviewsLoading}
                  error={reviewsError}
                  onLoadMore={loadMoreReviews}
                />
              )}
              {activeTab === 'availability' && <AvailabilityPanel profile={profile} />}
            </section>
          </div>

          <aside className="astrologer-profile__sidebar">
            <div className="astrologer-profile__price-card">
              <div className="astrologer-profile__price-top">
                <span className="astrologer-profile__price-label">
                  {chatRate ? 'Chat Price' : callRate ? 'Call Price' : 'Consultation Price'}
                </span>
                <p className="astrologer-profile__price">
                  {price ? (
                    <>
                      {price.was && <s className="astrologer-profile__price-was">₹{price.was}</s>}₹{price.now}
                      <span className="astrologer-profile__price-unit">/min</span>
                    </>
                  ) : (
                    <span className="astrologer-profile__price-unit">Rate on request</span>
                  )}
                </p>
                {chatRate && callRate && (
                  <span className="astrologer-profile__price-alt">
                    Call {callRate.was && <s>₹{callRate.was}</s>} ₹{callRate.now}/min
                  </span>
                )}
                {price?.was && <span className="astrologer-profile__price-free">Save ₹{price.was - price.now}/min today</span>}
              </div>
              <div className="astrologer-profile__actions">
                {callRate && (
                  <Link to={`/intake/${profile.id}?mode=call`} className="astrologer-profile__action astrologer-profile__action--call">
                    <img src={iconCall} alt="" />
                    Instant Call
                  </Link>
                )}
                {chatRate && (
                  <Link
                    to={`/intake/${profile.id}?mode=chat`}
                    className={`astrologer-profile__action${callRate ? '' : ' astrologer-profile__action--call'}`}
                  >
                    <img className="icon-ink" src={iconChat} alt="" />
                    Instant Chat
                  </Link>
                )}
                <button type="button" className="astrologer-profile__action" onClick={() => selectTab('availability')}>
                  <img className="icon-ink" src={iconCalendar} alt="" />
                  Check Availability
                </button>
              </div>
            </div>

            <div className="astrologer-profile__info-card">
              <h2 className="astrologer-profile__info-title">Quick Info</h2>
              <ul className="astrologer-profile__info-list">
                {quickInfo.map((row) => (
                  <li key={row.label} className="astrologer-profile__info-row">
                    <img className="astrologer-profile__info-icon" src={row.icon} alt="" />
                    <div className="astrologer-profile__info-text">
                      <span className="astrologer-profile__info-label">{row.label}</span>
                      <span className="astrologer-profile__info-value">{row.value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
