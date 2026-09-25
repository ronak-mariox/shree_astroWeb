import { fetchTestimonials } from '../../../api/index.js'
import { initialOf, mediaUrl, useAsync } from '../../../pages/Account/accountUtils.js'
import peopleIcon from '../../../assets/home/testimonials/people-icon.svg'
import starIcon from '../../../assets/home/testimonials/star-icon.svg'
import checkIcon from '../../../assets/home/testimonials/check-icon.svg'
import './Testimonials.css'

const STARS = [0, 1, 2, 3, 4]

function Face({ src, name }) {
  const url = mediaUrl(src)
  if (url) return <img src={url} alt={name || ''} className="testimonials__avatar" />
  return (
    <span className="testimonials__avatar testimonials__avatar--fallback" aria-hidden="true">
      {initialOf(name)}
    </span>
  )
}

function CardSkeleton() {
  return (
    <article className="testimonials__card testimonials__card--skeleton" aria-hidden="true">
      <span className="testimonials__bone" style={{ width: 90 }} />
      <span className="testimonials__bone" style={{ marginTop: 18 }} />
      <span className="testimonials__bone" style={{ marginTop: 8 }} />
      <span className="testimonials__bone" style={{ marginTop: 8, width: '70%' }} />
      <span className="testimonials__bone" style={{ marginTop: 18, width: 120, height: 22, borderRadius: 999 }} />
      <div className="testimonials__divider" />
      <div className="testimonials__person">
        <span className="testimonials__bone" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
        <div className="testimonials__meta">
          <span className="testimonials__bone" style={{ width: '50%' }} />
          <span className="testimonials__bone" style={{ width: '35%', marginTop: 8, height: 10 }} />
        </div>
      </div>
    </article>
  )
}

/** Three admin-curated success stories; the section disappears when there are none. */
export default function Testimonials() {
  const { data, loading, error } = useAsync(() => fetchTestimonials({ kind: 'story', limit: 3 }))
  const items = (data?.items ?? []).slice(0, 3)

  if (error || (!loading && items.length === 0)) return null

  return (
    <section className="testimonials">
      <div className="testimonials__inner">
        <div className="testimonials__header">
          <span className="testimonials__badge">
            <img src={peopleIcon} alt="" className="testimonials__badge-icon" />
            <span>Testimonials</span>
          </span>
          <h2 className="testimonials__title">Success Stories</h2>
          <p className="testimonials__subtitle">
            Real transformations from real people who found clarity and direction with Shree Astro.
          </p>
        </div>

        <div className="testimonials__grid">
          {loading && items.length === 0
            ? [0, 1, 2].map((i) => <CardSkeleton key={i} />)
            : items.map((item) => (
                <article key={item.id} className="testimonials__card">
                  <div className="testimonials__stars" aria-label="5 out of 5 stars">
                    {STARS.map((i) => (
                      <img key={i} src={starIcon} alt="" className="testimonials__star" />
                    ))}
                  </div>
                  <blockquote className="testimonials__quote">
                    {item.quote ? `“${item.quote}”` : item.title}
                  </blockquote>
                  {(item.tag || item.outcome) && <span className="testimonials__tag">{item.tag || item.outcome}</span>}
                  <div className="testimonials__divider" />
                  <div className="testimonials__person">
                    <Face src={item.avatarUrl} name={item.name} />
                    <div className="testimonials__meta">
                      <p className="testimonials__name">{item.name}</p>
                      {item.city && <p className="testimonials__city">{item.city}</p>}
                    </div>
                    <img src={checkIcon} alt="Verified" className="testimonials__check" />
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  )
}
