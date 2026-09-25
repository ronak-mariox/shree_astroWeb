import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchArticles, messageOf, shortDate } from '../../api/index.js'
import { initialOf, mediaUrl } from '../Account/accountUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import calendarIcon from '../../assets/pages/blog/calendar.svg'
import searchIcon from '../../assets/pages/blog/search.svg'
import arrowRightIcon from '../../assets/pages/blog/arrow-right.svg'
import './Blog.css'

const PAGE_SIZE = 12

const readTime = (minutes) => `${Math.max(1, Number(minutes) || 1)} min read`

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/** The API gives an author name only, so the avatar is their initial. */
function AuthorAvatar({ name, className }) {
  return (
    <span className={`${className} blog-page__avatar-fallback`} aria-hidden="true">
      {initialOf(name, 'S')}
    </span>
  )
}

function CardSkeleton() {
  return (
    <article className="blog-page__card" aria-hidden="true">
      <div className="blog-page__card-media">
        <Bone style={{ height: '100%', borderRadius: 0 }} />
      </div>
      <div className="blog-page__card-body">
        <Bone style={{ width: 80, height: 18, borderRadius: 999 }} />
        <Bone style={{ width: '90%', height: 18, marginTop: 14 }} />
        <Bone style={{ width: '70%', height: 18, marginTop: 8 }} />
        <Bone style={{ width: '100%', height: 12, marginTop: 14 }} />
        <Bone style={{ width: '85%', height: 12, marginTop: 8 }} />
      </div>
    </article>
  )
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [result, setResult] = useState({ key: null, items: [], total: 0, page: 1, error: '' })
  const [loadingMore, setLoadingMore] = useState(false)
  const [tick, setTick] = useState(0)

  const category = searchParams.get('category') || ''
  const search = useDebounced(query.trim())
  const requestKey = `${category}|${search}|${tick}`
  const loading = result.key !== requestKey

  useEffect(() => {
    let cancelled = false
    fetchArticles({ category: category || undefined, search: search || undefined, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        const items = data?.items ?? []
        setResult({ key: requestKey, items, total: data?.total ?? items.length, page: 1, error: '' })
        if (Array.isArray(data?.categories)) {
          setCategories((prev) => (prev.length === 0 || (!category && !search) ? data.categories : prev))
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key: requestKey, items: [], total: 0, page: 1, error: messageOf(err, 'Could not load articles.') })
        }
      })
    return () => {
      cancelled = true
    }
  }, [requestKey, category, search])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await fetchArticles({
        category: category || undefined,
        search: search || undefined,
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
        prev.key === requestKey ? { ...prev, error: messageOf(err, 'Could not load more articles.') } : prev,
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
  // The newest article leads the page; the rest fill the grid.
  const featured = items[0]
  const rest = items.slice(1)
  const hasMore = items.length < total

  return (
    <section className="blog-page">
      <div className="blog-page__hero">
        <div className="blog-page__inner">
          <span className="blog-page__pill">
            <img src={calendarIcon} alt="" className="blog-page__pill-icon" />
            Astrology Insights
          </span>

          <div className="blog-page__head">
            <div className="blog-page__head-text">
              <h1 className="blog-page__title">
                Shree Astro <span className="blog-page__title-accent">Blog</span>
              </h1>
              <p className="blog-page__subtitle">
                Wisdom, guidance, and cosmic insights from India's top astrologers
              </p>
            </div>

            <label className="blog-page__search">
              <img src={searchIcon} alt="" className="blog-page__search-icon" />
              <input
                type="search"
                className="blog-page__search-input"
                placeholder="Search articles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search articles"
              />
            </label>
          </div>

          <div className="blog-page__chips">
            {chips.map((c) => (
              <button
                key={c.key || 'all'}
                type="button"
                className={c.key === category ? 'blog-page__chip blog-page__chip--active' : 'blog-page__chip'}
                onClick={() => selectCategory(c.key)}
                aria-pressed={c.key === category}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="blog-page__inner blog-page__content">
        {loading ? (
          <div className="blog-page__grid">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
        ) : items.length === 0 ? (
          <PageEmpty
            title="No articles found"
            text="Try a different search or category."
            action={
              <button
                type="button"
                className="ui-state__btn"
                onClick={() => {
                  setQuery('')
                  selectCategory('')
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {featured && (
              <article className="blog-page__featured">
                <Link to={`/blog/${featured.slug}`} className="blog-page__featured-media">
                  {featured.coverImageUrl && (
                    <img src={mediaUrl(featured.coverImageUrl)} alt={featured.title} className="blog-page__featured-img" />
                  )}
                </Link>
                <div className="blog-page__featured-body">
                  <div className="blog-page__featured-tags">
                    <span className="blog-page__tag blog-page__tag--gradient">Featured</span>
                    {featured.category && <span className="blog-page__tag">{featured.category}</span>}
                  </div>
                  <h2 className="blog-page__featured-title">
                    <Link to={`/blog/${featured.slug}`}>{featured.title}</Link>
                  </h2>
                  {featured.excerpt && <p className="blog-page__featured-excerpt">{featured.excerpt}</p>}
                  <div className="blog-page__featured-author">
                    <AuthorAvatar name={featured.author} className="blog-page__featured-avatar" />
                    <div>
                      <p className="blog-page__featured-name">{featured.author || 'Shree Astro'}</p>
                      <p className="blog-page__featured-meta">
                        {shortDate(featured.publishedAt)} · {readTime(featured.readMinutes)}
                      </p>
                    </div>
                  </div>
                  <Link to={`/blog/${featured.slug}`} className="blog-page__read">
                    Read Article
                    <img src={arrowRightIcon} alt="" className="blog-page__read-icon" />
                  </Link>
                </div>
              </article>
            )}

            {rest.length > 0 && (
              <div className="blog-page__grid">
                {rest.map((post) => (
                  <article key={post.id || post.slug} className="blog-page__card">
                    <Link to={`/blog/${post.slug}`} className="blog-page__card-media">
                      {post.coverImageUrl && (
                        <img src={mediaUrl(post.coverImageUrl)} alt={post.title} className="blog-page__card-img" />
                      )}
                    </Link>
                    <div className="blog-page__card-body">
                      {post.category && (
                        <div className="blog-page__card-tag-row">
                          <span className="blog-page__card-tag">{post.category}</span>
                        </div>
                      )}
                      <h3 className="blog-page__card-title">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      {post.excerpt && <p className="blog-page__card-excerpt">{post.excerpt}</p>}
                      <div className="blog-page__card-foot">
                        <AuthorAvatar name={post.author} className="blog-page__card-avatar" />
                        <div className="blog-page__card-author">
                          <p className="blog-page__card-name">{post.author || 'Shree Astro'}</p>
                          <p className="blog-page__card-read">{readTime(post.readMinutes)}</p>
                        </div>
                        <span className="blog-page__card-date">{shortDate(post.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {error && (
              <p className="blog-page__inline-error" role="alert">
                {error}
              </p>
            )}
            {hasMore && (
              <div className="blog-page__more">
                <button type="button" className="blog-page__more-btn" onClick={loadMore} disabled={loadingMore}>
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
