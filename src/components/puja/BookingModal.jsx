import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPujaBooking, fetchPujaSlots, loginPhoneOf, messageOf, rupees } from '../../api/index.js'
import { useAuth } from '../../context/useAuth.js'
import CouponBox from '../ui/CouponBox.jsx'
import backChevron from '../../assets/puja/back-chevron.svg'
import monthPrev from '../../assets/puja/month-prev.svg'
import monthNext from '../../assets/puja/month-next.svg'
import './BookingModal.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const EMPTY_FORM = { name: '', phone: '', email: '', gotra: '', address: '', notes: '' }

const STEP_TITLES = ['Select Date', 'Select Time', 'Booking Details']

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a, b) {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Local calendar date → "YYYY-MM-DD" (no timezone shift). */
function apiDate(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function buildMonthCells(year, month) {
  const lead = new Date(year, month, 1).getDay()
  const count = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < lead; i += 1) cells.push(null)
  for (let day = 1; day <= count; day += 1) cells.push(new Date(year, month, day))
  return cells
}

/** "6:00 AM" → 6, "1:00 PM" → 13; anything unparseable → 12 (afternoon). */
function hourOf(time) {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec(String(time).trim())
  if (!match) return 12
  let hour = Number(match[1]) % 12
  if (match[3]?.toUpperCase() === 'PM') hour += 12
  return hour
}

function groupSlots(slots) {
  const groups = [
    { label: 'Morning', slots: [] },
    { label: 'Afternoon', slots: [] },
    { label: 'Evening', slots: [] },
  ]
  slots.forEach((slot) => {
    const hour = hourOf(slot.time)
    const index = hour < 12 ? 0 : hour < 17 ? 1 : 2
    groups[index].slots.push(slot)
  })
  return groups.filter((g) => g.slots.length > 0)
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export default function BookingModal({ puja, open, onClose, onComplete }) {
  if (!open) return null
  // The dialog is unmounted while closed, so all internal state resets on re-open.
  return <BookingDialog puja={puja} onClose={onClose} onComplete={onComplete} />
}

function BookingDialog({ puja, onClose, onComplete }) {
  const titleId = useId()
  const { user, refreshUser } = useAuth()
  const [today] = useState(() => startOfDay(new Date()))
  const [step, setStep] = useState(1)
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  // `slots.date` lags `dateKey` while a fetch is in flight; that gap is the loading state.
  const [slots, setSlots] = useState({ date: null, items: [], error: '' })
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  }))
  const [slotsTick, setSlotsTick] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  /** `{ code, coupon, discount, payable }` from POST /coupons/validate, or null. */
  const [coupon, setCoupon] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Slot availability for the picked date, fetched as soon as the date is chosen.
  const dateKey = date ? apiDate(date) : null
  useEffect(() => {
    if (!dateKey || !puja?.slug) return undefined
    let cancelled = false
    fetchPujaSlots(puja.slug, dateKey)
      .then((data) => {
        if (!cancelled) setSlots({ date: dateKey, items: data?.slots ?? [], error: '' })
      })
      .catch((err) => {
        if (!cancelled) setSlots({ date: dateKey, items: [], error: messageOf(err, 'Could not load slots.') })
      })
    return () => {
      cancelled = true
    }
  }, [dateKey, puja?.slug, slotsTick])

  const back = () => {
    if (step > 1) setStep(step - 1)
    else onClose?.()
  }

  const shiftMonth = (delta) => {
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const pickDate = (cell) => {
    setDate(cell)
    setTime(null)
  }

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const formValid =
    form.name.trim().length > 0 && isValidPhone(form.phone) && isValidEmail(form.email)

  const balance = Number(user?.wallet?.balance) || 0
  const price = Number(puja?.price) || 0
  const discount = coupon ? Math.min(price, Math.max(0, Number(coupon.discount) || 0)) : 0
  const payable = coupon && Number.isFinite(Number(coupon.payable)) ? Number(coupon.payable) : price - discount
  const short = Math.max(0, payable - balance)

  const submit = async (e) => {
    e.preventDefault()
    if (!formValid || !date || !time || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const booking = await createPujaBooking({
        pujaId: puja.id,
        date: apiDate(date),
        time,
        ...(coupon?.code ? { couponCode: coupon.code } : {}),
        contact: {
          fullName: form.name.trim(),
          phone: loginPhoneOf(form.phone),
          email: form.email.trim().toLowerCase(),
          gotra: form.gotra.trim() || undefined,
          address: form.address.trim() || undefined,
        },
        notes: form.notes.trim() || undefined,
      })
      refreshUser?.().catch(() => {})
      onComplete?.(booking)
    } catch (err) {
      if (err?.code === 'insufficient_balance') {
        const shortfall = err.details?.shortfallAmount ?? short
        setSubmitError({
          kind: 'balance',
          text: `Your wallet is ${rupees(shortfall)} short for this puja.`,
        })
      } else if (err?.code === 'slot_full') {
        setSubmitError({ kind: 'slot', text: 'That slot just filled up. Please pick another time.' })
      } else if (err?.code === 'coupon_invalid') {
        setCoupon(null)
        setSubmitError({ kind: 'coupon', text: messageOf(err, 'That coupon could not be applied.') })
      } else if (err?.fields && typeof err.fields === 'object') {
        setSubmitError({ kind: 'fields', text: Object.values(err.fields).join(' ') || messageOf(err) })
      } else {
        setSubmitError({ kind: 'other', text: messageOf(err) })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const subtitle =
    step === 2
      ? formatDate(date)
      : step === 3
        ? [puja?.name, formatDate(date), time].filter(Boolean).join(' · ')
        : null

  const cells = buildMonthCells(view.year, view.month)
  const slotsLoading = Boolean(dateKey) && slots.date !== dateKey
  const slotGroups = slotsLoading ? [] : groupSlots(slots.items)
  const slotsError = slotsLoading ? '' : slots.error

  return (
    <div
      className="bk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <form
        className={`bk-card bk-card--step${step}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
      >
        <div className="bk-progress" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`bk-progress__seg${n <= step ? ' bk-progress__seg--done' : ''}`} />
          ))}
        </div>

        <div className="bk-head">
          <button type="button" className="bk-back" onClick={back} aria-label={step > 1 ? 'Back' : 'Close'}>
            <img className="icon-ink" src={backChevron} alt="" />
          </button>
          <div className="bk-head__text">
            <h3 className="bk-title" id={titleId}>
              {STEP_TITLES[step - 1]}
            </h3>
            {subtitle && <p className="bk-subtitle">{subtitle}</p>}
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="bk-monthnav">
              <button type="button" className="bk-monthnav__btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <img className="icon-ink" src={monthPrev} alt="" />
              </button>
              <p className="bk-monthnav__label" aria-live="polite">
                {MONTHS[view.month]} {view.year}
              </p>
              <button type="button" className="bk-monthnav__btn" onClick={() => shiftMonth(1)} aria-label="Next month">
                <img className="icon-ink" src={monthNext} alt="" />
              </button>
            </div>

            <div className="bk-weekdays" aria-hidden="true">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="bk-days" role="grid">
              {cells.map((cell, i) => {
                if (!cell) return <span key={`empty-${i}`} className="bk-day bk-day--empty" />
                const past = cell < today
                const isToday = isSameDay(cell, today)
                const selected = isSameDay(cell, date)
                const cls = ['bk-day', isToday && 'bk-day--today', selected && 'bk-day--selected']
                  .filter(Boolean)
                  .join(' ')
                return (
                  <button
                    key={cell.getTime()}
                    type="button"
                    className={cls}
                    disabled={past}
                    aria-pressed={selected}
                    aria-label={formatDate(cell)}
                    onClick={() => pickDate(cell)}
                  >
                    {cell.getDate()}
                  </button>
                )
              })}
            </div>

            {date && <div className="bk-selected">Selected: {formatDate(date)}</div>}

            <button type="button" className="bk-continue" disabled={!date} onClick={() => setStep(2)}>
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {slotsLoading ? (
              <p className="bk-status" role="status">
                Checking availability…
              </p>
            ) : slotsError ? (
              <div className="bk-status bk-status--error" role="alert">
                <p>{slotsError}</p>
                <button
                  type="button"
                  className="bk-link"
                  onClick={() => {
                    setSlots({ date: null, items: [], error: '' })
                    setSlotsTick((t) => t + 1)
                  }}
                >
                  Try again
                </button>
              </div>
            ) : slotGroups.length === 0 ? (
              <p className="bk-status">No slots on this date. Please pick another day.</p>
            ) : (
              slotGroups.map((group) => (
                <div className="bk-group" key={group.label}>
                  <p className="bk-group__label">{group.label}</p>
                  <div className="bk-slots">
                    {group.slots.map((slot) => {
                      const full = slot.available === false
                      const scarce = !full && Number.isFinite(slot.left) && slot.left <= 1
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          className={`bk-slot${time === slot.time ? ' bk-slot--selected' : ''}`}
                          disabled={full}
                          aria-pressed={time === slot.time}
                          title={full ? 'Fully booked' : scarce ? `${slot.left} left` : undefined}
                          onClick={() => setTime(slot.time)}
                        >
                          {slot.time}
                          {scarce && <span className="bk-slot__left">{slot.left} left</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}

            <button type="button" className="bk-continue" disabled={!time} onClick={() => setStep(3)}>
              Continue
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bk-form">
              <label className="bk-field">
                <span className="bk-field__label">Full Name *</span>
                <input
                  className="bk-input"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="As per aadhaar"
                  value={form.name}
                  onChange={setField('name')}
                />
              </label>
              <label className="bk-field">
                <span className="bk-field__label">Phone Number *</span>
                <input
                  className="bk-input"
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={setField('phone')}
                />
              </label>
              <label className="bk-field">
                <span className="bk-field__label">Email Address *</span>
                <input
                  className="bk-input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={setField('email')}
                />
              </label>
              <label className="bk-field">
                <span className="bk-field__label">Gotra (optional)</span>
                <input
                  className="bk-input"
                  type="text"
                  name="gotra"
                  placeholder="Your family gotra"
                  value={form.gotra}
                  onChange={setField('gotra')}
                />
              </label>
              <label className="bk-field">
                <span className="bk-field__label">Address for Prasad Delivery</span>
                <textarea
                  className="bk-input bk-textarea"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Full delivery address"
                  value={form.address}
                  onChange={setField('address')}
                />
              </label>
              <label className="bk-field">
                <span className="bk-field__label">Sankalp / notes for the pandit (optional)</span>
                <textarea
                  className="bk-input bk-textarea"
                  name="notes"
                  placeholder="Names to include, special wishes…"
                  value={form.notes}
                  onChange={setField('notes')}
                />
              </label>
            </div>

            <div className={`bk-pay${short > 0 ? ' bk-pay--short' : ''}`}>
              <div className="bk-pay__row">
                <span>Puja fee</span>
                <strong>{rupees(price)}</strong>
              </div>
              {coupon && (
                <div className="bk-pay__row bk-pay__row--discount">
                  <span>Coupon {coupon.code}</span>
                  <strong>−{rupees(discount)}</strong>
                </div>
              )}
              {coupon && (
                <div className="bk-pay__row">
                  <span>Payable</span>
                  <strong>{rupees(payable)}</strong>
                </div>
              )}
              <div className="bk-pay__row">
                <span>Wallet balance</span>
                <strong>{rupees(balance)}</strong>
              </div>
              <CouponBox
                context="puja"
                amount={price}
                applied={coupon}
                onChange={(next) => {
                  setCoupon(next)
                  if (submitError?.kind === 'coupon') setSubmitError(null)
                }}
                disabled={submitting}
              />
              {short > 0 && (
                <p className="bk-pay__note">
                  You need {rupees(short)} more.{' '}
                  <Link to="/account/wallet" className="bk-link" onClick={onClose}>
                    Add money
                  </Link>
                </p>
              )}
            </div>

            {submitError && (
              <p className="bk-error" role="alert">
                {submitError.text}
                {submitError.kind === 'balance' && (
                  <>
                    {' '}
                    <Link to="/account/wallet" className="bk-link" onClick={onClose}>
                      Add money
                    </Link>
                  </>
                )}
                {submitError.kind === 'slot' && (
                  <>
                    {' '}
                    <button type="button" className="bk-link" onClick={() => setStep(2)}>
                      Change time
                    </button>
                  </>
                )}
              </p>
            )}

            <button type="submit" className="bk-continue" disabled={!formValid || submitting || short > 0}>
              {submitting ? 'Booking…' : `Pay ${rupees(payable)} from wallet`}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
