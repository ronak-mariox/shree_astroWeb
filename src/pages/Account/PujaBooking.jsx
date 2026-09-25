import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelPujaBooking, fetchPujaBooking, messageOf, ratePujaBooking, rupees, shortDate } from '../../api/index.js'
import arrowLeftIcon from '../../assets/account/pujas/arrow-left.svg'
import playIcon from '../../assets/account/pujas/play-lg.svg'
import chevronIcon from '../../assets/account/pujas/chevron-right.svg'
import starIcon from '../../assets/account/pujas/star.svg'
import starOutlineIcon from '../../assets/account/pujas/star-outline.svg'
import { EmptyState, ErrorState, RatingForm, Skeleton } from './accountUi.jsx'
import { BOOKING_STATUS_LABEL, groupOfBooking, mediaUrl, useAsync } from './accountUtils.js'
import './PujaBooking.css'

const PANEL_TITLE = {
  upcoming: 'Upcoming Puja',
  completed: 'Puja Completed',
  cancelled: 'Booking Cancelled',
}

const PAYMENT_LABEL = { paid: 'Paid (wallet)', refunded: 'Refunded to wallet' }

function DetailSkeleton() {
  return (
    <div className="puja-booking" aria-busy="true">
      <div className="puja-booking__head">
        <h1 className="puja-booking__title">Booking Details</h1>
        <Skeleton style={{ width: 160, height: 14, marginTop: 6 }} />
      </div>
      <div className="puja-booking__grid">
        <section className="puja-booking__main">
          <Skeleton className="puja-booking__hero" style={{ borderRadius: 0 }} />
          <div className="puja-booking__content">
            <Skeleton style={{ width: '40%', height: 20 }} />
            <Skeleton style={{ width: '30%', height: 12, marginTop: 8 }} />
            <Skeleton style={{ width: '100%', height: 90, marginTop: 20, borderRadius: 12 }} />
          </div>
        </section>
        <aside className="puja-booking__side">
          <Skeleton style={{ width: '100%', height: 180, borderRadius: 16 }} />
        </aside>
      </div>
    </div>
  )
}

export default function PujaBooking() {
  const { id } = useParams()
  const { data: booking, loading, error, reload, setData } = useAsync(() => fetchPujaBooking(id), [id])
  const [rating, setRating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  if (loading && !booking) return <DetailSkeleton />

  if (!booking) {
    return (
      <div className="puja-booking">
        <div className="puja-booking__head">
          <h1 className="puja-booking__title">Booking Details</h1>
        </div>
        <Link to="/account/pujas" className="puja-booking__back">
          <span className="puja-booking__back-icon">
            <img className="icon-ink" src={arrowLeftIcon} alt="" />
          </span>
          Back to My Pujas
        </Link>
        {/not found/i.test(error || '') ? (
          <EmptyState title="Booking not found" text="This booking does not exist or belongs to another account." />
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )}
      </div>
    )
  }

  const group = groupOfBooking(booking.status)
  const puja = booking.puja || {}
  const snapshot = booking.pujaSnapshot || {}
  const name = puja.name || snapshot.name || 'Puja'
  const image = mediaUrl(puja.imageUrl || snapshot.imageUrl)
  const pandit = puja.panditName || snapshot.panditName
  const contact = booking.contact || {}
  const rebookTo = puja.slug ? `/puja/${puja.slug}` : '/puja'

  const info = [
    { label: 'Date', value: shortDate(booking.date) },
    { label: 'Time', value: booking.time },
    { label: 'Booking ID', value: booking.reference },
    { label: 'Payment', value: PAYMENT_LABEL[booking.payment?.status] || 'Wallet' },
    { label: 'Amount Paid', value: rupees(booking.amount) },
  ]

  const cancel = async () => {
    if (!window.confirm(`Cancel booking ${booking.reference}? The amount will be refunded to your wallet.`)) return
    setBusy(true)
    setActionError('')
    try {
      setData(await cancelPujaBooking(booking.id))
    } catch (err) {
      setActionError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  const quickActions = [
    { label: 'Book Same Puja Again', to: rebookTo },
    { label: 'Explore More Pujas', to: '/puja' },
  ]

  return (
    <div className="puja-booking">
      <div className="puja-booking__head">
        <h1 className="puja-booking__title">Booking Details</h1>
        <p className="puja-booking__subtitle">{name}</p>
      </div>

      <Link to="/account/pujas" className="puja-booking__back">
        <span className="puja-booking__back-icon">
          <img className="icon-ink" src={arrowLeftIcon} alt="" />
        </span>
        Back to My Pujas
      </Link>

      <div className="puja-booking__grid">
        <section className="puja-booking__main">
          {image ? (
            <img className="puja-booking__hero" src={image} alt={name} />
          ) : (
            <div className="puja-booking__hero puja-booking__hero--empty" aria-hidden="true" />
          )}
          <div className="puja-booking__content">
            <div className="puja-booking__row">
              <div>
                <h2 className="puja-booking__name">{name}</h2>
                {pandit && <p className="puja-booking__pandit">{pandit}</p>}
              </div>
              <span className={`puja-booking__pill puja-booking__pill--${group}`}>{BOOKING_STATUS_LABEL[group]}</span>
            </div>

            <dl className="puja-booking__info">
              {info.map((item) => (
                <div key={item.label} className="puja-booking__cell">
                  <dt className="puja-booking__label">{item.label}</dt>
                  <dd className="puja-booking__value">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="puja-booking__contact">
              <p className="puja-booking__contact-title">Sankalp details</p>
              <dl className="puja-booking__contact-list">
                {contact.fullName && (
                  <div className="puja-booking__contact-row">
                    <dt>Name</dt>
                    <dd>{contact.fullName}</dd>
                  </div>
                )}
                {contact.phone && (
                  <div className="puja-booking__contact-row">
                    <dt>Phone</dt>
                    <dd>{contact.phone}</dd>
                  </div>
                )}
                {contact.email && (
                  <div className="puja-booking__contact-row">
                    <dt>Email</dt>
                    <dd>{contact.email}</dd>
                  </div>
                )}
                {contact.gotra && (
                  <div className="puja-booking__contact-row">
                    <dt>Gotra</dt>
                    <dd>{contact.gotra}</dd>
                  </div>
                )}
                {contact.address && (
                  <div className="puja-booking__contact-row">
                    <dt>Prasad address</dt>
                    <dd>{contact.address}</dd>
                  </div>
                )}
                {booking.notes && (
                  <div className="puja-booking__contact-row">
                    <dt>Notes</dt>
                    <dd>{booking.notes}</dd>
                  </div>
                )}
              </dl>
              {booking.adminNote && <p className="puja-booking__admin-note">Note from Shree Astro: {booking.adminNote}</p>}
            </div>
          </div>
        </section>

        <aside className="puja-booking__side">
          <div className={`puja-booking__panel puja-booking__panel--${group}`}>
            <p className={`puja-booking__panel-title puja-booking__panel-title--${group}`}>{PANEL_TITLE[group]}</p>

            {group === 'upcoming' && (
              <>
                <p className="puja-booking__panel-text">
                  Your puja is scheduled for <strong>{shortDate(booking.date)}</strong> at <strong>{booking.time}</strong>.
                  {booking.streamUrl
                    ? ' Join the live stream 5 minutes before.'
                    : ' The live link will appear here shortly before the puja.'}
                </p>
                {booking.streamUrl ? (
                  <a href={booking.streamUrl} target="_blank" rel="noopener noreferrer" className="puja-booking__join">
                    <span className="puja-booking__join-icon">
                      <img src={playIcon} alt="" />
                    </span>
                    Join Puja
                  </a>
                ) : (
                  <button type="button" className="puja-booking__join" disabled>
                    <span className="puja-booking__join-icon">
                      <img src={playIcon} alt="" />
                    </span>
                    Join Puja
                  </button>
                )}
                <button type="button" className="puja-booking__secondary" onClick={cancel} disabled={busy}>
                  {busy ? 'Cancelling…' : 'Cancel Booking'}
                </button>
              </>
            )}

            {group === 'completed' && (
              <>
                <p className="puja-booking__panel-text">
                  Your puja was performed on <strong>{shortDate(booking.date)}</strong> at <strong>{booking.time}</strong>.
                </p>
                {booking.rating != null ? (
                  <div className="puja-booking__rating" aria-label={`Rated ${booking.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className="puja-booking__star">
                        <img src={n <= booking.rating ? starIcon : starOutlineIcon} alt="" />
                      </span>
                    ))}
                    <span className="puja-booking__rating-text">You rated this puja</span>
                  </div>
                ) : rating ? (
                  <RatingForm
                    label="How was this puja?"
                    submit={(value, comment) => ratePujaBooking(booking.id, value, comment)}
                    onCancel={() => setRating(false)}
                    onRated={(value, result) => {
                      setRating(false)
                      setData(result?.id ? result : { ...booking, rating: value })
                    }}
                  />
                ) : (
                  <button type="button" className="puja-booking__secondary" onClick={() => setRating(true)}>
                    Rate this Puja
                  </button>
                )}
                <Link to={rebookTo} className="puja-booking__join">
                  Book Again
                </Link>
              </>
            )}

            {group === 'cancelled' && (
              <>
                <p className="puja-booking__panel-text">
                  This booking for <strong>{shortDate(booking.date)}</strong> was cancelled.
                  {booking.payment?.status === 'refunded' ? (
                    <>
                      {' '}
                      A refund of <strong>{rupees(booking.amount)}</strong> has been credited to your wallet.
                    </>
                  ) : null}
                </p>
                <Link to={rebookTo} className="puja-booking__join">
                  Rebook This Puja
                </Link>
              </>
            )}

            {actionError && (
              <p className="puja-booking__error" role="alert">
                {actionError}
              </p>
            )}
          </div>

          <div className="puja-booking__quick">
            <p className="puja-booking__quick-title">Quick Actions</p>
            <ul className="puja-booking__quick-list">
              {quickActions.map((action) => (
                <li key={action.label}>
                  <Link to={action.to} className="puja-booking__quick-btn">
                    <span>{action.label}</span>
                    <span className="puja-booking__quick-icon">
                      <img className="icon-ink" src={chevronIcon} alt="" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
