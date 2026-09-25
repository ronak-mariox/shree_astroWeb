import { Link } from 'react-router-dom'
import { fetchPujas, rupees } from '../../../api/index.js'
import { mediaUrl, useAsync } from '../../../pages/Account/accountUtils.js'
import { Bone } from '../../ui/PageState.jsx'
import chevronRight from '../../../assets/home/puja-section/chevron-right.svg'
import starIcon from '../../../assets/home/puja-section/star.svg'
import clockIcon from '../../../assets/home/puja-section/clock.svg'
import shieldIcon from '../../../assets/home/puja-section/shield.svg'
import streamIcon from '../../../assets/home/puja-section/stream.svg'
import starOutlineIcon from '../../../assets/home/puja-section/star-outline.svg'
import refreshIcon from '../../../assets/home/puja-section/refresh.svg'
import './PujaSection.css'

const LIMIT = 6

const TRUST_POINTS = [
  { icon: shieldIcon, label: '1000+ Certified Pandits' },
  { icon: streamIcon, label: 'Live HD Streaming' },
  { icon: starOutlineIcon, label: '4.9 Average Rating' },
  { icon: refreshIcon, label: '100% Satisfaction Guarantee' },
]

/** Featured pujas first; when there are not enough of them, the latest ones fill the row. */
async function loadPujas() {
  const featured = (await fetchPujas({ featured: true, limit: LIMIT }))?.items ?? []
  if (featured.length >= LIMIT) return featured
  const all = (await fetchPujas({ limit: LIMIT }))?.items ?? []
  const seen = new Set(featured.map((p) => p.id))
  return [...featured, ...all.filter((p) => !seen.has(p.id))].slice(0, LIMIT)
}

function CardSkeleton() {
  return (
    <article className="puja-section__card" aria-hidden="true">
      <div className="puja-section__media">
        <Bone style={{ height: '100%', borderRadius: 0 }} />
      </div>
      <div className="puja-section__body">
        <Bone style={{ width: '85%', height: 13 }} />
        <Bone style={{ width: '55%', height: 13, marginTop: 12 }} />
        <div className="puja-section__foot">
          <Bone style={{ width: 90, height: 22 }} />
          <Bone style={{ width: 96, height: 38, borderRadius: 999 }} />
        </div>
      </div>
    </article>
  )
}

export default function PujaSection() {
  const { data, loading, error } = useAsync(loadPujas)
  const pujas = data ?? []

  // A failed or empty load hides the section rather than showing a broken grid.
  if (!loading && (error || pujas.length === 0)) return null

  return (
    <section className="puja-section">
      <div className="puja-section__inner">
        <div className="puja-section__head">
          <div className="puja-section__intro">
            <p className="puja-section__eyebrow">ONLINE PUJA SERVICES</p>
            <h2 className="puja-section__title">
              Sacred Pujas, Performed
              <br />
              By Certified Pandits
            </h2>
          </div>
          <Link to="/puja" className="puja-section__link">
            <span>View All Pujas</span>
            <img src={chevronRight} alt="" className="puja-section__link-icon icon-ink" />
          </Link>
        </div>

        <div className="puja-section__grid">
          {loading && !data
            ? Array.from({ length: LIMIT }, (_, i) => <CardSkeleton key={i} />)
            : pujas.map((puja) => {
                const rated = Number(puja.ratingCount) > 0
                const off = Number(puja.discountPercent) || 0
                return (
                  <article key={puja.id || puja.slug} className="puja-section__card">
                    <div className="puja-section__media">
                      {puja.imageUrl && <img src={mediaUrl(puja.imageUrl)} alt={puja.name} />}
                      <div className="puja-section__media-shade" />
                      {puja.badge && <span className="puja-section__badge">{puja.badge}</span>}
                      <div className="puja-section__caption">
                        {(puja.deity || puja.categoryLabel) && (
                          <p className="puja-section__deity">{puja.deity || puja.categoryLabel}</p>
                        )}
                        <h3 className="puja-section__name">{puja.name}</h3>
                      </div>
                    </div>

                    <div className="puja-section__body">
                      <p className="puja-section__desc">{puja.tagline || puja.description}</p>
                      <div className="puja-section__meta">
                        <img src={starIcon} alt="" className="puja-section__meta-icon" />
                        {rated ? (
                          <>
                            <span className="puja-section__rating">{Number(puja.rating).toFixed(1)}</span>
                            <span className="puja-section__reviews">({puja.ratingCount} reviews)</span>
                          </>
                        ) : (
                          <span className="puja-section__reviews">New</span>
                        )}
                        {puja.durationText && (
                          <>
                            <span className="puja-section__reviews">·</span>
                            <img src={clockIcon} alt="" className="puja-section__meta-icon" />
                            <span className="puja-section__duration">{puja.durationText}</span>
                          </>
                        )}
                      </div>
                      <div className="puja-section__foot">
                        <div className="puja-section__pricing">
                          <span className="puja-section__price">{rupees(puja.price)}</span>
                          {puja.oldPrice ? <s className="puja-section__old-price">{rupees(puja.oldPrice)}</s> : null}
                          {off > 0 && <span className="puja-section__off">{off}% off</span>}
                        </div>
                        <Link to={`/puja/${puja.slug}`} className="puja-section__book">
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
        </div>

        <ul className="puja-section__trust">
          {TRUST_POINTS.map((point) => (
            <li key={point.label} className="puja-section__trust-item">
              <img src={point.icon} alt="" className="puja-section__trust-icon" />
              <span>{point.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
