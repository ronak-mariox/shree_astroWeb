import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchConsultations, getChatState, minutesOf, rupees, shortDate, titleCase } from '../../api/index.js'
import arrowLeftIcon from '../../assets/account/appointments/arrow-left.svg'
import phoneWhiteIcon from '../../assets/account/appointments/phone-white-lg.svg'
import chatOrangeIcon from '../../assets/account/appointments/chat-orange-lg.svg'
import checkIcon from '../../assets/account/appointments/check.svg'
import chevronRightIcon from '../../assets/account/appointments/chevron-right.svg'
import { Avatar, ErrorState, RatingForm, Skeleton, Stars } from './accountUi.jsx'
import { STATUS_LABEL, channelLabel, groupOfStatus, shortId, timeOnly, useAsync } from './accountUtils.js'
import './AppointmentDetail.css'

/**
 * `GET /chats/:id` gives the live state but not who it was with, so the
 * history row is looked up alongside it. The list is small, and the state
 * still renders if the row is missing.
 */
async function loadDetail(id) {
  const [state, list] = await Promise.all([
    getChatState(id),
    fetchConsultations({ limit: 100 }).catch(() => null),
  ])
  const row = (list?.items ?? []).find((r) => r.id === id) ?? null
  return { state, row }
}

const END_REASON = {
  user_ended: 'Ended by you',
  astrologer_ended: 'Ended by astrologer',
  balance_exhausted: 'Wallet balance ran out',
  package_ended: 'Package time finished',
  admin_ended: 'Ended by support',
}

function DetailSkeleton() {
  return (
    <div className="appointment-detail__grid">
      <section className="appointment-detail__card">
        <div className="appointment-detail__hero">
          <Skeleton style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0 }} />
          <div className="appointment-detail__who">
            <Skeleton style={{ width: '45%', height: 20 }} />
            <Skeleton style={{ width: '30%', height: 12, marginTop: 10 }} />
          </div>
        </div>
        <dl className="appointment-detail__facts">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="appointment-detail__fact">
              <Skeleton style={{ width: '40%', height: 10 }} />
              <Skeleton style={{ width: '60%', height: 14, marginTop: 8 }} />
            </div>
          ))}
        </dl>
      </section>
      <aside className="appointment-detail__side">
        <section className="appointment-detail__panel">
          <Skeleton style={{ width: '50%', height: 12 }} />
          <Skeleton style={{ height: 44, marginTop: 12, borderRadius: 11 }} />
        </section>
      </aside>
    </div>
  )
}

export default function AppointmentDetail() {
  const { id } = useParams()
  const { data, loading, error, reload, setData } = useAsync(() => loadDetail(id), [id])
  const [rating, setRating] = useState(false)

  const state = data?.state
  const row = data?.row
  const status = state?.status || row?.status
  const group = status ? groupOfStatus(status) : 'completed'
  const channel = state?.channel || row?.channel || 'chat'
  const isCall = channel === 'call' || channel === 'video'
  const name = row?.with?.name || 'Astrologer'
  const when = state?.startedAt || row?.startedAt || row?.createdAt
  const amount = state?.amountCharged ?? row?.amountCharged
  const duration = row?.durationSeconds
    ? minutesOf(row.durationSeconds)
    : state?.minutesBilled
      ? `${state.minutesBilled} min`
      : '—'
  const canRate = status === 'ended' && row && row.rating == null
  const backTo = group === 'upcoming' ? '/account/appointments' : `/account/appointments?tab=${group}`

  const facts = state
    ? [
        { label: 'Date', value: shortDate(when) },
        { label: 'Time', value: timeOnly(when) },
        { label: 'Duration', value: duration },
        { label: 'Consultation Type', value: channelLabel(channel) },
        { label: 'Amount Paid', value: rupees(amount) },
        {
          label: 'Rate',
          value: state.ratePerMinute != null ? `${rupees(state.ratePerMinute)}/min` : '—',
        },
        { label: 'Topic', value: row?.topic ? titleCase(row.topic) : '—' },
        {
          label: status === 'ended' ? 'Ended' : 'Status',
          value:
            status === 'ended'
              ? END_REASON[state.endReason] || (state.endReason ? titleCase(state.endReason) : 'Completed')
              : STATUS_LABEL[status] || titleCase(status),
        },
        { label: 'Booking ID', value: shortId(id), accent: true },
      ]
    : []

  return (
    <div className="appointment-detail">
      <header className="appointment-detail__header">
        <h1 className="appointment-detail__title">Appointment Details</h1>
        <p className="appointment-detail__subtitle">{loading && !data ? 'Loading…' : name}</p>
      </header>

      <Link to={backTo} className="appointment-detail__back">
        <span className="appointment-detail__back-icon">
          <img className="icon-ink" src={arrowLeftIcon} alt="" />
        </span>
        Back to Appointments
      </Link>

      {loading && !data ? (
        <div style={{ paddingTop: 24 }}>
          <DetailSkeleton />
        </div>
      ) : error && !data ? (
        <div style={{ paddingTop: 24 }}>
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <div className="appointment-detail__grid">
          <section className="appointment-detail__card">
            <div className="appointment-detail__hero">
              <div className="appointment-detail__avatar">
                <Avatar src={row?.with?.photo} name={name} />
              </div>
              <div className="appointment-detail__who">
                <h2 className="appointment-detail__name">{name}</h2>
                <p className="appointment-detail__specialty">
                  {row?.topic ? titleCase(row.topic) : channelLabel(channel)}
                </p>
              </div>
              <span className={`appointment-detail__pill appointment-detail__pill--${group}`}>
                {STATUS_LABEL[status] || titleCase(status)}
              </span>
            </div>

            <dl className="appointment-detail__facts">
              {facts.map((fact) => (
                <div key={fact.label} className="appointment-detail__fact">
                  <dt className="appointment-detail__fact-label">{fact.label}</dt>
                  <dd
                    className={`appointment-detail__fact-value${fact.accent ? ' appointment-detail__fact-value--accent' : ''}`}
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <aside className="appointment-detail__side">
            {group === 'upcoming' && (
              <section className="appointment-detail__panel appointment-detail__panel--start">
                <h3 className="appointment-detail__panel-title appointment-detail__panel-title--accent">
                  {status === 'requested' ? 'Waiting for astrologer' : 'Consultation in progress'}
                </h3>
                <Link
                  to={`/${isCall ? 'call' : 'chat'}/${id}`}
                  className={`appointment-detail__cta ${isCall ? 'appointment-detail__cta--call' : 'appointment-detail__cta--chat'}`}
                >
                  <span className="appointment-detail__cta-icon">
                    <img src={isCall ? phoneWhiteIcon : chatOrangeIcon} alt="" />
                  </span>
                  Open {channelLabel(channel)}
                </Link>
                {state?.paused && (
                  <p className="appointment-detail__note">
                    Paused for low balance —{' '}
                    <Link to="/account/wallet" className="appointment-detail__note-link">
                      add money
                    </Link>{' '}
                    to continue.
                  </p>
                )}
              </section>
            )}

            {status === 'ended' && (
              <section className="appointment-detail__panel appointment-detail__panel--done">
                <div className="appointment-detail__done">
                  <span className="appointment-detail__done-icon">
                    <img src={checkIcon} alt="" />
                  </span>
                  <p className="appointment-detail__done-text">Consultation Completed</p>
                </div>
                {row?.rating != null && (
                  <Stars value={row.rating} size={20} className="appointment-detail__stars" />
                )}
                {canRate && !rating && (
                  <button
                    type="button"
                    className="appointment-detail__cta appointment-detail__cta--chat"
                    onClick={() => setRating(true)}
                  >
                    Rate this consultation
                  </button>
                )}
                {canRate && rating && (
                  <RatingForm
                    chatId={id}
                    onCancel={() => setRating(false)}
                    onRated={(value) => {
                      setRating(false)
                      setData((d) => (d ? { ...d, row: { ...d.row, rating: value } } : d))
                    }}
                  />
                )}
              </section>
            )}

            {group === 'cancelled' && (
              <section className="appointment-detail__panel">
                <h3 className="appointment-detail__panel-title">This consultation did not take place</h3>
                <p className="appointment-detail__note">
                  {STATUS_LABEL[status] || titleCase(status)} — nothing was charged for it.
                </p>
              </section>
            )}

            <section className="appointment-detail__panel appointment-detail__panel--quick">
              <h3 className="appointment-detail__panel-title">Quick Actions</h3>
              <ul className="appointment-detail__quick">
                {row?.with?.id && (
                  <>
                    <li>
                      <Link
                        to={`/intake/${row.with.id}?mode=${isCall ? 'call' : 'chat'}`}
                        className="appointment-detail__quick-item"
                      >
                        Book Again
                        <span className="appointment-detail__quick-icon">
                          <img className="icon-ink" src={chevronRightIcon} alt="" />
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link to={`/astrologers/${row.with.id}`} className="appointment-detail__quick-item">
                        View Astrologer Profile
                        <span className="appointment-detail__quick-icon">
                          <img className="icon-ink" src={chevronRightIcon} alt="" />
                        </span>
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link to="/account/wallet" className="appointment-detail__quick-item">
                    View Wallet Transactions
                    <span className="appointment-detail__quick-icon">
                      <img className="icon-ink" src={chevronRightIcon} alt="" />
                    </span>
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="appointment-detail__quick-item">
                    Need help with this session?
                    <span className="appointment-detail__quick-icon">
                      <img className="icon-ink" src={chevronRightIcon} alt="" />
                    </span>
                  </Link>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
