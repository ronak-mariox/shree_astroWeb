import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProductReviews, fetchTestimonials, messageOf, shortDate } from '../../api/index.js'
import { mediaUrl, useAsync } from '../Account/accountUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import starBold from '../../assets/pages/product-detail/star-bold.svg'
import starLinear from '../../assets/pages/product-detail/star-linear.svg'
import arrowDown from '../../assets/pages/product-detail/arrow-down.svg'
import playIcon from '../../assets/pages/product-detail/play.svg'

/**
 * "Rating and Review" card from the Figma product page (node 446-5587), fed
 * by real data: the summary and the list come from `GET /products/:slug/reviews`
 * (only buyers of delivered orders can write one), the customer photos are
 * the photos those buyers attached, and the "Loved by customers" strip is the
 * admin-curated video testimonials. Anything with nothing real behind it is
 * simply not rendered.
 */

const PAGE_SIZE = 5
const PHOTOS_COLLAPSED = 6

/** The bar colours per star, straight from the design. */
const BAR_COLORS = { 5: '#37b99e', 4: '#db80fe', 3: '#efc048', 2: '#33c2eb', 1: '#fe7615' }

const SORTS = [
  { key: 'recent', label: 'Recent' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'top', label: 'Top rated' },
  { key: 'low', label: 'Lowest rated' },
]

const EMPTY_LIST = { key: null, items: [], total: 0, page: 0, error: '' }

const formatCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n))

function Stars({ value, size = 14, className = '' }) {
  const rating = Math.round(Number(value) || 0)
  return (
    <span className={className} aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <img key={n} src={n <= rating ? starBold : starLinear} alt="" width={size} height={size} className={n <= rating ? undefined : 'icon-ink'} />
      ))}
    </span>
  )
}

function Review({ review }) {
  const reviewer = review.reviewer ?? {}
  const photos = Array.isArray(review.images) ? review.images : []
  return (
    <article className={`product-detail__review${review.pinned ? ' product-detail__review--pinned' : ''}`}>
      <h3 className="product-detail__review-title">{review.title || `${reviewer.name || 'Customer'}'s review`}</h3>
      <Stars value={review.rating} className="product-detail__review-stars" />
      <p className="product-detail__review-meta">
        {reviewer.name || 'Customer'}
        {review.verified !== false && <span className="product-detail__review-verified">Verified purchase</span>}
        <span className="product-detail__review-date">{shortDate(review.createdAt)}</span>
        {review.pinned && <span className="product-detail__review-date">Pinned</span>}
      </p>
      {review.comment && <p className="product-detail__review-text">{review.comment}</p>}
      {photos.length > 0 && (
        <div className="product-detail__review-photos">
          {photos.map((src, i) => (
            <a key={src} href={mediaUrl(src)} target="_blank" rel="noreferrer">
              <img src={mediaUrl(src)} alt={`Review photo ${i + 1}`} className="product-detail__review-photo" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {review.reply && (
        <div className="product-detail__review-reply">
          <p className="product-detail__review-reply-label">Reply from Shree Astro</p>
          <p className="product-detail__review-text">{review.reply}</p>
        </div>
      )}
    </article>
  )
}

function ListSkeleton() {
  return (
    <div className="product-detail__reviews" aria-busy="true">
      {[0, 1].map((i) => (
        <div key={i} className="product-detail__review">
          <Bone style={{ width: 180, height: 16 }} />
          <Bone style={{ width: 90, height: 12, marginTop: 8 }} />
          <Bone style={{ width: '100%', height: 12, marginTop: 10 }} />
          <Bone style={{ width: '85%', height: 12, marginTop: 6 }} />
        </div>
      ))}
    </div>
  )
}

export default function ProductReviews({ slug, product }) {
  const [sort, setSort] = useState('recent')
  const [summary, setSummary] = useState(null)
  const [list, setList] = useState(EMPTY_LIST)
  const [tick, setTick] = useState(0)
  const [more, setMore] = useState({ busy: false, error: '' })
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const videos = useAsync(() => fetchTestimonials({ kind: 'video', limit: 4 }))

  const requestKey = `${slug}:${sort}:${tick}`
  const loading = list.key !== requestKey

  useEffect(() => {
    let cancelled = false
    fetchProductReviews(slug, { page: 1, limit: PAGE_SIZE, sort })
      .then((data) => {
        if (cancelled) return
        setSummary(data?.summary ?? null)
        setList({ key: requestKey, items: data?.items ?? [], total: Number(data?.total) || 0, page: Number(data?.page) || 1, error: '' })
      })
      .catch((err) => {
        if (cancelled) return
        setList({ key: requestKey, items: [], total: 0, page: 0, error: messageOf(err) })
      })
    return () => {
      cancelled = true
    }
  }, [slug, sort, tick, requestKey])

  const loadMore = async () => {
    if (more.busy) return
    setMore({ busy: true, error: '' })
    try {
      const data = await fetchProductReviews(slug, { page: list.page + 1, limit: PAGE_SIZE, sort })
      setList((s) => ({
        ...s,
        items: [...s.items, ...(data?.items ?? [])],
        total: Number(data?.total) || s.total,
        page: Number(data?.page) || s.page + 1,
      }))
      setMore({ busy: false, error: '' })
    } catch (err) {
      setMore({ busy: false, error: messageOf(err) })
    }
  }

  const average = Number(summary?.average ?? product?.rating) || 0
  const count = Number(summary?.count ?? product?.ratingCount) || 0
  const distribution = summary?.distribution ?? {}
  const hasMore = list.items.length < list.total

  /** Every photo buyers attached, newest review first — the design's "Customer photos" grid. */
  const photos = useMemo(() => list.items.flatMap((r) => (Array.isArray(r.images) ? r.images : [])), [list.items])
  const shownPhotos = showAllPhotos ? photos : photos.slice(0, PHOTOS_COLLAPSED)
  const videoItems = (videos.data?.items ?? []).filter((v) => v.videoUrl || v.thumbnailUrl).slice(0, 4)

  return (
    <div className="product-detail__reviews-card" id="reviews">
      <div className="product-detail__reviews-grid">
        <div className="product-detail__reviews-side">
          <h2 className="product-detail__section-title">Rating and Review</h2>

          <div className="product-detail__summary">
            <div className="product-detail__score">
              <p className="product-detail__score-value">
                {count ? average.toFixed(1) : '–'}
                <span className="product-detail__score-of"> / 5</span>
              </p>
              <Stars value={average} size={12} className="product-detail__score-stars" />
              <p className="product-detail__score-count">{count ? `${formatCount(count)} ${count === 1 ? 'review' : 'reviews'}` : 'No ratings yet'}</p>
            </div>
            <div className="product-detail__bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = Number(distribution[star] ?? distribution[String(star)]) || 0
                const pct = count ? Math.round((n / count) * 100) : 0
                return (
                  <div key={star} className="product-detail__bar-row">
                    <span className="product-detail__bar-num">{star}</span>
                    <span className="product-detail__bar-track">
                      <span className="product-detail__bar-fill" style={{ width: `${pct}%`, background: BAR_COLORS[star] }} />
                    </span>
                    <span className="product-detail__bar-count">{formatCount(n)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {photos.length > 0 && (
            <>
              <div className="product-detail__divider" />
              <h2 className="product-detail__section-title">Customer photos</h2>
              <div className="product-detail__photos">
                {shownPhotos.map((src, i) => (
                  <a key={src + i} href={mediaUrl(src)} target="_blank" rel="noreferrer">
                    <img src={mediaUrl(src)} alt={`Customer photo ${i + 1}`} className="product-detail__photo" loading="lazy" />
                  </a>
                ))}
              </div>
              {photos.length > PHOTOS_COLLAPSED && (
                <button type="button" className="product-detail__see-more" onClick={() => setShowAllPhotos((v) => !v)}>
                  {showAllPhotos ? 'See Less' : 'See More'}
                </button>
              )}
            </>
          )}
        </div>

        <div className="product-detail__reviews-main">
          {count > 0 && (
            <div className="product-detail__sort">
              <select className="product-detail__sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort reviews">
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <img src={arrowDown} alt="" className="product-detail__sort-icon icon-ink" />
            </div>
          )}

          {loading ? (
            <ListSkeleton />
          ) : list.error ? (
            <PageError message={list.error} onRetry={() => setTick((t) => t + 1)} compact />
          ) : list.items.length === 0 ? (
            <PageEmpty
              compact
              title="No reviews yet"
              text="Bought this? Rate it from My Orders once it has been delivered."
              action={
                <Link to="/account/orders" className="product-detail__see-more">
                  Go to My Orders
                </Link>
              }
            />
          ) : (
            <>
              <div className="product-detail__reviews">
                {list.items.map((review) => (
                  <Review key={review.id} review={review} />
                ))}
              </div>
              {more.error && <p className="product-detail__reviews-error">{more.error}</p>}
              {hasMore && (
                <button type="button" className="product-detail__see-more" onClick={loadMore} disabled={more.busy}>
                  {more.busy ? 'Loading…' : `See more reviews (${list.total - list.items.length} left)`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {videoItems.length > 0 && (
        <div className="product-detail__loved">
          <h2 className="product-detail__section-title product-detail__section-title--center">Loved by our customers</h2>
          <div className="product-detail__videos">
            {videoItems.map((v, i) => (
              <a
                key={v.id || i}
                href={v.videoUrl || mediaUrl(v.thumbnailUrl)}
                target="_blank"
                rel="noreferrer"
                className="product-detail__video"
                style={{ backgroundImage: v.thumbnailUrl ? `url(${mediaUrl(v.thumbnailUrl)})` : undefined }}
                aria-label={`Play ${v.name ? `${v.name}'s` : 'customer'} video`}
              >
                <img src={playIcon} alt="" className="product-detail__play" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
