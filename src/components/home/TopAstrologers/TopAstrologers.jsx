import { useEffect, useState } from 'react'
import AstrologerCard, { AstrologerCardSkeleton } from './AstrologerCard'
import { HOME_TOPIC_FILTERS } from '../../astrologers/astrologerView.js'
import { fetchAstrologers, messageOf } from '../../../api/index.js'
import './TopAstrologers.css'

const LIMIT = 8

export default function TopAstrologers() {
  const [activeFilter, setActiveFilter] = useState(HOME_TOPIC_FILTERS[0].label)
  const [reloadKey, setReloadKey] = useState(0)

  const topics = HOME_TOPIC_FILTERS.find((f) => f.label === activeFilter)?.topics ?? []
  const requestKey = `${topics.join(',')}|${reloadKey}`
  /** `loading` is "what is on screen was fetched for a different request". */
  const [result, setResult] = useState({ key: null, items: [], error: '' })
  const loading = result.key !== requestKey
  const { items, error } = result

  useEffect(() => {
    let cancelled = false
    const [topicsKey] = requestKey.split('|')
    fetchAstrologers({ sort: 'recommended', limit: LIMIT, topics: topicsKey || undefined })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, items: data.items ?? [], error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: requestKey, items: [], error: messageOf(err, 'Could not load astrologers.') })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey])

  return (
    <section className="top-astrologers">
      <div className="top-astrologers__header">
        <div className="top-astrologers__strip" />
        <div className="top-astrologers__tab" />
        <h2 className="top-astrologers__title">Our Top Astrologers</h2>
        <div className="top-astrologers__filters" aria-label="Filter astrologers">
          {HOME_TOPIC_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              aria-pressed={filter.label === activeFilter}
              className={
                'top-astrologers__filter' +
                (filter.label === activeFilter ? ' top-astrologers__filter--active' : '')
              }
              onClick={() => setActiveFilter(filter.label)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="top-astrologers__scroll">
        {loading ? (
          <div className="top-astrologers__grid" aria-busy="true">
            {Array.from({ length: LIMIT }, (_, i) => (
              <AstrologerCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="top-astrologers__notice" role="alert">
            <p className="top-astrologers__notice-text">{error}</p>
            <button type="button" className="top-astrologers__retry" onClick={() => setReloadKey((n) => n + 1)}>
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="top-astrologers__notice">
            <p className="top-astrologers__notice-text">
              {activeFilter === 'All' ? 'No astrologers are online yet. Please check back soon.' : `No astrologers for ${activeFilter} yet — try another category.`}
            </p>
          </div>
        ) : (
          <div className="top-astrologers__grid">
            {items.map((astrologer) => (
              <AstrologerCard key={astrologer.id} astrologer={astrologer} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
