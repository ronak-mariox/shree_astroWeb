import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  dateTime,
  fetchLoyalty,
  fetchLoyaltyHistory,
  fetchReferral,
  messageOf,
  rupees,
  shortDate,
  titleCase,
} from '../../api/index.js'
import statPoints from '../../assets/account/stat-points.svg'
import { EmptyState, ErrorState, Skeleton, Spinner } from './accountUi.jsx'
import { idOf, useAsync } from './accountUtils.js'
import './Rewards.css'


/** The invite link on this very site — whatever host it is running on — so it always opens here. */
const shareLinkFor = (code, fallback) =>
  code && typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${encodeURIComponent(code)}` : fallback || ''

const HISTORY_PAGE = 20

const REFERRAL_STATUS = { signed_up: 'Signed up', rewarded: 'Rewarded', void: 'Expired' }

const points = (n) => Number(n || 0).toLocaleString('en-IN')
const tierName = (tier) => (tier ? titleCase(tier.name || tier.key || tier) : '')

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  } catch {
    return false
  }
}

function RowSkeleton() {
  return (
    <li className="account-rewards__row">
      <Skeleton style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div className="account-rewards__row-text">
        <Skeleton style={{ width: '55%', height: 14 }} />
        <Skeleton style={{ width: '30%', height: 11, marginTop: 8 }} />
      </div>
      <Skeleton style={{ width: 60, height: 18 }} />
    </li>
  )
}

export default function Rewards() {
  const loyalty = useAsync(fetchLoyalty)
  const referral = useAsync(fetchReferral)

  /* History beyond the first 20 rows that `GET /loyalty` already returns. */
  const [extra, setExtra] = useState({ rows: [], page: 1, loading: false, error: null, done: false })
  const [copied, setCopied] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = async (key, text) => {
    await copyText(text)
    setCopied(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1800)
  }

  const data = loyalty.data
  const busy = loyalty.loading && !data
  const currentPoints = Number(data?.points) || 0
  const nextTier = data?.nextTier || null
  const target = Number(nextTier?.minPoints) || 0
  const toNext = Number(data?.pointsToNext) || 0
  const progress = target > 0 ? Math.max(0, Math.min(100, Math.round(((target - toNext) / target) * 100))) : 100
  const cashback = Number(data?.cashbackPercent) || 0

  const firstPage = data?.history ?? []
  const history = [...firstPage, ...extra.rows]
  const seen = new Set()
  const rows = history.filter((h) => {
    const id = idOf(h) || `${h.createdAt}-${h.points}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
  const canLoadMore = firstPage.length >= HISTORY_PAGE && !extra.done

  const loadMore = async () => {
    if (extra.loading) return
    const page = extra.page + 1
    setExtra((e) => ({ ...e, loading: true, error: null }))
    try {
      const result = await fetchLoyaltyHistory(page, HISTORY_PAGE)
      const items = result?.items ?? []
      setExtra((e) => ({
        rows: [...e.rows, ...items],
        page,
        loading: false,
        error: null,
        done: items.length < HISTORY_PAGE || (result?.total != null && firstPage.length + e.rows.length + items.length >= result.total),
      }))
    } catch (err) {
      setExtra((e) => ({ ...e, loading: false, error: messageOf(err) }))
    }
  }

  const ref = referral.data
  const refBusy = referral.loading && !ref
  const stats = ref?.stats ?? {}

  return (
    <div className="account-rewards">
      <div className="account-page__head">
        <div>
          <h1 className="account-page__title">Rewards</h1>
          <p className="account-page__subtitle">Loyalty points, tier benefits and your referral link</p>
        </div>
      </div>

      {loyalty.error && !data ? (
        <div style={{ paddingTop: 24 }}>
          <ErrorState message={loyalty.error} onRetry={loyalty.reload} />
        </div>
      ) : (
        <section className="account-rewards__hero">
          <span className="account-rewards__glow" aria-hidden="true" />
          <div className="account-rewards__hero-top">
            <div>
              <p className="account-rewards__eyebrow">
                <img src={statPoints} alt="" />
                Loyalty Points
              </p>
              {busy ? (
                <div className="account-rewards__points">
                  <Skeleton style={{ width: 140, height: 40 }} />
                </div>
              ) : (
                <p className="account-rewards__points">
                  {points(currentPoints)} <span>pts</span>
                </p>
              )}
              <p className="account-rewards__lifetime">
                {busy ? '' : `${points(data?.lifetimePoints)} earned lifetime`}
              </p>
            </div>
            {!busy && (
              <span className={`account-rewards__tier account-rewards__tier--${data?.tier || 'silver'}`}>
                {titleCase(data?.tier || 'silver')} member
              </span>
            )}
          </div>

          <div className="account-rewards__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={busy ? 0 : progress}>
            <span className="account-rewards__bar-fill" style={{ width: `${busy ? 0 : progress}%` }} />
          </div>
          <div className="account-rewards__bar-meta">
            {busy ? (
              <Skeleton style={{ width: '50%', height: 12 }} />
            ) : nextTier ? (
              <>
                <span>
                  {points(currentPoints)} / {points(target)} pts
                </span>
                <span>
                  <strong>{points(toNext)}</strong> more to {tierName(nextTier)}
                </span>
              </>
            ) : (
              <span>You are at the top tier — thank you for being with us.</span>
            )}
          </div>

          <div className="account-rewards__perks">
            <div className="account-rewards__perk">
              <strong>{busy ? '…' : cashback > 0 ? `${cashback}%` : '0%'}</strong>
              <span>Cashback on consultations</span>
            </div>
            <div className="account-rewards__perk">
              <strong>{busy ? '…' : nextTier ? tierName(nextTier) : 'Max'}</strong>
              <span>Next tier</span>
            </div>
            <Link to="/offers" className="account-rewards__perk account-rewards__perk--link">
              <strong>See tiers</strong>
              <span>Perks &amp; how to earn</span>
            </Link>
          </div>
        </section>
      )}

      <div className="account-rewards__grid">
        <section className="account-rewards__card">
          <div className="account-rewards__card-head">
            <h3 className="account-rewards__card-title">Points History</h3>
            {!busy && rows.length > 0 && <span className="account-rewards__count">{rows.length} shown</span>}
          </div>
          <ul className="account-rewards__list">
            {busy ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : loyalty.error ? null : rows.length === 0 ? (
              <EmptyState
                compact
                title="No points yet"
                text="Points land here after each consultation, delivered order or completed puja."
                action={
                  <Link to="/astrologers" className="account-state__btn">
                    Talk to an astrologer
                  </Link>
                }
              />
            ) : (
              rows.map((h) => {
                const delta = Number(h.points) || 0
                const credit = delta >= 0
                return (
                  <li key={idOf(h) || `${h.createdAt}-${delta}`} className="account-rewards__row">
                    <span className={`account-rewards__row-icon${credit ? '' : ' account-rewards__row-icon--debit'}`}>
                      {credit ? '+' : '−'}
                    </span>
                    <div className="account-rewards__row-text">
                      <p className="account-rewards__row-title">{h.reason || titleCase(h.type) || 'Points update'}</p>
                      <p className="account-rewards__row-date">
                        {dateTime(h.createdAt)}
                        {h.source?.kind ? ` · ${titleCase(h.source.kind)}` : ''}
                      </p>
                    </div>
                    <span className={`account-rewards__row-amount${credit ? '' : ' account-rewards__row-amount--debit'}`}>
                      {credit ? '+' : '−'}
                      {points(Math.abs(delta))}
                    </span>
                  </li>
                )
              })
            )}
          </ul>
          {extra.loading && <Spinner label="Loading more…" />}
          {extra.error && <ErrorState compact message={extra.error} onRetry={loadMore} />}
          {!busy && !extra.loading && !extra.error && canLoadMore && (
            <button type="button" className="account-rewards__more" onClick={loadMore}>
              Load more
            </button>
          )}
        </section>

        <section className="account-rewards__card account-rewards__referral">
          <div className="account-rewards__card-head">
            <h3 className="account-rewards__card-title">Refer &amp; Earn</h3>
          </div>
          {referral.error && !ref ? (
            <ErrorState compact message={referral.error} onRetry={referral.reload} />
          ) : refBusy ? (
            <>
              <Skeleton style={{ width: '90%', height: 12 }} />
              <Skeleton style={{ width: '70%', height: 12, marginTop: 8 }} />
              <Skeleton style={{ height: 44, marginTop: 18 }} />
              <Skeleton style={{ height: 44, marginTop: 10 }} />
            </>
          ) : !ref?.code ? (
            <EmptyState compact text="Referral rewards are paused right now." />
          ) : (
            <>
              <p className="account-rewards__referral-text">
                Share your link — when a friend signs up and completes their first consultation, you both get{' '}
                <strong>{rupees(ref.rewardAmount)}</strong> in your wallets.
              </p>
              <div className="account-rewards__code-row">
                <span className="account-rewards__code">{ref.code}</span>
                <button type="button" className="account-rewards__copy" onClick={() => handleCopy('code', ref.code)}>
                  {copied === 'code' ? 'Copied' : 'Copy code'}
                </button>
              </div>
              {shareLinkFor(ref.code, ref.link) && (
                <div className="account-rewards__code-row">
                  <span className="account-rewards__link" title={shareLinkFor(ref.code, ref.link)}>
                    {shareLinkFor(ref.code, ref.link).replace(/^https?:\/\//, '')}
                  </span>
                  <button
                    type="button"
                    className="account-rewards__copy account-rewards__copy--primary"
                    onClick={() => handleCopy('link', shareLinkFor(ref.code, ref.link))}
                  >
                    {copied === 'link' ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              )}
              <ul className="account-rewards__stats">
                <li>
                  <strong>{Number(stats.invited) || 0}</strong>
                  <span>Invited</span>
                </li>
                <li>
                  <strong>{Number(stats.completed) || 0}</strong>
                  <span>Completed</span>
                </li>
                <li>
                  <strong>{rupees(stats.earned)}</strong>
                  <span>Earned</span>
                </li>
              </ul>
              {Array.isArray(ref.recent) && ref.recent.length > 0 && (
                <ul className="account-rewards__recent">
                  {ref.recent.map((r, i) => (
                    <li key={`${r.name}-${r.at}-${i}`}>
                      <span className="account-rewards__recent-name">{r.name || 'A friend'}</span>
                      <span className={`account-rewards__recent-status account-rewards__recent-status--${r.status || 'signed_up'}`}>
                        {REFERRAL_STATUS[r.status] || titleCase(r.status)}
                      </span>
                      <span className="account-rewards__recent-date">{shortDate(r.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
