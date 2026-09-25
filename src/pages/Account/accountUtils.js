import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL, messageOf } from '../../api/index.js'

const MEDIA_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '')

/** A `/uploads/...` path from the API becomes an absolute URL; anything already absolute is left alone. */
export function mediaUrl(url) {
  if (!url) return ''
  const value = String(url)
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) return value
  return `${MEDIA_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`
}

export const initialOf = (name, fallback = 'U') =>
  (String(name || '').trim().charAt(0) || fallback).toUpperCase()

/** Mongoose rows come back with `_id`; hand-shaped rows with `id`. */
export const idOf = (row) => String(row?.id ?? row?._id ?? '')

export const CHANNEL_LABEL = { chat: 'Chat', call: 'Call', video: 'Video Call' }
export const channelLabel = (channel) => CHANNEL_LABEL[channel] || 'Chat'

/** Which tab a consultation `status` belongs to. */
export function groupOfStatus(status) {
  if (status === 'requested' || status === 'active') return 'upcoming'
  if (status === 'ended') return 'completed'
  return 'cancelled'
}

export const STATUS_LABEL = {
  requested: 'Waiting',
  active: 'Active',
  ended: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Declined',
  missed: 'Missed',
  expired: 'Expired',
}

/** Puja booking `status` → tab / pill group. */
export const groupOfBooking = (status) =>
  status === 'confirmed' ? 'upcoming' : status === 'completed' ? 'completed' : 'cancelled'

export const BOOKING_STATUS_LABEL = {
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const shortId = (id) => String(id || '').slice(-8).toUpperCase()

export const timeOnly = (value) =>
  value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'

/**
 * Runs `loader` on mount and whenever `deps` change; `reload()` runs it again.
 * `error` is already a printable message.
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: messageOf(error) }))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback(
    (updater) =>
      setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    [],
  )

  return { ...state, reload, setData }
}
