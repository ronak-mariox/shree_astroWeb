import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchConsultations, minutesOf, rupees, shortDate, titleCase } from '../../api/index.js'
import calendarIcon from '../../assets/account/appointments/calendar.svg'
import clockIcon from '../../assets/account/appointments/clock.svg'
import phoneIcon from '../../assets/account/appointments/phone.svg'
import phoneWhiteIcon from '../../assets/account/appointments/phone-white.svg'
import chatOrangeIcon from '../../assets/account/appointments/chat-orange.svg'
import plusCircleIcon from '../../assets/account/appointments/plus-circle.svg'
import { Avatar, EmptyState, ErrorState, RatingForm, Skeleton, Stars } from './accountUi.jsx'
import {
  STATUS_LABEL,
  channelLabel,
  groupOfStatus,
  shortId,
  timeOnly,
  useAsync,
} from './accountUtils.js'
import './Appointments.css'

const TABS = [
  { key: 'upcoming', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const EMPTY_TEXT = {
  upcoming: 'No active consultations. Book one to get started.',
  completed: 'No completed consultations yet.',
  cancelled: 'No cancelled consultations.',
}

/** The history endpoint also lists the AI thread (no astrologer); this page is about people. */
const loadConsultations = async () => {
  const data = await fetchConsultations({ limit: 100 })
  return (data?.items ?? []).filter((row) => row.with)
}

function CardSkeleton() {
  return (
    <article className="account-appointments__card" aria-hidden="true">
      <Skeleton style={{ width: 68, height: 68, borderRadius: '50%', flexShrink: 0 }} />
      <div className="account-appointments__body">
        <Skeleton style={{ width: '35%', height: 16 }} />
        <Skeleton style={{ width: '25%', height: 12, marginTop: 8 }} />
        <Skeleton style={{ width: '70%', height: 12, marginTop: 12 }} />
        <Skeleton style={{ width: 120, height: 36, marginTop: 14, borderRadius: 9 }} />
      </div>
    </article>
  )
}

function AppointmentCard({ row, onRated }) {
  const [rating, setRating] = useState(false)
  const group = groupOfStatus(row.status)
  const when = row.startedAt || row.createdAt
  const isCall = row.channel === 'call' || row.channel === 'video'
  const openTo = `/${isCall ? 'call' : 'chat'}/${row.id}`
  const canRate = row.status === 'ended' && row.rating == null

  return (
    <article className={`account-appointments__card account-appointments__card--${group}`}>
      <div className="account-appointments__avatar">
        <Avatar src={row.with?.photo} name={row.with?.name} />
      </div>

      <div className="account-appointments__body">
        <div className="account-appointments__head">
          <div className="account-appointments__who">
            <h3 className="account-appointments__name">{row.with?.name || 'Astrologer'}</h3>
            <p className="account-appointments__specialty">{row.topic ? titleCase(row.topic) : 'Consultation'}</p>
          </div>
          <span className={`account-appointments__pill account-appointments__pill--${group}`}>
            {STATUS_LABEL[row.status] || titleCase(row.status)}
          </span>
        </div>

        <ul className="account-appointments__meta">
          <li className="account-appointments__meta-item">
            <span className="account-appointments__meta-icon">
              <img className="icon-ink" src={calendarIcon} alt="" />
            </span>
            {shortDate(when)}
          </li>
          <li className="account-appointments__meta-item">
            <span className="account-appointments__meta-icon">
              <img className="icon-ink" src={clockIcon} alt="" />
            </span>
            {timeOnly(when)}
          </li>
          <li className="account-appointments__meta-item">
            <span className="account-appointments__meta-icon">
              <img className="icon-ink" src={phoneIcon} alt="" />
            </span>
            {channelLabel(row.channel)}
            {row.durationSeconds ? ` · ${minutesOf(row.durationSeconds)}` : ''}
          </li>
          <li className="account-appointments__meta-item account-appointments__meta-item--price">
            {rupees(row.amountCharged)}
          </li>
          <li className="account-appointments__meta-item account-appointments__meta-item--id">
            ID: {shortId(row.id)}
          </li>
        </ul>

        <div className="account-appointments__actions">
          <Link to={`/account/appointments/${row.id}`} className="account-appointments__btn">
            View Details
          </Link>

          {group === 'upcoming' && (
            <Link
              to={openTo}
              className={`account-appointments__btn ${isCall ? 'account-appointments__btn--call' : 'account-appointments__btn--chat'}`}
            >
              <span className="account-appointments__btn-icon">
                <img src={isCall ? phoneWhiteIcon : chatOrangeIcon} alt="" />
              </span>
              {row.status === 'requested' ? 'Open request' : `Open ${channelLabel(row.channel)}`}
            </Link>
          )}

          {row.status === 'ended' && row.rating != null && (
            <div className="account-appointments__rated">
              <Stars value={row.rating} className="account-appointments__stars" />
              <span className="account-appointments__rated-text">Rated</span>
            </div>
          )}

          {canRate && !rating && (
            <button
              type="button"
              className="account-appointments__btn account-appointments__btn--chat"
              onClick={() => setRating(true)}
            >
              Rate
            </button>
          )}
        </div>

        {canRate && rating && (
          <RatingForm
            chatId={row.id}
            onCancel={() => setRating(false)}
            onRated={(value) => {
              setRating(false)
              onRated(row.id, value)
            }}
          />
        )}
      </div>
    </article>
  )
}

export default function Appointments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const activeTab = TABS.some((t) => t.key === requested) ? requested : 'upcoming'
  const { data, loading, error, reload, setData } = useAsync(loadConsultations)

  const rows = data ?? []
  const counts = rows.reduce(
    (acc, r) => {
      const g = groupOfStatus(r.status)
      acc[g] = (acc[g] || 0) + 1
      return acc
    },
    { upcoming: 0, completed: 0, cancelled: 0 },
  )
  const visible = rows.filter((r) => groupOfStatus(r.status) === activeTab)
  const busy = loading && !data

  const selectTab = (key) => {
    const next = new URLSearchParams(searchParams)
    if (key === 'upcoming') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next, { replace: true })
  }

  const onRated = (id, value) =>
    setData((list) => (list ?? []).map((r) => (r.id === id ? { ...r, rating: value } : r)))

  return (
    <div className="account-appointments">
      <header className="account-appointments__header">
        <h1 className="account-appointments__title">My Appointments</h1>
        <p className="account-appointments__subtitle">
          {busy ? 'Loading your consultations…' : `${counts.upcoming} active · ${counts.completed} completed`}
        </p>
      </header>

      <div className="account-appointments__tabs-wrap">
        <div className="account-appointments__tabs" role="tablist" aria-label="Consultation status">
          {TABS.map((tab) => {
            const active = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`account-appointments__tab${active ? ' account-appointments__tab--active' : ''}`}
                onClick={() => selectTab(tab.key)}
              >
                {tab.label}
                <span className="account-appointments__tab-count">{busy ? '·' : counts[tab.key]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="account-appointments__list">
        {busy ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : visible.length > 0 ? (
          visible.map((row) => <AppointmentCard key={row.id} row={row} onRated={onRated} />)
        ) : (
          <EmptyState text={EMPTY_TEXT[activeTab]} />
        )}
      </div>

      <div className="account-appointments__footer">
        <Link to="/astrologers" className="account-appointments__book">
          <span className="account-appointments__book-icon">
            <img src={plusCircleIcon} alt="" />
          </span>
          Book New Consultation
        </Link>
      </div>
    </div>
  )
}
