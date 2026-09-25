import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchReviews, fetchTestimonials, messageOf, shortDate } from '../../api/index.js'
import { initialOf, mediaUrl, useAsync } from '../Account/accountUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import starPillIcon from '../../assets/pages/reviews/star-pill-icon.svg'
import starLg from '../../assets/pages/reviews/star-lg.svg'
import starSm from '../../assets/pages/reviews/star-sm.svg'
import starSmEmpty from '../../assets/pages/reviews/star-sm-empty.svg'
import starMd from '../../assets/pages/reviews/star-md.svg'
import starMdEmpty from '../../assets/pages/reviews/star-md-empty.svg'
import playIcon from '../../assets/pages/reviews/play-icon.svg'
import eyeIcon from '../../assets/pages/reviews/eye-icon.svg'
import verifiedIcon from '../../assets/pages/reviews/verified-icon.svg'
import checkCircleIcon from '../../assets/pages/reviews/check-circle-icon.svg'
import './Reviews.css'

const PAGE_SIZE = 12

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: '5', label: '5★' },
  { key: '4', label: '4★+' },
]

const KINDS = [
  { key: 'all', label: 'All' },
  { key: 'consultation', label: 'Consultations' },
  { key: 'puja', label: 'Pujas' },
]

const CHANNEL_LABEL = { chat: 'Chat', call: 'Call', video: 'Video call' }
const CATEGORY_LABEL = { consultation: 'Consultations', puja: 'Pujas' }
const BAR_FILL = { 5: 'gradient', 4: 'amber' }

const STARS = [1, 2, 3, 4, 5]

/** `{ rating, min }` params for a filter chip. */
const ratingParams = (filter) => (filter === '5' ? { rating: 5 } : filter === '4' ? { min: 4 } : {})

const compactNumber = (n) => {
  const value = Number(n) || 0
  if (value >= 100000) return `${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(value)
}

const average = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value).toFixed(1) : '—')

function Stars({ rating, filled, empty, className }) {
  const value = Math.round(Number(rating) || 0)
  return (
    <div className={className} aria-label={`${value} out of 5 stars`}>
      {STARS.map((n) => (
        <img key={n} src={n <= value ? filled : empty} alt="" />
      ))}
    </div>
  )
}

function Chips({ options, value, onChange, size, label }) {
  return (
    <div className={`reviews-page__chips${size ? ` reviews-page__chips--${size}` : ''}`} role="group" aria-label={label}>
      {options.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`reviews-page__chip${value === f.key ? ' reviews-page__chip--active' : ''}`}
          aria-pressed={value === f.key}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function Face({ src, name, className }) {
  const url = mediaUrl(src)
  if (url) return <img src={url} alt={name || ''} className={className} />
  return (
    <span className={`${className} reviews-page__avatar--fallback`} aria-hidden="true">
      {initialOf(name)}
    </span>
  )
}

function CardSkeleton() {
  return (
    <article className="reviews-page__card" aria-hidden="true">
      <Bone style={{ width: 90, height: 14 }} />
      <Bone style={{ height: 12, marginTop: 16 }} />
      <Bone style={{ height: 12, marginTop: 8 }} />
      <Bone style={{ width: '70%', height: 12, marginTop: 8 }} />
      <Bone style={{ width: 110, height: 22, marginTop: 16, borderRadius: 999 }} />
      <div className="reviews-page__divider" />
      <div className="reviews-page__person">
        <Bone style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
        <div className="reviews-page__person-meta">
          <Bone style={{ width: '50%', height: 13 }} />
          <Bone style={{ width: '35%', height: 11, marginTop: 8 }} />
        </div>
      </div>
    </article>
  )
}

function reviewTag(r) {
  const who = r.kind === 'puja' ? r.puja?.name : r.astrologer?.name
  const channel = r.kind === 'puja' ? 'Puja' : CHANNEL_LABEL[r.channel] || 'Consultation'
  return who ? `${who} · ${channel}` : channel
}

export default function Reviews() {
  const [filter, setFilter] = useState('all')
  const [kind, setKind] = useState('all')
  const [page, setPage] = useState(1)
  const [tick, setTick] = useState(0)
  /** `key` names the request the rows belong to; a mismatch with the current key means a load is in flight. */
  const [list, setList] = useState({ key: null, rows: [], total: 0, summary: null, error: null })
  const listKey = `${filter}:${kind}:${page}:${tick}`

  const [video, setVideo] = useState(null)
  const videos = useAsync(() => fetchTestimonials({ kind: 'video' }))
  const stories = useAsync(() => fetchTestimonials({ kind: 'story' }))

  useEffect(() => {
    let cancelled = false
    fetchReviews({ ...ratingParams(filter), kind: kind === 'all' ? undefined : kind, page, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        const items = data?.items ?? []
        setList((prev) => ({
          key: listKey,
          rows: page === 1 ? items : [...prev.rows, ...items],
          total: data?.total ?? items.length,
          summary: data?.summary ?? prev.summary,
          error: null,
        }))
      })
      .catch((err) => {
        if (!cancelled) setList((prev) => ({ ...prev, key: listKey, error: messageOf(err) }))
      })
    return () => {
      cancelled = true
    }
  }, [filter, kind, page, tick, listKey])

  const rows = list.rows
  const listLoading = list.key !== listKey
  const listError = listLoading ? null : list.error
  const summary = list.summary
  const summaryBusy = !summary && listLoading
  const count = Number(summary?.count) || 0
  const hasMore = rows.length < list.total

  const change = (setter) => (value) => {
    setter(value)
    setPage(1)
    setList((l) => ({ ...l, rows: [], total: 0, error: null }))
  }
  const retry = () => {
    setPage(1)
    setList((l) => ({ ...l, rows: [], total: 0, error: null }))
    setTick((t) => t + 1)
  }

  useEffect(() => {
    if (!video) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setVideo(null)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [video])

  const videoItems = videos.data?.items ?? []
  const storyItems = stories.data?.items ?? []
  const categories = Object.entries(summary?.categories ?? {}).filter(([, v]) => Number(v) > 0)

  return (
    <div className="reviews-page">
      <section className="reviews-page__hero">
        <div className="reviews-page__inner">
          <span className="reviews-page__pill">
            <img src={starPillIcon} alt="" className="reviews-page__pill-icon" />
            Real Experiences
          </span>
          <h1 className="reviews-page__title">
            What Our Users <span className="reviews-page__title-accent">Say</span>
          </h1>
          <p className="reviews-page__subtitle">
            {count > 0
              ? `${count.toLocaleString('en-IN')} verified reviews from consultations and pujas across India.`
              : 'Verified reviews from consultations and pujas across India.'}
          </p>
        </div>
      </section>

      <div className="reviews-page__inner reviews-page__body">
        <section className="reviews-page__summary">
          <div className="reviews-page__score-card">
            {summaryBusy ? (
              <Bone style={{ width: 90, height: 56, margin: '0 auto' }} />
            ) : (
              <p className="reviews-page__score">{average(summary?.average)}</p>
            )}
            <Stars rating={summary?.average ?? 5} filled={starLg} empty={starLg} className="reviews-page__score-stars" />
            <p className="reviews-page__score-note">
              {summaryBusy ? 'Loading reviews…' : count > 0 ? `Based on ${count.toLocaleString('en-IN')} reviews` : 'No reviews yet'}
            </p>
            <Chips options={FILTERS} value={filter} onChange={change(setFilter)} size="lg" label="Filter by rating" />
          </div>

          <div className="reviews-page__breakdown-card">
            <h3 className="reviews-page__breakdown-title">Rating Breakdown</h3>
            <ul className="reviews-page__bars">
              {[5, 4, 3, 2, 1].map((stars) => {
                const n = Number(summary?.breakdown?.[stars]) || 0
                const pct = count > 0 ? Math.round((n / count) * 100) : 0
                return (
                  <li key={stars} className="reviews-page__bar-row">
                    <Stars rating={stars} filled={starSm} empty={starSmEmpty} className="reviews-page__bar-stars" />
                    <div className="reviews-page__bar-track">
                      <div
                        className={`reviews-page__bar-fill reviews-page__bar-fill--${BAR_FILL[stars] || 'grey'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="reviews-page__bar-pct">{pct}%</span>
                    <span className="reviews-page__bar-count">{n.toLocaleString('en-IN')}</span>
                  </li>
                )
              })}
            </ul>
            {categories.length > 0 && (
              <div className="reviews-page__categories">
                {categories.map(([key, value]) => (
                  <div key={key} className="reviews-page__category">
                    <p className="reviews-page__category-value">{average(value)}</p>
                    <p className="reviews-page__category-label">{CATEGORY_LABEL[key] || key}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {(videos.loading || videoItems.length > 0) && (
          <section className="reviews-page__section">
            <div className="reviews-page__section-head">
              <h2 className="reviews-page__heading">Video Testimonials</h2>
              {videoItems.length > 0 && <span className="reviews-page__count">{videoItems.length} stories</span>}
            </div>
            <div className="reviews-page__videos">
              {videos.loading && videoItems.length === 0
                ? [0, 1, 2, 3].map((i) => (
                    <article key={i} className="reviews-page__video" aria-hidden="true">
                      <Bone style={{ aspectRatio: '16 / 10', height: 'auto', borderRadius: 0 }} />
                      <div className="reviews-page__video-body">
                        <Bone style={{ width: '80%', height: 14 }} />
                        <Bone style={{ width: '50%', height: 11, marginTop: 8 }} />
                      </div>
                    </article>
                  ))
                : videoItems.map((v) => (
                    <article key={v.id} className="reviews-page__video">
                      <button
                        type="button"
                        className="reviews-page__video-thumb"
                        onClick={() => setVideo(v)}
                        aria-label={`Play video: ${v.title}`}
                      >
                        {v.thumbnailUrl && <img src={mediaUrl(v.thumbnailUrl)} alt="" className="reviews-page__video-img" />}
                        <span className="reviews-page__play">
                          <img src={playIcon} alt="" />
                        </span>
                        {v.duration && <span className="reviews-page__duration">{v.duration}</span>}
                        {Number(v.views) > 0 && (
                          <span className="reviews-page__views">
                            <img src={eyeIcon} alt="" />
                            {compactNumber(v.views)}
                          </span>
                        )}
                      </button>
                      <div className="reviews-page__video-body">
                        <h3 className="reviews-page__video-title">{v.title}</h3>
                        <p className="reviews-page__video-meta">
                          <span className="reviews-page__video-name">{v.name}</span>
                          {v.city && (
                            <>
                              <span className="reviews-page__dot" />
                              <span className="reviews-page__video-city">{v.city}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </article>
                  ))}
            </div>
          </section>
        )}

        <section className="reviews-page__section">
          <div className="reviews-page__section-head">
            <h2 className="reviews-page__heading">Verified Reviews</h2>
            <div className="reviews-page__controls">
              <div className="reviews-page__filter">
                <span className="reviews-page__control-label">Show:</span>
                <Chips options={KINDS} value={kind} onChange={change(setKind)} label="Filter by type" />
              </div>
              <div className="reviews-page__filter">
                <span className="reviews-page__control-label">Rating:</span>
                <Chips options={FILTERS} value={filter} onChange={change(setFilter)} label="Filter by rating" />
              </div>
            </div>
          </div>

          {listLoading && rows.length === 0 ? (
            <div className="reviews-page__grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : listError && rows.length === 0 ? (
            <div style={{ paddingTop: 28 }}>
              <PageError message={listError} onRetry={retry} />
            </div>
          ) : rows.length === 0 ? (
            <p className="reviews-page__empty">No reviews match this filter yet.</p>
          ) : (
            <div className="reviews-page__grid">
              {rows.map((r) => (
                <article key={`${r.kind}-${r.id}`} className={`reviews-page__card${r.pinned ? ' reviews-page__card--pinned' : ''}`}>
                  <div className="reviews-page__card-top">
                    <Stars rating={r.rating} filled={starMd} empty={starMdEmpty} className="reviews-page__card-stars" />
                    {r.pinned && <span className="reviews-page__pinned">Featured</span>}
                  </div>
                  <blockquote className="reviews-page__quote">
                    {r.comment ? `“${r.comment}”` : 'Rated without a comment.'}
                  </blockquote>
                  <span className="reviews-page__tag">{reviewTag(r)}</span>
                  {r.reply && (
                    <div className="reviews-page__reply">
                      <p className="reviews-page__reply-label">
                        Reply from {r.astrologer?.name || 'Shree Astro'}
                      </p>
                      <p className="reviews-page__reply-text">{r.reply}</p>
                    </div>
                  )}
                  <div className="reviews-page__divider" />
                  <div className="reviews-page__person">
                    <Face src={r.reviewer?.avatarUrl} name={r.reviewer?.name} className="reviews-page__avatar" />
                    <div className="reviews-page__person-meta">
                      <p className="reviews-page__name">
                        {r.reviewer?.name || 'Shree Astro user'}
                        <img src={verifiedIcon} alt="Verified" className="reviews-page__verified" />
                      </p>
                      <p className="reviews-page__place">{shortDate(r.createdAt)}</p>
                    </div>
                    <img src={checkCircleIcon} alt="" className="reviews-page__check" />
                  </div>
                  {(r.astrologer || r.puja) && (
                    <p className="reviews-page__consulted">
                      {r.kind === 'puja' ? 'Puja: ' : 'Consulted: '}
                      <strong>
                        {r.kind === 'puja' ? (
                          r.puja?.slug ? <Link to={`/puja/${r.puja.slug}`}>{r.puja.name}</Link> : r.puja?.name
                        ) : r.astrologer?.id ? (
                          <Link to={`/astrologers/${r.astrologer.id}`}>{r.astrologer.name}</Link>
                        ) : (
                          r.astrologer?.name
                        )}
                      </strong>
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          {listError && rows.length > 0 && (
            <div style={{ paddingTop: 20 }}>
              <PageError compact message={listError} onRetry={() => setTick((t) => t + 1)} />
            </div>
          )}
          {rows.length > 0 && (hasMore || listLoading) && (
            <div className="reviews-page__more-row">
              <button
                type="button"
                className="reviews-page__more"
                onClick={() => setPage((p) => p + 1)}
                disabled={listLoading}
              >
                {listLoading ? 'Loading…' : `Load more (${list.total - rows.length} more)`}
              </button>
            </div>
          )}
        </section>

        {(stories.loading || storyItems.length > 0) && (
          <section className="reviews-page__section">
            <h2 className="reviews-page__heading">Success Stories</h2>
            <div className="reviews-page__stories">
              {stories.loading && storyItems.length === 0
                ? [0, 1, 2].map((i) => (
                    <article key={i} className="reviews-page__story" aria-hidden="true">
                      <div className="reviews-page__story-head">
                        <Bone style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
                        <div className="reviews-page__story-intro">
                          <Bone style={{ width: '70%', height: 16 }} />
                          <Bone style={{ width: '50%', height: 12, marginTop: 8 }} />
                        </div>
                      </div>
                      <div className="reviews-page__story-body">
                        <Bone style={{ height: 12 }} />
                        <Bone style={{ height: 12, marginTop: 8 }} />
                      </div>
                    </article>
                  ))
                : storyItems.map((s) => (
                    <article key={s.id} className="reviews-page__story">
                      <div className="reviews-page__story-head">
                        <Face src={s.avatarUrl} name={s.name} className="reviews-page__story-avatar" />
                        <div className="reviews-page__story-intro">
                          <h3 className="reviews-page__story-title">{s.title}</h3>
                          {(s.outcome || s.tag) && <span className="reviews-page__story-tag">{s.outcome || s.tag}</span>}
                        </div>
                      </div>
                      <div className="reviews-page__story-body">
                        <p className="reviews-page__story-text">{s.quote}</p>
                        <div className="reviews-page__story-foot">
                          <div>
                            <p className="reviews-page__name">{s.name}</p>
                            {s.city && <p className="reviews-page__place">{s.city}</p>}
                          </div>
                          {s.duration && <span className="reviews-page__story-pill">{s.duration}</span>}
                        </div>
                      </div>
                    </article>
                  ))}
            </div>
          </section>
        )}

        {!videos.loading && !stories.loading && videoItems.length === 0 && storyItems.length === 0 && (videos.error || stories.error) && (
          <section className="reviews-page__section">
            <PageEmpty
              compact
              title="Testimonials are unavailable right now"
              action={
                <button
                  type="button"
                  className="ui-state__btn"
                  onClick={() => {
                    videos.reload()
                    stories.reload()
                  }}
                >
                  Try again
                </button>
              }
            />
          </section>
        )}

        <section className="reviews-page__cta">
          <span className="reviews-page__cta-glow" aria-hidden="true" />
          <div className="reviews-page__cta-text">
            <h3 className="reviews-page__cta-title">Start Your Cosmic Journey Today</h3>
            <p className="reviews-page__cta-sub">Join the users who found clarity through Shree Astro.</p>
          </div>
          <Link to="/astrologers" className="reviews-page__cta-btn">
            Talk to an Astrologer
          </Link>
        </section>
      </div>

      {video && (
        <div
          className="reviews-page__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
          onClick={() => setVideo(null)}
        >
          <div className="reviews-page__lightbox-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="reviews-page__lightbox-close"
              onClick={() => setVideo(null)}
              aria-label="Close video"
            >
              ×
            </button>
            <div className="reviews-page__lightbox-media">
              {video.videoUrl ? (
                <video
                  className="reviews-page__lightbox-video"
                  controls
                  autoPlay
                  playsInline
                  poster={mediaUrl(video.thumbnailUrl) || undefined}
                  src={mediaUrl(video.videoUrl)}
                >
                  Your browser cannot play this video.
                </video>
              ) : (
                <>
                  {video.thumbnailUrl && <img src={mediaUrl(video.thumbnailUrl)} alt="" className="reviews-page__lightbox-img" />}
                  <span className="reviews-page__play reviews-page__play--lg">
                    <img src={playIcon} alt="" />
                  </span>
                </>
              )}
            </div>
            <p className="reviews-page__lightbox-title">{video.title}</p>
            <p className="reviews-page__lightbox-meta">
              {[video.name, video.city, video.duration].filter(Boolean).join(' · ')}
            </p>
            {video.quote && <p className="reviews-page__lightbox-quote">{video.quote}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
