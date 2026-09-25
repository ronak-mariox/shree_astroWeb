import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cancelOrder, fetchOrders, messageOf, rupees, shortDate } from '../../api/index.js'
import { EmptyState, ErrorState, Skeleton } from './accountUi.jsx'
import { mediaUrl, useAsync } from './accountUtils.js'
import { ORDER_STATUS_LABEL, canCancelOrder, groupOfOrder, itemCountOf, timelineOf } from './orderUtils.js'
import './Orders.css'

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const EMPTY_TEXT = {
  active: 'No active orders right now.',
  delivered: 'No delivered orders yet.',
  cancelled: 'No cancelled orders.',
}

export function Timeline({ order }) {
  const steps = timelineOf(order)
  return (
    <ol className="account-orders__timeline">
      {steps.map((step, i) => {
        const nextDone = steps[i + 1]?.done
        return (
          <li
            key={step.key}
            className={`account-orders__step${step.done ? ' account-orders__step--done' : ''}${nextDone ? ' account-orders__step--linked' : ''}`}
          >
            <span className="account-orders__dot" />
            <span className="account-orders__step-label">{step.label}</span>
            <span className="account-orders__step-date">{step.at ? shortDate(step.at) : step.done ? '' : 'Pending'}</span>
          </li>
        )
      })}
    </ol>
  )
}

function CardSkeleton() {
  return (
    <article className="account-orders__card" aria-hidden="true">
      <div className="account-orders__row">
        <Skeleton className="account-orders__img" style={{ borderRadius: 12 }} />
        <div className="account-orders__body">
          <Skeleton style={{ width: '45%', height: 18 }} />
          <Skeleton style={{ width: '30%', height: 12, marginTop: 8 }} />
          <Skeleton style={{ width: '65%', height: 12, marginTop: 14 }} />
        </div>
        <div className="account-orders__actions">
          <Skeleton style={{ width: 80, height: 36, borderRadius: 10 }} />
        </div>
      </div>
    </article>
  )
}

function OrderCard({ order, tracking, onToggleTracking, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const group = groupOfOrder(order.status)
  const first = order.items?.[0]
  const more = (order.items?.length || 0) - 1
  const image = mediaUrl(first?.imageUrl || first?.product?.imageUrl)

  const cancel = async () => {
    if (!window.confirm(`Cancel order ${order.reference}? The amount will be refunded to your wallet.`)) return
    setBusy(true)
    setError('')
    try {
      onChange(await cancelOrder(order.id))
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="account-orders__card">
      <div className="account-orders__row">
        {image ? (
          <img className="account-orders__img" src={image} alt={first?.name || ''} />
        ) : (
          <span className="account-orders__img account-orders__img--empty" aria-hidden="true" />
        )}
        <div className="account-orders__body">
          <div className="account-orders__top">
            <div>
              <h2 className="account-orders__name">
                {first?.name || 'Order'}
                {more > 0 && <span className="account-orders__more"> +{more} more</span>}
              </h2>
              <p className="account-orders__sub">Qty: {itemCountOf(order)}</p>
            </div>
            <span className={`account-orders__pill account-orders__pill--${group}`}>
              {ORDER_STATUS_LABEL[order.status] || order.status}
            </span>
          </div>
          <div className="account-orders__meta">
            <span className="account-orders__order-id">
              Order ID: <strong>{order.reference}</strong>
            </span>
            <span>{shortDate(order.createdAt)}</span>
            <span className="account-orders__price">{rupees(order.total)}</span>
          </div>
          {error && (
            <p className="account-orders__error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="account-orders__actions">
          <Link to={`/account/orders/${order.id}`} className="account-orders__btn">
            View
          </Link>
          {group === 'active' && (
            <button
              type="button"
              className={`account-orders__btn account-orders__btn--track${tracking ? ' account-orders__btn--track-open' : ''}`}
              aria-expanded={tracking}
              onClick={onToggleTracking}
            >
              {tracking ? 'Hide' : 'Track'}
            </button>
          )}
          {canCancelOrder(order) && (
            <button type="button" className="account-orders__btn account-orders__btn--cancel" onClick={cancel} disabled={busy}>
              {busy ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      {tracking && (
        <div className="account-orders__tracking">
          <p className="account-orders__tracking-title">Tracking · {order.reference}</p>
          <Timeline order={order} />
        </div>
      )}
    </article>
  )
}

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const [trackingId, setTrackingId] = useState(null)
  const [counts, setCounts] = useState({})
  const tabParam = params.get('tab')
  const activeTab = TABS.some((t) => t.key === tabParam) ? tabParam : TABS[0].key

  const { data, loading, error, reload, setData } = useAsync(async () => {
    const result = await fetchOrders({ status: activeTab, limit: 50 })
    const items = result?.items ?? []
    setCounts((prev) => ({ ...prev, [activeTab]: result?.total ?? items.length }))
    return items
  }, [activeTab])

  const rows = data ?? []
  const busy = loading && !data

  const selectTab = (key) => {
    const next = new URLSearchParams(params)
    if (key === TABS[0].key) next.delete('tab')
    else next.set('tab', key)
    setParams(next, { replace: true })
    setTrackingId(null)
  }

  const onChange = (next) => {
    const group = groupOfOrder(next.status)
    setData((list) => {
      const current = list ?? []
      if (group !== activeTab) {
        setCounts((prev) => ({
          ...prev,
          [activeTab]: Math.max(0, (prev[activeTab] ?? current.length) - 1),
          [group]: prev[group] != null ? prev[group] + 1 : undefined,
        }))
        return current.filter((o) => o.id !== next.id)
      }
      return current.map((o) => (o.id === next.id ? { ...o, ...next } : o))
    })
  }

  const countText = (key) => (counts[key] == null ? '·' : counts[key])

  return (
    <div className="account-orders">
      <div className="account-orders__head">
        <h1 className="account-orders__title">My Orders</h1>
        <p className="account-orders__subtitle">
          {busy ? 'Loading your orders…' : `${countText('active')} active · ${countText('delivered')} delivered`}
        </p>
      </div>

      <div className="account-orders__tabs" role="tablist" aria-label="Orders">
        {TABS.map((t) => {
          const active = t.key === activeTab
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`account-orders__tab${active ? ' account-orders__tab--active' : ''}`}
              onClick={() => selectTab(t.key)}
            >
              {t.label} ({countText(t.key)})
            </button>
          )
        })}
      </div>

      <div className="account-orders__list">
        {busy ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState
            text={EMPTY_TEXT[activeTab]}
            action={
              activeTab === 'active' ? (
                <Link to="/store" className="account-state__btn">
                  Shop the Store
                </Link>
              ) : null
            }
          />
        ) : (
          rows.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              tracking={trackingId === o.id}
              onToggleTracking={() => setTrackingId((current) => (current === o.id ? null : o.id))}
              onChange={onChange}
            />
          ))
        )}
      </div>
    </div>
  )
}
