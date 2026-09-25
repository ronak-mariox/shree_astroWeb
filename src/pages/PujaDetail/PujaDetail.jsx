import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchPuja, rupees } from '../../api/index.js'
import { useAuth } from '../../context/useAuth.js'
import { mediaUrl, useAsync } from '../Account/accountUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import BookingModal from '../../components/puja/BookingModal.jsx'
import chevronLeftIcon from '../../assets/pages/puja/chevron-left.svg'
import checkIcon from '../../assets/pages/puja/check.svg'
import shieldIcon from '../../assets/pages/puja/shield.svg'
import './PujaDetail.css'

function DetailSkeleton() {
  return (
    <section className="puja-detail" aria-busy="true">
      <div className="puja-detail__hero puja-detail__hero--skeleton">
        <Link to="/puja" className="puja-detail__back">
          <img src={chevronLeftIcon} alt="" className="puja-detail__back-icon" />
          All Pujas
        </Link>
      </div>
      <div className="puja-detail__inner">
        <div className="puja-detail__layout">
          <div className="puja-detail__main">
            <div className="puja-detail__card">
              <Bone style={{ width: 180, height: 22 }} />
              <Bone style={{ width: '100%', height: 14, marginTop: 18 }} />
              <Bone style={{ width: '95%', height: 14, marginTop: 10 }} />
              <Bone style={{ width: '70%', height: 14, marginTop: 10 }} />
            </div>
            <div className="puja-detail__card puja-detail__card--benefits">
              <Bone style={{ width: 120, height: 22 }} />
              <Bone style={{ width: '80%', height: 14, marginTop: 18 }} />
              <Bone style={{ width: '65%', height: 14, marginTop: 10 }} />
              <Bone style={{ width: '75%', height: 14, marginTop: 10 }} />
            </div>
          </div>
          <aside className="puja-detail__sidebar">
            <div className="puja-detail__price-card">
              <Bone style={{ width: 120, height: 40 }} />
              <Bone style={{ width: 100, height: 12, marginTop: 10 }} />
              <Bone style={{ width: '100%', height: 14, marginTop: 24 }} />
              <Bone style={{ width: '100%', height: 14, marginTop: 12 }} />
              <Bone style={{ width: '100%', height: 14, marginTop: 12 }} />
              <Bone style={{ width: '100%', height: 52, marginTop: 24, borderRadius: 14 }} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default function PujaDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const { data: puja, loading, error, reload } = useAsync(() => fetchPuja(slug), [slug])
  const [bookingOpen, setBookingOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  if (loading && !puja) return <DetailSkeleton />

  if (!puja) {
    const missing = /not found/i.test(error || '')
    return (
      <section className="puja-detail">
        <div className="puja-detail__inner puja-detail__inner--state">
          {missing ? (
            <PageEmpty
              title="Puja not found"
              text="This puja may have been removed. Browse the others."
              action={
                <Link to="/puja" className="ui-state__btn">
                  All Pujas
                </Link>
              }
            />
          ) : (
            <PageError message={error} onRetry={reload} />
          )}
        </div>
      </section>
    )
  }

  const openBooking = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setBookingOpen(true)
  }

  const rated = Number(puja.ratingCount) > 0
  const benefits = puja.benefits ?? []

  return (
    <section className="puja-detail">
      <div className="puja-detail__hero">
        {puja.imageUrl && <img src={mediaUrl(puja.imageUrl)} alt={puja.name} className="puja-detail__hero-img" />}
        <div className="puja-detail__hero-shade" />
        <Link to="/puja" className="puja-detail__back">
          <img src={chevronLeftIcon} alt="" className="puja-detail__back-icon" />
          All Pujas
        </Link>
        <div className="puja-detail__hero-text">
          {puja.badge && (
            <div className="puja-detail__badge-row">
              <span className="puja-detail__badge">{puja.badge}</span>
            </div>
          )}
          <h1 className="puja-detail__title">{puja.name}</h1>
          {puja.tagline && <p className="puja-detail__tagline">{puja.tagline}</p>}
        </div>
      </div>

      <div className="puja-detail__inner">
        <div className="puja-detail__layout">
          <div className="puja-detail__main">
            <div className="puja-detail__card">
              <h2 className="puja-detail__card-title">About this Puja</h2>
              <p className="puja-detail__about">{puja.description || 'Details coming soon.'}</p>
            </div>

            {benefits.length > 0 && (
              <div className="puja-detail__card puja-detail__card--benefits">
                <h2 className="puja-detail__card-title">Benefits</h2>
                <ul className="puja-detail__benefits">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="puja-detail__benefit">
                      <span className="puja-detail__check">
                        <img src={checkIcon} alt="" className="puja-detail__check-icon" />
                      </span>
                      <span className="puja-detail__benefit-text">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="puja-detail__sidebar">
            {confirmed && (
              <div className="puja-detail__success" role="status">
                Booking <strong>{confirmed.reference}</strong> confirmed for {puja.name} on {confirmed.date} at{' '}
                {confirmed.time}.{' '}
                <Link to={`/account/pujas/${confirmed.id}`} className="puja-detail__success-link">
                  View booking
                </Link>
              </div>
            )}
            <div className="puja-detail__price-card">
              <p className="puja-detail__price">
                {rupees(puja.price)}
                {puja.oldPrice ? <s className="puja-detail__old-price">{rupees(puja.oldPrice)}</s> : null}
              </p>
              <p className="puja-detail__price-note">Per Puja · Online</p>

              <dl className="puja-detail__rows">
                {puja.durationText && (
                  <div className="puja-detail__row">
                    <dt className="puja-detail__row-label">Duration</dt>
                    <dd className="puja-detail__row-value">{puja.durationText}</dd>
                  </div>
                )}
                {puja.panditName && (
                  <div className="puja-detail__row">
                    <dt className="puja-detail__row-label">Pandit</dt>
                    <dd className="puja-detail__row-value">{puja.panditName}</dd>
                  </div>
                )}
                <div className="puja-detail__row">
                  <dt className="puja-detail__row-label">Rating</dt>
                  <dd className="puja-detail__row-value">
                    {rated ? `${Number(puja.rating).toFixed(1)} ★ (${puja.ratingCount} reviews)` : 'New'}
                  </dd>
                </div>
              </dl>

              <button type="button" className="puja-detail__book" onClick={openBooking}>
                Book Online Puja
              </button>

              <p className="puja-detail__note">
                <img src={shieldIcon} alt="" className="puja-detail__note-icon" />
                100% authentic Vedic rituals
              </p>
            </div>
          </aside>
        </div>
      </div>

      <BookingModal
        puja={puja}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onComplete={(booking) => {
          setBookingOpen(false)
          setConfirmed(booking)
        }}
      />
    </section>
  )
}
