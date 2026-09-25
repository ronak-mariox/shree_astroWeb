import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts, messageOf } from '../../api/index.js'
import { useCart } from '../../context/useCart.js'
import ProductCard, { ProductCardSkeleton } from '../../components/store/ProductCard.jsx'
import { PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import sparkleIcon from '../../assets/pages/store/sparkle.svg'
import cartIcon from '../../assets/pages/store/cart.svg'
import searchIcon from '../../assets/pages/store/search.svg'
import chevronIcon from '../../assets/pages/store/chevron.svg'
import './Store.css'

const PAGE_SIZE = 20

/** Select value → API `sort`. */
const SORT_OPTIONS = [
  { value: 'featured', label: 'Best Sellers' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
]

const TRUST = [
  { icon: '🚚', title: 'Free Delivery', text: 'On orders above ₹999' },
  { icon: '✓', title: '100% Authentic', text: 'Certified & energized products' },
  { icon: '↩', title: 'Easy Returns', text: '7-day hassle-free returns' },
  { icon: '🔒', title: 'Secure Payments', text: '256-bit SSL encrypted' },
]

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function Store() {
  const { count, open } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [categories, setCategories] = useState([])
  const [result, setResult] = useState({ key: null, items: [], total: 0, page: 1, error: '' })
  const [loadingMore, setLoadingMore] = useState(false)
  const [tick, setTick] = useState(0)

  const category = searchParams.get('category') || ''
  const query = useDebounced(search.trim())
  const requestKey = `${category}|${query}|${sort}|${tick}`
  const loading = result.key !== requestKey

  useEffect(() => {
    let cancelled = false
    fetchProducts({ category: category || undefined, search: query || undefined, sort, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        const items = data?.items ?? []
        setResult({ key: requestKey, items, total: data?.total ?? items.length, page: 1, error: '' })
        // The unfiltered listing carries every category; a filtered one only its matches.
        if (Array.isArray(data?.categories)) {
          setCategories((prev) => (prev.length === 0 || (!category && !query) ? data.categories : prev))
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key: requestKey, items: [], total: 0, page: 1, error: messageOf(err, 'Could not load products.') })
        }
      })
    return () => {
      cancelled = true
    }
  }, [requestKey, category, query, sort])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await fetchProducts({
        category: category || undefined,
        search: query || undefined,
        sort,
        page: result.page + 1,
        limit: PAGE_SIZE,
      })
      setResult((prev) =>
        prev.key === requestKey
          ? { ...prev, items: [...prev.items, ...(data?.items ?? [])], page: prev.page + 1, error: '' }
          : prev,
      )
    } catch (err) {
      setResult((prev) =>
        prev.key === requestKey ? { ...prev, error: messageOf(err, 'Could not load more products.') } : prev,
      )
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

  const { items, total, error } = result
  const chips = [{ key: '', label: 'All' }, ...categories.map((c) => ({ key: c.key, label: c.label || c.key }))]
  const hasMore = items.length < total

  return (
    <div className="store-page">
      <section className="store-page__hero">
        <div className="store-page__inner store-page__hero-top">
          <div className="store-page__intro">
            <span className="store-page__pill">
              <img src={sparkleIcon} alt="" className="store-page__pill-icon" />
              Authentic Products
            </span>
            <h1 className="store-page__title">
              Shree Astro <span className="store-page__title-accent">Store</span>
            </h1>
            <p className="store-page__subtitle">
              Premium spiritual products — energized, certified, and delivered to your doorstep.
            </p>
          </div>

          <button type="button" className="store-page__cart" onClick={open} aria-label="Open cart">
            <img src={cartIcon} alt="" className="store-page__cart-icon icon-ink" />
            <span>Cart</span>
            {count > 0 && <span className="store-page__cart-count">{count}</span>}
          </button>
        </div>

        <div className="store-page__inner store-page__filters">
          <label className="store-page__search">
            <img src={searchIcon} alt="" className="store-page__search-icon" />
            <input
              type="search"
              className="store-page__search-input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </label>

          <div className="store-page__chips">
            {chips.map((c) => (
              <button
                key={c.key || 'all'}
                type="button"
                className={`store-page__chip${c.key === category ? ' store-page__chip--active' : ''}`}
                onClick={() => selectCategory(c.key)}
                aria-pressed={c.key === category}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="store-page__inner store-page__results">
        <div className="store-page__results-head">
          <p className="store-page__count">
            {loading ? (
              'Loading products…'
            ) : (
              <>
                Showing <strong>{total}</strong> {total === 1 ? 'product' : 'products'}
              </>
            )}
          </p>
          <div className="store-page__sort">
            <span className="store-page__sort-label">Sort:</span>
            <span className="store-page__select-wrap">
              <select
                className={`store-page__select${sort === 'featured' ? '' : ' store-page__select--wide'}`}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <img src={chevronIcon} alt="" className="store-page__select-icon icon-ink" />
            </span>
          </div>
        </div>

        {loading ? (
          <div className="store-page__grid">
            {Array.from({ length: 10 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
        ) : items.length > 0 ? (
          <>
            <div className="store-page__grid">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {error && (
              <p className="store-page__inline-error" role="alert">
                {error}
              </p>
            )}
            {hasMore && (
              <div className="store-page__more">
                <button type="button" className="store-page__more-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : `Load more (${total - items.length} left)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <PageEmpty
            title="No products found"
            text="Try a different search or category."
            action={
              <button
                type="button"
                className="ui-state__btn"
                onClick={() => {
                  setSearch('')
                  selectCategory('')
                }}
              >
                Clear filters
              </button>
            }
          />
        )}
      </section>

      <section className="store-page__inner store-page__trust">
        {TRUST.map((t) => (
          <div key={t.title} className="store-page__trust-tile">
            <span className="store-page__trust-icon" aria-hidden="true">
              {t.icon}
            </span>
            <div className="store-page__trust-text">
              <p className="store-page__trust-title">{t.title}</p>
              <p className="store-page__trust-sub">{t.text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
