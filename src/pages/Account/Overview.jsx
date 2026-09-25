import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { fetchHome, fetchLoyalty, minutesOf, rupees, shortDate, titleCase } from '../../api/index.js'
import statWallet from '../../assets/account/stat-wallet.svg'
import statPoints from '../../assets/account/stat-points.svg'
import statConsultations from '../../assets/account/stat-consultations.svg'
import tipIcon from '../../assets/account/tip-icon.svg'
import { Avatar, EmptyState, ErrorState, Skeleton } from './accountUi.jsx'
import { channelLabel, useAsync } from './accountUtils.js'
import './Overview.css'

const FALLBACK_TIP =
  'Add your date, time and place of birth on your profile and we will cast your rashi — your personal daily reading appears here once it is ready.'

function greeting(date) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatLongDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatSkeleton() {
  return (
    <div className="account-overview__stat">
      <Skeleton style={{ width: 42, height: 42, borderRadius: 12 }} />
      <Skeleton style={{ width: '60%', height: 24, marginTop: 16 }} />
      <Skeleton style={{ width: '45%', height: 12, marginTop: 8 }} />
    </div>
  )
}

function RowSkeleton() {
  return (
    <li className="account-overview__row">
      <Skeleton style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
      <div className="account-overview__row-text">
        <Skeleton style={{ width: '45%', height: 14 }} />
        <Skeleton style={{ width: '30%', height: 11, marginTop: 8 }} />
      </div>
    </li>
  )
}

export default function Overview() {
  const { user, loadingUser, refreshUser } = useAuth()
  const { data: home, loading, error, reload } = useAsync(fetchHome)
  const loyalty = useAsync(fetchLoyalty)
  const now = new Date()

  const displayName = home?.profile?.name || user?.name
  const firstName = displayName ? displayName.split(' ')[0] : null
  const sign = home?.horoscope?.sign || home?.profile?.moonSign || user?.zodiac?.moonSign
  const balance = home?.wallet?.balance ?? user?.wallet?.balance ?? 0
  const stats = user?.stats
  const recent = home?.recentConsultations ?? []

  const busy = loading && !home
  const waitingUser = loadingUser && !user

  const cards = [
    {
      key: 'wallet',
      icon: statWallet,
      value: rupees(balance),
      label: 'Wallet Balance',
      sub: 'Auto-applied next session',
      tone: 'orange',
    },
    {
      key: 'consultations',
      icon: statConsultations,
      value: `${stats?.consultations ?? 0} total`,
      label: 'Consultations',
      sub: stats?.callMinutes ? `${stats.callMinutes} call min so far` : 'Chat & call sessions',
      tone: 'blue',
    },
    {
      key: 'minutes',
      icon: statConsultations,
      value: `${stats?.chatMinutes ?? 0} min`,
      label: 'Chat Minutes',
      sub: stats?.kundlis ? `${stats.kundlis} kundli${stats.kundlis === 1 ? '' : 's'} saved` : 'Across all chats',
      tone: 'amber',
    },
    {
      key: 'points',
      icon: statPoints,
      value: loyalty.data
        ? `${Number(loyalty.data.points || 0).toLocaleString('en-IN')} pts`
        : loyalty.loading
          ? '…'
          : '— pts',
      label: 'Loyalty Points',
      sub: loyalty.data
        ? `${titleCase(loyalty.data.tier)} tier${
            loyalty.data.nextTier && Number(loyalty.data.pointsToNext) > 0
              ? ` · ${Number(loyalty.data.pointsToNext).toLocaleString('en-IN')} to ${titleCase(
                  loyalty.data.nextTier.name || loyalty.data.nextTier.key || loyalty.data.nextTier,
                )}`
              : ' · Top tier'
          }`
        : loyalty.error
          ? 'Could not load points'
          : 'Earn on every consultation',
      tone: 'green',
      to: '/account/rewards',
    },
  ]

  return (
    <div className="account-overview">
      <div className="account-page__head">
        <div>
          <h1 className="account-page__title">
            {greeting(now)}
            {firstName ? `, ${firstName}` : busy || waitingUser ? '' : ', there'}
          </h1>
          <p className="account-page__subtitle">
            {formatLongDate(now)}
            {sign ? ` · Your rashi: ${sign}` : busy ? '' : ' · Rashi not set yet'}
          </p>
        </div>
      </div>

      {error && !home && (
        <div style={{ paddingTop: 24 }}>
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      <div className="account-overview__stats">
        {waitingUser && busy ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          cards.map((s) => {
            const Tag = s.to ? Link : 'div'
            return (
              <Tag
                key={s.key}
                to={s.to}
                className={`account-overview__stat account-overview__stat--${s.tone}${s.to ? ' account-overview__stat--link' : ''}`}
              >
                <div className="account-overview__stat-icon">
                  <img src={s.icon} alt="" />
                </div>
                <p className="account-overview__stat-value">{s.value}</p>
                <p className="account-overview__stat-label">{s.label}</p>
                <p className="account-overview__stat-sub">{s.sub}</p>
              </Tag>
            )
          })
        )}
      </div>

      {!user && !loadingUser && (
        <div style={{ paddingTop: 18 }}>
          <ErrorState compact message="We could not load your account details." onRetry={refreshUser} />
        </div>
      )}

      <section className="account-overview__recent">
        <div className="account-overview__recent-head">
          <h3 className="account-overview__recent-title">Recent Consultations</h3>
          <Link to="/astrologers" className="account-overview__book-again">
            Book Again →
          </Link>
        </div>

        {busy ? (
          <ul className="account-overview__list">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </ul>
        ) : error && !home ? null : recent.length === 0 ? (
          <div style={{ paddingTop: 22 }}>
            <EmptyState
              compact
              title="No consultations yet"
              text="Your completed chats and calls will show up here."
              action={
                <Link to="/astrologers" className="account-state__btn">
                  Find an astrologer
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="account-overview__list">
            {recent.map((c) => (
              <li key={c.id} className="account-overview__row">
                <Avatar className="account-overview__photo" src={c.photo} name={c.astrologer} />
                <div className="account-overview__row-text">
                  <p className="account-overview__row-name">{c.astrologer || 'Astrologer'}</p>
                  <p className="account-overview__row-meta">
                    {channelLabel(c.channel)} · {shortDate(c.endedAt)}
                  </p>
                </div>
                <div className="account-overview__row-right">
                  <span className="account-overview__price">{rupees(c.amount)}</span>
                  <span className="account-overview__duration">{minutesOf(c.durationSeconds)}</span>
                  <Link to={`/account/appointments/${c.id}`} className="account-overview__row-link">
                    Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="account-overview__tip">
        <div className="account-overview__tip-icon">
          <img src={tipIcon} alt="" />
        </div>
        <div className="account-overview__tip-text">
          <p className="account-overview__tip-title">
            Today&apos;s Cosmic Tip{sign ? ` · ${sign}` : ''}
          </p>
          {busy ? (
            <>
              <Skeleton style={{ width: '90%', height: 12, marginTop: 6 }} />
              <Skeleton style={{ width: '70%', height: 12, marginTop: 8 }} />
            </>
          ) : (
            <p className="account-overview__tip-body">{home?.horoscope?.reading || FALLBACK_TIP}</p>
          )}
        </div>
        <Link
          to={home?.horoscope ? '/horoscope' : '/account/profile'}
          className="account-overview__tip-btn"
        >
          {home?.horoscope ? 'Full Horoscope' : 'Complete Profile'}
        </Link>
      </section>
    </div>
  )
}
