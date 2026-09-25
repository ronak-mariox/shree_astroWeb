import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPujas, messageOf, rupees } from '../../api/index.js'
import { mediaUrl } from '../Account/accountUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import sparkleIcon from '../../assets/pages/puja/sparkle.svg'
import starIcon from '../../assets/pages/puja/star.svg'
import clockIcon from '../../assets/pages/puja/clock.svg'
import userIcon from '../../assets/pages/puja/user.svg'
import './Puja.css'

const STARS = [0, 1, 2, 3, 4]
const PAGE_SIZE = 12

function CardSkeleton() {
  return (
    <article className="puja-list__card puja-list__card--skeleton" aria-hidden="true">
      <div className="puja-list__media">
        <Bone style={{ height: '100%', borderRadius: 0 }} />
      </div>
      <div className="puja-list__body">
        <Bone style={{ width: '60%', height: 20 }} />
        <Bone style={{ width: '85%', height: 13, marginTop: 10 }} />
        <Bone style={{ width: '40%', height: 13, marginTop: 14 }} />
        <Bone style={{ width: '70%', height: 13, marginTop: 10 }} />
        <div className="puja-list__foot">
          <Bone style={{ width: 80, height: 24 }} />
          <Bone style={{ width: 110, height: 40, borderRadius: 999 }} />
        </div>
      </div>
    </article>
  )
}

export function PujaCard({ puja }) {
  const rated = Number(puja.ratingCount) > 0
  return (
    <article className="puja-list__card">
      <div className="puja-list__media">
        {puja.imageUrl && <img src={mediaUrl(puja.imageUrl)} alt={puja.name} className="puja-list__photo" />}
        <div className="puja-list__shade" />
        {puja.badge && <span className="puja-list__badge">{puja.badge}</span>}
        {puja.categoryLabel && <span className="puja-list__label">{puja.categoryLabel}</span>}
      </div>

      <div className="puja-list__body">
        <h2 className="puja-list__name">{puja.name}</h2>
        {puja.tagline && <p className="puja-list__tagline">{puja.tagline}</p>}

        <div className="puja-list__rating">
          <span className="puja-list__stars">
            {STARS.map((i) => (
              <img key={i} src={starIcon} alt="" className="puja-list__star" />
            ))}
          </span>
          <span className="puja-list__rating-text">
            {rated ? `${Number(puja.rating).toFixed(1)} (${puja.ratingCount})` : 'New'}
          </span>
        </div>

        <div className="puja-list__meta">
          {puja.durationText && (
            <span className="puja-list__meta-item puja-list__meta-item--duration">
              <img src={clockIcon} alt="" className="puja-list__meta-icon" />
              {puja.durationText}
            </span>
          )}
          {puja.panditName && (
            <span className="puja-list__meta-item puja-list__meta-item--pandit">
              <img src={userIcon} alt="" className="puja-list__meta-icon" />
              {puja.panditName}
            </span>
          )}
        </div>

        <div className="puja-list__foot">
          <span className="puja-list__price">
            {rupees(puja.price)}
            {puja.oldPrice ? <s className="puja-list__old-price">{rupees(puja.oldPrice)}</s> : null}
          </span>
          <Link to={`/puja/${puja.slug}`} className="puja-list__book">
            Book Now
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function Puja() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const [categories, setCategories] = useState([])
  const [state, setState] = useState({ key: null, items: [], total: 0, page: 1, error: '' })
  const [loadingMore, setLoadingMore] = useState(false)
  const [tick, setTick] = useState(0)

  const requestKey = `${category}|${tick}`
  const loading = state.key !== requestKey

  useEffect(() => {
    let cancelled = false
    fetchPujas({ category: category || undefined, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        const items = data?.items ?? []
        setState({ key: requestKey, items, total: data?.total ?? items.length, page: 1, error: '' })
        if (Array.isArray(data?.categories)) setCategories(data.categories)
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ key: requestKey, items: [], total: 0, page: 1, error: messageOf(err, 'Could not load pujas.') })
        }
      })
    return () => {
      cancelled = true
    }
  }, [category, requestKey])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await fetchPujas({ category: category || undefined, page: state.page + 1, limit: PAGE_SIZE })
      setState((prev) =>
        prev.key === requestKey
          ? { ...prev, items: [...prev.items, ...(data?.items ?? [])], page: prev.page + 1, error: '' }
          : prev,
      )
    } catch (err) {
      setState((prev) => (prev.key === requestKey ? { ...prev, error: messageOf(err, 'Could not load more pujas.') } : prev))
    } finally {
      setLoadingMore(false)
    }
  }

  const selectCategory = (key) => {
    const next = new URLSearchParams(searchParams)
    if (!key) next.delete('category')
    else next.set('category', key)
    setSearchParams(next, { replace: true })
  }

  const { items, total, error } = state
  const hasMore = items.length < total

  return (
    <section className="puja-list">
      <div className="puja-list__inner">
        <div className="puja-list__head">
          <span className="puja-list__pill">
            <img src={sparkleIcon} alt="" className="puja-list__pill-icon" />
            ONLINE PUJA
          </span>
          <h1 className="puja-list__title">Sacred Pujas from Your Home</h1>
          <p className="puja-list__subtitle">
            Authentic Vedic rituals performed by qualified pandits. Participate live from anywhere.
          </p>
        </div>

        {categories.length > 0 && (
          <div className="puja-list__chips">
            <button
              type="button"
              className={`puja-list__chip${!category ? ' puja-list__chip--active' : ''}`}
              onClick={() => selectCategory('')}
              aria-pressed={!category}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`puja-list__chip${c.key === category ? ' puja-list__chip--active' : ''}`}
                onClick={() => selectCategory(c.key)}
                aria-pressed={c.key === category}
              >
                {c.label || c.key}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="puja-list__grid">
            {Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
        ) : items.length === 0 ? (
          <PageEmpty
            title="No pujas found"
            text={category ? 'Try another category.' : 'Please check back soon.'}
            action={
              category ? (
                <button type="button" className="ui-state__btn" onClick={() => selectCategory('')}>
                  Show all pujas
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="puja-list__grid">
              {items.map((puja) => (
                <PujaCard key={puja.id || puja.slug} puja={puja} />
              ))}
            </div>
            {error && (
              <p className="puja-list__inline-error" role="alert">
                {error}
              </p>
            )}
            {hasMore && (
              <div className="puja-list__more">
                <button type="button" className="puja-list__more-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : `Load more (${total - items.length} left)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
