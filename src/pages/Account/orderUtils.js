export const ORDER_STATUS_LABEL = {
  placed: 'Placed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/** The forward path an order follows; the timeline renders these in order. */
export const ORDER_STEPS = ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

/** Order `status` → tab / pill group. */
export const groupOfOrder = (status) =>
  status === 'delivered' ? 'delivered' : status === 'cancelled' ? 'cancelled' : 'active'

export const canCancelOrder = (order) => order?.status === 'placed' || order?.status === 'packed'

export const itemCountOf = (order) => (order?.items ?? []).reduce((n, i) => n + (Number(i.qty) || 0), 0)

/** Tracking timeline rows: every forward step, marked done when the order has reached it. */
export function timelineOf(order) {
  const entries = order?.tracking ?? []
  const at = (status) => entries.find((e) => e.status === status)?.at
  const reached = new Set(entries.map((e) => e.status))
  if (order?.status === 'cancelled') {
    const done = ORDER_STEPS.filter((s) => reached.has(s))
    return [
      ...done.map((s) => ({ key: s, label: ORDER_STATUS_LABEL[s], at: at(s), done: true })),
      { key: 'cancelled', label: 'Cancelled', at: at('cancelled') || order.cancelledAt, done: true },
    ]
  }
  const currentIndex = Math.max(0, ORDER_STEPS.indexOf(order?.status))
  return ORDER_STEPS.map((s, i) => ({
    key: s,
    label: ORDER_STATUS_LABEL[s],
    at: at(s),
    done: reached.has(s) || i <= currentIndex,
  }))
}
