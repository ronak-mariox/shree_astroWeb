import { useEffect, useRef } from 'react'

/**
 * A lazily fetched, cached report section. The shell (KundliReport.jsx) owns
 * the cache, so switching tabs never refetches; `fetcher` runs only the first
 * time a tab asks for `key`, or again via `retry()` after an error.
 */
export function useSection(report, key, fetcher) {
  const { profileId, sections, loadSection } = report
  const entry = sections[key]

  /** The latest fetcher, read at call time — a fresh closure each render must not retrigger the effect. */
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (!profileId || entry) return
    loadSection(key, () => fetcherRef.current())
  }, [profileId, key, entry, loadSection])

  return {
    status: entry?.status ?? 'loading',
    data: entry?.data,
    error: entry?.error,
    retry: () => loadSection(key, () => fetcherRef.current(), { force: true }),
  }
}

/** "2021-08-14T02:43:00.000Z" → "Aug 2021". */
export const monthYear = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'

export const PLANET_SYMBOLS = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}

export const ordinal = (n) => {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  const mod100 = num % 100
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[num % 10] || 'th'
  return `${num}${suffix}`
}
