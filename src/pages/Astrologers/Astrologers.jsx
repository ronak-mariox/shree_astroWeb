import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DirectoryCard, { DirectoryCardSkeleton } from '../../components/astrologers/DirectoryCard.jsx'
import { EXPERTISE_FILTERS, LANGUAGE_FILTERS } from '../../components/astrologers/astrologerView.js'
import { fetchAstrologers, messageOf } from '../../api/index.js'
import searchIcon from '../../assets/pages/astrologers/search-icon.svg'
import chevronDown from '../../assets/pages/astrologers/chevron-down.svg'
import './Astrologers.css'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

/**
 * "Available Today" is not something the backend knows (it only tracks live
 * presence), so the sheet offers Online Now / All.
 */
const AVAILABILITY = [
  { value: 'online', label: 'Online Now' },
  { value: 'all', label: 'All' },
]

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Reviewed' },
]

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/** The API params behind a request key, for page `pageNumber`. */
function filtersOf(requestKey, pageNumber) {
  const { reload: _reload, ...filters } = JSON.parse(requestKey)
  return { ...filters, page: pageNumber, limit: PAGE_SIZE }
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function Astrologers() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')

  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim(), SEARCH_DEBOUNCE_MS)
  const [availability, setAvailability] = useState(mode === 'call' || mode === 'chat' ? 'online' : 'all')
  const [expertise, setExpertise] = useState([])
  const [languages, setLanguages] = useState([])
  const [sort, setSort] = useState('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const activeFilters = expertise.length + languages.length + (availability !== 'all' ? 1 : 0)

  /**
   * The request the grid should be showing. `loading` is simply "the result
   * on screen was fetched for a different request", so a stale response can
   * never be mistaken for the current one.
   */
  const requestKey = JSON.stringify({
    search,
    online: availability === 'online' ? true : undefined,
    expertise,
    languages,
    sort,
    reload: reloadKey,
  })
  const [result, setResult] = useState({ key: null, items: [], total: null, page: 1, error: '' })
  const [loadingMore, setLoadingMore] = useState(false)
  const loading = result.key !== requestKey
  const { items, total, page, error } = result

  useEffect(() => {
    let cancelled = false
    fetchAstrologers(filtersOf(requestKey, 1))
      .then((data) => {
        if (cancelled) return
        const rows = data.items ?? []
        setResult({ key: requestKey, items: rows, total: data.total ?? rows.length, page: 1, error: '' })
      })
      .catch((err) => {
        if (cancelled) return
        setResult({
          key: requestKey,
          items: [],
          total: null,
          page: 1,
          error: messageOf(err, 'Could not load astrologers. Please try again.'),
        })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey])

  const loadMore = async () => {
    const key = requestKey
    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const data = await fetchAstrologers(filtersOf(key, nextPage))
      setResult((prev) => {
        if (prev.key !== key) return prev
        const seen = new Set(prev.items.map((item) => item.id))
        return {
          ...prev,
          items: [...prev.items, ...(data.items ?? []).filter((item) => !seen.has(item.id))],
          total: data.total ?? prev.total,
          page: nextPage,
          error: '',
        }
      })
    } catch (err) {
      setResult((prev) => (prev.key === key ? { ...prev, error: messageOf(err, 'Could not load more astrologers.') } : prev))
    } finally {
      setLoadingMore(false)
    }
  }

  const retry = () => setReloadKey((n) => n + 1)

  const clearAll = () => {
    setQuery('')
    setAvailability('all')
    setExpertise([])
    setLanguages([])
    setSort('recommended')
  }

  const hasMore = total !== null && items.length < total
  const showingCount = loading ? null : total ?? items.length

  return (
    <div className="astrologers-page">
      <section className="astrologers-page__hero">
        <div className="container">
          <div className="astrologers-page__inner">
            <nav className="astrologers-page__breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="astrologers-page__crumb">
                Home
              </Link>
              <span className="astrologers-page__crumb-sep" aria-hidden="true">
                ›
              </span>
              <span className="astrologers-page__crumb astrologers-page__crumb--current">Astrologers</span>
            </nav>
            <h1 className="astrologers-page__title">Find Your Astrologer</h1>
            <p className="astrologers-page__subtitle">
              {total > 0 && activeFilters === 0 && !search
                ? `${total}+ verified astrologers ready to guide you`
                : 'Verified astrologers ready to guide you'}
            </p>
            <label className="astrologers-page__search">
              <img src={searchIcon} alt="" className="astrologers-page__search-icon" />
              <input
                type="search"
                className="astrologers-page__search-input"
                placeholder="Search by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search astrologers by name"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="astrologers-page__content">
        <div className="container">
          <div className="astrologers-page__inner astrologers-page__layout">
            <aside className={'astrologers-page__filters' + (filtersOpen ? ' astrologers-page__filters--open' : '')}>
              <div className="astrologers-page__filters-head">
                <button
                  type="button"
                  className="astrologers-page__filters-toggle"
                  aria-expanded={filtersOpen}
                  aria-controls="astrologer-filters"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <h2 className="astrologers-page__filters-title">
                    Filters
                    {activeFilters > 0 && <span className="astrologers-page__filters-count">{activeFilters}</span>}
                  </h2>
                  <span className="astrologers-page__filters-chevron" aria-hidden="true" />
                </button>
                <button type="button" className="astrologers-page__clear" onClick={clearAll}>
                  Clear All
                </button>
              </div>
              <div id="astrologer-filters" className="astrologers-page__filters-body">

              <div className="astrologers-page__group">
                <p className="astrologers-page__group-label">Availability</p>
                <div className="astrologers-page__radios" role="radiogroup" aria-label="Availability">
                  {AVAILABILITY.map((option) => {
                    const active = availability === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={'astrologers-page__radio' + (active ? ' astrologers-page__radio--active' : '')}
                        onClick={() => setAvailability(option.value)}
                      >
                        <span className="astrologers-page__radio-mark" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="astrologers-page__divider" />

              <div className="astrologers-page__group">
                <p className="astrologers-page__group-label">Expertise</p>
                <div className="astrologers-page__checks">
                  {EXPERTISE_FILTERS.map((item) => {
                    const checked = expertise.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        className={'astrologers-page__check' + (checked ? ' astrologers-page__check--active' : '')}
                        onClick={() => setExpertise((prev) => toggle(prev, item.id))}
                      >
                        <span className="astrologers-page__check-mark" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="astrologers-page__divider" />

              <div className="astrologers-page__group">
                <p className="astrologers-page__group-label">Language</p>
                <div className="astrologers-page__chips">
                  {LANGUAGE_FILTERS.map((lang) => {
                    const active = languages.includes(lang.id)
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        aria-pressed={active}
                        className={'astrologers-page__chip' + (active ? ' astrologers-page__chip--active' : '')}
                        onClick={() => setLanguages((prev) => toggle(prev, lang.id))}
                      >
                        {lang.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              </div>
            </aside>

            <div className="astrologers-page__results">
              <div className="astrologers-page__results-head">
                <p className="astrologers-page__count" aria-live="polite">
                  {showingCount === null ? (
                    'Finding astrologers…'
                  ) : (
                    <>
                      Showing <strong>{showingCount}</strong> astrologer{showingCount === 1 ? '' : 's'}
                    </>
                  )}
                </p>
                <div className="astrologers-page__sort">
                  <span className="astrologers-page__sort-label">Sort by:</span>
                  <span className="astrologers-page__select-wrap">
                    <select
                      className="astrologers-page__select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      aria-label="Sort astrologers"
                    >
                      {SORTS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <img src={chevronDown} alt="" className="astrologers-page__select-icon icon-ink" />
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="astrologers-page__grid" aria-busy="true">
                  {Array.from({ length: 6 }, (_, i) => (
                    <DirectoryCardSkeleton key={i} />
                  ))}
                </div>
              ) : error && items.length === 0 ? (
                <div className="astrologers-page__empty" role="alert">
                  <p className="astrologers-page__empty-title">{error}</p>
                  <button type="button" className="astrologers-page__retry" onClick={retry}>
                    Try again
                  </button>
                </div>
              ) : items.length > 0 ? (
                <>
                  <div className="astrologers-page__grid">
                    {items.map((astrologer) => (
                      <DirectoryCard key={astrologer.id} astrologer={astrologer} />
                    ))}
                  </div>
                  {error && (
                    <p className="astrologers-page__inline-error" role="alert">
                      {error}
                    </p>
                  )}
                  {hasMore && (
                    <div className="astrologers-page__more">
                      <button
                        type="button"
                        className="astrologers-page__load-more"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Loading…' : `Load more (${total - items.length} left)`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="astrologers-page__empty">
                  <p className="astrologers-page__empty-title">
                    {activeFilters > 0 || search ? 'No astrologers match these filters' : 'No astrologers are listed yet'}
                  </p>
                  {(activeFilters > 0 || search) && (
                    <button type="button" className="astrologers-page__clear" onClick={clearAll}>
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
