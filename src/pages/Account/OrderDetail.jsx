import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelOrder, dateTime, fetchOrder, messageOf, rupees } from '../../api/index.js'
import arrowLeftIcon from '../../assets/account/pujas/arrow-left.svg'
import { EmptyState, ErrorState, Skeleton } from './accountUi.jsx'
import { mediaUrl, useAsync } from './accountUtils.js'
import { Timeline } from './Orders.jsx'
import { ORDER_STATUS_LABEL, canCancelOrder, groupOfOrder, itemCountOf } from './orderUtils.js'
import RateProductModal from './RateProductModal.jsx'
import './Orders.css'
import './OrderDetail.css'

const PAYMENT_LABEL = { paid: 'Paid (wallet)', refunded: 'Refunded to wallet' }

function DetailSkeleton() {
  return (
    <div className="order-detail" aria-busy="true">
      <div className="order-detail__head">
        <h1 className="order-detail__title">Order Details</h1>
        <Skeleton style={{ width: 140, height: 14, marginTop: 6 }} />
      </div>
      <div className="order-detail__grid">
        <section className="order-detail__main">
          <Skeleton style={{ width: '100%', height: 90, borderRadius: 14 }} />
          <Skeleton style={{ width: '100%', height: 90, borderRadius: 14, marginTop: 12 }} />
        </section>
        <aside className="order-detail__side">
          <Skeleton style={{ width: '100%', height: 220, borderRadius: 16 }} />
        </aside>
      </div>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const { data: order, loading, error, reload, setData } = useAsync(() => fetchOrder(id), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  /** Index of the item being rated, while the "Rate product" modal is open. */
  const [ratingIndex, setRatingIndex] = useState(null)

  const back = (
    <Link to="/account/orders" className="order-detail__back">
      <span className="order-detail__back-icon">
        <img className="icon-ink" src={arrowLeftIcon} alt="" />
      </span>
      Back to My Orders
    </Link>
  )

  if (loading && !order) return <DetailSkeleton />

  if (!order) {
    return (
      <div className="order-detail">
        <div className="order-detail__head">
          <h1 className="order-detail__title">Order Details</h1>
        </div>
        {back}
        {/not found/i.test(error || '') ? (
          <EmptyState title="Order not found" text="This order does not exist or belongs to another account." />
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )}
      </div>
    )
  }

  const group = groupOfOrder(order.status)
  const shipping = order.shipping || {}
  const items = order.items ?? []
  const delivered = order.status === 'delivered'
  const ratingItem = ratingIndex != null ? items[ratingIndex] : null

  /** The API answered — the item shows "Reviewed" and cannot be rated again. */
  const rated = (index, review) => {
    setData((current) => ({
      ...current,
      items: (current?.items ?? []).map((entry, i) =>
        i === index
          ? { ...entry, canReview: false, review: { id: review?.id ?? null, rating: Number(review?.rating) || 0 } }
          : entry,
      ),
    }))
    setRatingIndex(null)
  }

  const cancel = async () => {
    if (!window.confirm(`Cancel order ${order.reference}? The amount will be refunded to your wallet.`)) return
    setBusy(true)
    setActionError('')
    try {
      setData(await cancelOrder(order.id))
    } catch (err) {
      setActionError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="order-detail">
      <div className="order-detail__head">
        <h1 className="order-detail__title">Order Details</h1>
        <p className="order-detail__subtitle">
          {order.reference} · {itemCountOf(order)} {itemCountOf(order) === 1 ? 'item' : 'items'}
        </p>
      </div>

      {back}

      <div className="order-detail__grid">
        <section className="order-detail__main">
          <div className="order-detail__card">
            <div className="order-detail__card-head">
              <div>
                <p className="order-detail__ref">Order {order.reference}</p>
                <p className="order-detail__placed">Placed {dateTime(order.createdAt)}</p>
              </div>
              <span className={`account-orders__pill account-orders__pill--${group}`}>
                {ORDER_STATUS_LABEL[order.status] || order.status}
              </span>
            </div>

            <ul className="order-detail__items">
              {items.map((item, i) => {
                const image = mediaUrl(item.imageUrl || item.product?.imageUrl)
                const slug = item.product?.slug
                return (
                  <li key={item.product?.id || item.product || i} className="order-detail__item">
                    {image ? (
                      <img className="order-detail__item-img" src={image} alt={item.name} />
                    ) : (
                      <span className="order-detail__item-img order-detail__item-img--empty" aria-hidden="true" />
                    )}
                    <div className="order-detail__item-body">
                      <p className="order-detail__item-name">
                        {slug ? <Link to={`/store/${slug}`}>{item.name}</Link> : item.name}
                      </p>
                      <p className="order-detail__item-sub">
                        {rupees(item.price)} × {item.qty}
                      </p>
                      {delivered && (item.review || item.canReview) && (
                        <div className="order-detail__item-review">
                          {item.review ? (
                            <span className="order-detail__reviewed" aria-label={`You rated this ${item.review.rating} out of 5`}>
                              <span className="order-detail__reviewed-star" aria-hidden="true">
                                ★
                              </span>
                              {item.review.rating} · Reviewed
                            </span>
                          ) : (
                            <button type="button" className="order-detail__rate" onClick={() => setRatingIndex(i)}>
                              Rate product
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="order-detail__item-total">{rupees(item.lineTotal ?? item.price * item.qty)}</p>
                  </li>
                )
              })}
            </ul>

            <dl className="order-detail__totals">
              <div className="order-detail__total-row">
                <dt>Subtotal</dt>
                <dd>{rupees(order.subtotal)}</dd>
              </div>
              <div className="order-detail__total-row">
                <dt>GST (18%)</dt>
                <dd>{rupees(order.tax)}</dd>
              </div>
              <div className="order-detail__total-row">
                <dt>Shipping</dt>
                <dd>{Number(order.shippingFee) > 0 ? rupees(order.shippingFee) : 'FREE'}</dd>
              </div>
              <div className="order-detail__total-row order-detail__total-row--grand">
                <dt>Total</dt>
                <dd>{rupees(order.total)}</dd>
              </div>
              <div className="order-detail__total-row">
                <dt>Payment</dt>
                <dd>{PAYMENT_LABEL[order.payment?.status] || 'Wallet'}</dd>
              </div>
            </dl>
          </div>

          <div className="order-detail__card">
            <p className="order-detail__card-title">Shipping to</p>
            <p className="order-detail__address">
              {shipping.fullName && <strong>{shipping.fullName}</strong>}
              {shipping.address && (
                <>
                  <br />
                  {shipping.address}
                </>
              )}
              {(shipping.city || shipping.state || shipping.pincode) && (
                <>
                  <br />
                  {[shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ')}
                </>
              )}
              {(shipping.phone || shipping.email) && (
                <>
                  <br />
                  {[shipping.phone, shipping.email].filter(Boolean).join(' · ')}
                </>
              )}
            </p>
          </div>
        </section>

        <aside className="order-detail__side">
          <div className="order-detail__card">
            <p className="order-detail__card-title">Tracking</p>
            <Timeline order={order} />
            {canCancelOrder(order) && (
              <button type="button" className="order-detail__cancel" onClick={cancel} disabled={busy}>
                {busy ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}
            {order.status === 'cancelled' && order.payment?.status === 'refunded' && (
              <p className="order-detail__note">
                A refund of <strong>{rupees(order.total)}</strong> has been credited to your wallet.
              </p>
            )}
            {actionError && (
              <p className="order-detail__error" role="alert">
                {actionError}
              </p>
            )}
          </div>
        </aside>
      </div>

      {ratingItem && (
        <RateProductModal
          order={order}
          item={ratingItem}
          onClose={() => setRatingIndex(null)}
          onRated={(review) => rated(ratingIndex, review)}
        />
      )}
    </div>
  )
}
