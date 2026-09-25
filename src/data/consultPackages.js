/**
 * Fixed-length consultation packages — the alternative to per-minute billing
 * on the intake form, and the same options again when a package runs out.
 *
 * The server is the source of truth: `POST /chats/precheck` returns every
 * package already priced at the astrologer's real rate (with the admin's
 * discounts applied), `POST /chats` re-prices and re-checks the wallet on
 * submit, and a running package is timed server-side. This mirrors
 * user_app/src/data/consultPackages.ts so both clients behave the same.
 */

/** Mirrors backend config/packages.js — only used to price locally when a precheck brought no quotes. */
export const CONSULTATION_PACKAGES = [
  { minutes: 3, discountPercent: 0 },
  { minutes: 5, discountPercent: 0 },
  { minutes: 10, discountPercent: 0 },
  { minutes: 20, discountPercent: 0 },
]

/** What the seeker picked. Per-minute is the default. `{ mode: 'package', minutes, price }` otherwise. */
export const PER_MINUTE = { mode: 'per_minute' }

/** The intake choice → `POST /chats`' `billing`, or undefined for per-minute (nothing extra is sent). */
export const toPackageBooking = (choice) =>
  choice?.mode === 'package' ? { mode: 'package', packageMinutes: choice.minutes, quotedPrice: choice.price } : undefined

/** The continue choice → `POST /chats/:id/continue` body. */
export const toContinueBody = (choice) =>
  choice?.mode === 'package'
    ? { mode: 'package', packageMinutes: choice.minutes, quotedPrice: choice.price }
    : { mode: 'per_minute' }

/** minutes × rate, less the package's own discount, in whole rupees — the server's rule. */
export const packagePrice = (ratePerMinute, pkg) => {
  const gross = ratePerMinute * pkg.minutes
  const discount = Math.round((gross * (pkg.discountPercent || 0)) / 100)
  return Math.max(0, Math.round(gross - discount))
}

/** Every package priced at `ratePerMinute`, flagged against `balance` when one is known. */
export const quotePackages = (ratePerMinute, balance) =>
  CONSULTATION_PACKAGES.map((pkg) => {
    const price = packagePrice(ratePerMinute, pkg)
    const quote = { minutes: pkg.minutes, discountPercent: pkg.discountPercent, originalPrice: Math.round(ratePerMinute * pkg.minutes), price }
    return balance == null ? quote : { ...quote, affordable: balance >= price, shortfallAmount: Math.max(0, price - balance) }
  })

/** The server's quotes when it sent any, else local pricing from the rate; no rate → no packages. */
export const resolveQuotes = (serverQuotes, ratePerMinute, balance) => {
  if (Array.isArray(serverQuotes) && serverQuotes.length > 0) return serverQuotes
  if (!(Number(ratePerMinute) > 0)) return []
  return quotePackages(Number(ratePerMinute), balance)
}

export const isDiscounted = (quote) =>
  Number(quote?.discountPercent) > 0 && quote?.originalPrice != null && quote.originalPrice > quote.price

export const shortfallFor = (price, balance) => Math.max(0, Math.round(price - balance))

/** Unknown balance means "let the server decide". */
export const canAfford = (price, balance) => balance == null || balance >= price

/** 125 → "02:05". Never negative. */
export const formatCountdown = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

/** Whole seconds until `iso` on the server's clock (`offsetMs` = server − device), 0 once passed. */
export const secondsUntil = (iso, offsetMs = 0, deviceNow = Date.now()) => {
  if (!iso) return 0
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return 0
  return Math.max(0, Math.ceil((target - (deviceNow + offsetMs)) / 1000))
}
