import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import {
  fetchNotifications,
  markNotificationsRead,
  messageOf,
  subscribeToNotifications,
  timeAgo,
} from '../../api/index.js'
import notifKundli from '../../assets/account/notif-kundli.svg'
import notifConsultation from '../../assets/account/notif-consultation.svg'
import notifCashback from '../../assets/account/notif-cashback.svg'
import notifOffer from '../../assets/account/notif-offer.svg'
import notifPoints from '../../assets/account/notif-points.svg'
import notifReminder from '../../assets/account/notif-reminder.svg'
import { EmptyState, ErrorState, Skeleton } from './accountUi.jsx'
import { idOf, useAsync } from './accountUtils.js'
import './Notifications.css'

/** Backend `type` → icon + colour tone. */
const LOOK = {
  consultation_request: { icon: notifConsultation, tone: 'orange' },
  consultation_started: { icon: notifConsultation, tone: 'green' },
  consultation_ended: { icon: notifConsultation, tone: 'green' },
  consultation_missed: { icon: notifReminder, tone: 'orange' },
  message: { icon: notifReminder, tone: 'blue' },
  wallet_credit: { icon: notifCashback, tone: 'blue' },
  wallet_debit: { icon: notifCashback, tone: 'amber' },
  withdrawal: { icon: notifCashback, tone: 'blue' },
  review: { icon: notifPoints, tone: 'amber' },
  application: { icon: notifKundli, tone: 'orange' },
  promotion: { icon: notifOffer, tone: 'violet' },
  system: { icon: notifKundli, tone: 'orange' },
}
const DEFAULT_LOOK = { icon: notifReminder, tone: 'orange' }

/** Where a tap goes, by `action.screen`; anything unknown stays on the page. */
function routeFor(action) {
  if (!action?.screen) return null
  switch (action.screen) {
    case 'chat':
      return action.id ? `/chat/${action.id}` : '/account/appointments'
    case 'wallet':
      return '/account/wallet'
    case 'astrologer':
      return action.id ? `/astrologers/${action.id}` : '/astrologers'
    default:
      return null
  }
}

function SkeletonItem() {
  return (
    <li className="account-notifications__skeleton" aria-hidden="true">
      <Skeleton style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0 }} />
      <div className="account-notifications__skeleton-body">
        <Skeleton style={{ width: '40%', height: 14 }} />
        <Skeleton style={{ width: '85%', height: 12, marginTop: 8 }} />
        <Skeleton style={{ width: '20%', height: 10, marginTop: 10 }} />
      </div>
    </li>
  )
}

export default function Notifications() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { data, loading, error, reload, setData } = useAsync(() => fetchNotifications(1, 50))
  const [busyAll, setBusyAll] = useState(false)
  const [actionError, setActionError] = useState('')

  const items = data?.items ?? []
  const unread = items.filter((n) => !n.readAt).length

  /* New alerts arrive over the socket while the page is open. */
  useEffect(
    () =>
      subscribeToNotifications((incoming) => {
        if (!incoming) return
        const id = idOf(incoming)
        setData((current) => {
          const list = current?.items ?? []
          if (id && list.some((n) => idOf(n) === id)) return current
          return { ...(current ?? {}), items: [incoming, ...list] }
        })
      }),
    [setData],
  )

  const patchRead = (ids) => {
    const now = new Date().toISOString()
    setData((current) => ({
      ...(current ?? {}),
      items: (current?.items ?? []).map((n) =>
        !n.readAt && (ids === 'all' || ids.includes(idOf(n))) ? { ...n, readAt: now } : n,
      ),
    }))
  }

  const open = async (n) => {
    const id = idOf(n)
    const to = routeFor(n.action)
    if (!n.readAt) {
      patchRead([id])
      try {
        await markNotificationsRead(id)
        refreshUser().catch(() => {})
      } catch (err) {
        setActionError(messageOf(err))
      }
    }
    if (to) navigate(to)
  }

  const markAllRead = async () => {
    if (unread === 0 || busyAll) return
    setBusyAll(true)
    setActionError('')
    try {
      await markNotificationsRead()
      patchRead('all')
      refreshUser().catch(() => {})
    } catch (err) {
      setActionError(messageOf(err))
    } finally {
      setBusyAll(false)
    }
  }

  const busy = loading && !data

  return (
    <div className="account-notifications">
      <div className="account-page__head">
        <div>
          <h1 className="account-page__title">Notifications</h1>
          <p className="account-page__subtitle">
            {busy
              ? 'Loading your alerts…'
              : unread > 0
                ? `${unread} unread notification${unread === 1 ? '' : 's'}`
                : "You're all caught up"}
          </p>
        </div>
        <button
          type="button"
          className="account-notifications__mark-all"
          onClick={markAllRead}
          disabled={unread === 0 || busyAll || busy}
        >
          {busyAll ? 'Marking…' : 'Mark all as read'}
        </button>
      </div>

      {actionError && (
        <div className="account-notifications__error">
          <ErrorState compact message={actionError} onRetry={() => setActionError('')} />
        </div>
      )}

      <ul className="account-notifications__list">
        {busy ? (
          <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </>
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            text="Consultation updates, wallet activity and offers will land here."
          />
        ) : (
          items.map((n) => {
            const look = LOOK[n.type] || DEFAULT_LOOK
            const isUnread = !n.readAt
            const to = routeFor(n.action)
            const interactive = isUnread || Boolean(to)
            return (
              <li
                key={idOf(n)}
                className={`account-notifications__item account-notifications__item--${look.tone}${
                  isUnread ? ' account-notifications__item--unread' : ' account-notifications__item--read'
                }${interactive ? '' : ' account-notifications__item--static'}`}
                onClick={interactive ? () => open(n) : undefined}
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          open(n)
                        }
                      }
                    : undefined
                }
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
              >
                <div className="account-notifications__icon">
                  <img src={look.icon} alt="" />
                </div>
                <div className="account-notifications__body">
                  {n.title && <p className="account-notifications__title">{n.title}</p>}
                  {n.body && <p className="account-notifications__text">{n.body}</p>}
                  <p className="account-notifications__time">{timeAgo(n.createdAt)}</p>
                </div>
                {isUnread && <span className="account-notifications__dot" aria-label="Unread" />}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
