import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cancelPujaBooking, fetchPujaBookings, messageOf, ratePujaBooking, rupees, shortDate } from '../../api/index.js'
import calendarIcon from '../../assets/account/pujas/calendar.svg'
import clockIcon from '../../assets/account/pujas/clock.svg'
import playIcon from '../../assets/account/pujas/play.svg'
import plusIcon from '../../assets/account/pujas/plus-circle.svg'
import starIcon from '../../assets/account/pujas/star.svg'
import starOutlineIcon from '../../assets/account/pujas/star-outline.svg'
import { EmptyState, ErrorState, RatingForm, Skeleton } from './accountUi.jsx'
import { BOOKING_STATUS_LABEL, groupOfBooking, mediaUrl, useAsync } from './accountUtils.js'
import './Pujas.css'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const EMPTY_TEXT = {
  upcoming: 'No upcoming pujas. Book one to get started.',
  completed: 'No completed pujas yet.',
  cancelled: 'No cancelled pujas.',
}

function CardSkeleton() {
  return (
    <article className="account-pujas__card" aria-hidden="true">
      <Skeleton className="account-pujas__img" style={{ borderRadius: 14 }} />
      <div className="account-pujas__body">
        <Skeleton style={{ width: '40%', height: 18 }} />
        <Skeleton style={{ width: '30%', height: 12, marginTop: 8 }} />
        <Skeleton style={{ width: '70%', height: 12, marginTop: 14 }} />
        <Skeleton style={{ width: 200, height: 36, marginTop: 14, borderRadius: 10 }} />
      </div>
    </article>
  )
}

function BookingCard({ booking, onChange }) {
  const [rating, setRating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const group = groupOfBooking(booking.status)
  const puja = booking.puja || {}
  const snapshot = booking.pujaSnapshot || {}
  const name = puja.name || snapshot.name || 'Puja'
  const image = mediaUrl(puja.imageUrl || snapshot.imageUrl)
  const pandit = puja.panditName || snapshot.panditName
  const canRate = group === 'completed' && booking.rating == null

  const cancel = async () => {
    if (!window.confirm(`Cancel booking ${booking.reference}? The amount will be refunded to your wallet.`)) return
    setBusy(true)
    setError('')
    try {
      const next = await cancelPujaBooking(booking.id)
      onChange(next)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`account-pujas__card account-pujas__card--${group}`}>
      {image ? (
        <img className="account-pujas__img" src={image} alt={name} />
      ) : (
        <span className="account-pujas__img account-pujas__img--empty" aria-hidden="true" />
      )}
      <div className="account-pujas__body">
        <div className="account-pujas__row">
          <div>
            <h2 className="account-pujas__name">{name}</h2>
            {pandit && <p className="account-pujas__pandit">{pandit}</p>}
          </div>
          <span className={`account-pujas__pill account-pujas__pill--${group}`}>{BOOKING_STATUS_LABEL[group]}</span>
        </div>

        <div className="account-pujas__meta">
          <span className="account-pujas__meta-item">
            <span className="account-pujas__meta-icon">
              <img className="icon-ink" src={calendarIcon} alt="" />
            </span>
            {shortDate(booking.date)}
          </span>
          <span className="account-pujas__meta-item">
            <span className="account-pujas__meta-icon">
              <img className="icon-ink" src={clockIcon} alt="" />
            </span>
            {booking.time}
          </span>
          <span className="account-pujas__price">{rupees(booking.amount)}</span>
          <span className="account-pujas__id">ID: {booking.reference}</span>
        </div>

        <div className="account-pujas__actions">
          <Link to={`/account/pujas/${booking.id}`} className="account-pujas__btn">
            View Details
          </Link>
          {group === 'upcoming' && (
            <>
              {booking.streamUrl ? (
                <a
                  href={booking.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="account-pujas__btn account-pujas__btn--join"
                >
                  <span className="account-pujas__btn-icon">
                    <img src={playIcon} alt="" />
                  </span>
                  Join Puja
                </a>
              ) : (
                <button
                  type="button"
                  className="account-pujas__btn account-pujas__btn--join"
                  disabled
                  title="The live link appears here shortly before the puja"
                >
                  <span className="account-pujas__btn-icon">
                    <img src={playIcon} alt="" />
                  </span>
                  Join Puja
                </button>
              )}
              <button
                type="button"
                className="account-pujas__btn account-pujas__btn--cancel"
                onClick={cancel}
                disabled={busy}
              >
                {busy ? 'Cancelling…' : 'Cancel'}
              </button>
            </>
          )}
          {group === 'completed' && booking.rating != null && (
            <span className="account-pujas__rated" aria-label={`Rated ${booking.rating} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className="account-pujas__star">
                  <img src={n <= booking.rating ? starIcon : starOutlineIcon} alt="" />
                </span>
              ))}
              <span className="account-pujas__rated-text">Rated</span>
            </span>
          )}
          {canRate && !rating && (
            <button type="button" className="account-pujas__btn account-pujas__btn--join" onClick={() => setRating(true)}>
              Rate this Puja
            </button>
          )}
        </div>

        {error && (
          <p className="account-pujas__error" role="alert">
            {error}
          </p>
        )}

        {canRate && rating && (
          <RatingForm
            label="How was this puja?"
            submit={(value, comment) => ratePujaBooking(booking.id, value, comment)}
            onCancel={() => setRating(false)}
            onRated={(value, result) => {
              setRating(false)
              onChange(result?.id ? result : { ...booking, rating: value })
            }}
          />
        )}
      </div>
    </article>
  )
}

export default function Pujas() {
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const activeTab = TABS.some((t) => t.key === tabParam) ? tabParam : TABS[0].key
  const [counts, setCounts] = useState({})

  const { data, loading, error, reload, setData } = useAsync(async () => {
    const result = await fetchPujaBookings({ status: activeTab, limit: 50 })
    const items = result?.items ?? []
    setCounts((prev) => ({ ...prev, [activeTab]: result?.total ?? items.length }))
    return items
  }, [activeTab])

  const rows = data ?? []
  const busy = loading && !data

  const selectTab = (key) => {
    const next = new URLSearchParams(params)
    if (key === TABS[0].key) next.delete('tab')
    else next.set('tab', key)
    setParams(next, { replace: true })
  }

  const onChange = (next) => {
    const group = groupOfBooking(next.status)
    setData((list) => {
      const current = list ?? []
      if (group !== activeTab) {
        setCounts((prev) => ({
          ...prev,
          [activeTab]: Math.max(0, (prev[activeTab] ?? current.length) - 1),
          [group]: prev[group] != null ? prev[group] + 1 : undefined,
        }))
        return current.filter((b) => b.id !== next.id)
      }
      return current.map((b) => (b.id === next.id ? { ...b, ...next } : b))
    })
  }

  const countText = (key) => (counts[key] == null ? '·' : counts[key])

  return (
    <div className="account-pujas">
      <div className="account-pujas__head">
        <h1 className="account-pujas__title">My Booked Pujas</h1>
        <p className="account-pujas__subtitle">
          {busy ? 'Loading your bookings…' : `${countText('upcoming')} upcoming · ${countText('completed')} completed`}
        </p>
      </div>

      <div className="account-pujas__tabs" role="tablist" aria-label="Booked pujas">
        {TABS.map((t) => {
          const active = t.key === activeTab
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`account-pujas__tab${active ? ' account-pujas__tab--active' : ''}`}
              onClick={() => selectTab(t.key)}
            >
              <span>{t.label}</span>
              <span className="account-pujas__tab-count">{countText(t.key)}</span>
            </button>
          )
        })}
      </div>

      <div className="account-pujas__list">
        {busy ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState text={EMPTY_TEXT[activeTab]} />
        ) : (
          rows.map((booking) => <BookingCard key={booking.id} booking={booking} onChange={onChange} />)
        )}
      </div>

      <div className="account-pujas__footer">
        <Link to="/puja" className="account-pujas__book">
          <span className="account-pujas__book-icon">
            <img src={plusIcon} alt="" />
          </span>
          Book a New Puja
        </Link>
      </div>
    </div>
  )
}
