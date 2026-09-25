import { useEffect, useRef, useState } from 'react'
import { messageOf, rupees, validateCoupon } from '../../api/index.js'
import './CouponBox.css'

/**
 * "Have a coupon?" input + Apply / Remove, backed by `POST /coupons/validate`.
 *
 * `applied` is `{ code, coupon, discount, payable, bonusAmount? }` (or null) held by
 * the parent; `onChange(next)` receives the validated result (or null on remove).
 * When `amount` changes while a coupon is applied it is re-validated, and dropped
 * (with a message) if it no longer fits. `tone`: light (default) | dark.
 */
export default function CouponBox({ context, amount, applied, onChange, disabled = false, tone = 'light' }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const checkedFor = useRef(null)

  const apply = async (e) => {
    e?.preventDefault?.()
    const value = code.trim().toUpperCase()
    if (!value || busy || disabled) return
    setBusy(true)
    setError('')
    setNote('')
    try {
      const result = await validateCoupon({ code: value, context, amount })
      checkedFor.current = amount
      onChange?.({ ...result, code: result?.coupon?.code || value })
      setCode('')
    } catch (err) {
      setError(messageOf(err, 'That coupon could not be applied.'))
    } finally {
      setBusy(false)
    }
  }

  const remove = () => {
    onChange?.(null)
    setError('')
    setNote('')
    checkedFor.current = null
  }

  /* The payable changed under an applied coupon (cart edited, amount picked) → re-check it. */
  useEffect(() => {
    if (!applied?.code || checkedFor.current === amount) return undefined
    let cancelled = false
    checkedFor.current = amount
    validateCoupon({ code: applied.code, context, amount })
      .then((result) => {
        if (!cancelled) onChange?.({ ...result, code: result?.coupon?.code || applied.code })
      })
      .catch((err) => {
        if (cancelled) return
        onChange?.(null)
        setNote(`${applied.code} removed: ${messageOf(err, 'it no longer applies to this amount.')}`)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount])

  const cls = `coupon-box coupon-box--${tone}`

  if (applied?.code) {
    /* On a top-up the "discount" is credited as a bonus rather than taken off the bill. */
    const bonus = Number(applied.bonusAmount ?? (context === 'topup' ? applied.discount : 0)) || 0
    const discount = Number(applied.discount) || 0
    return (
      <div className={`${cls} coupon-box--applied`}>
        <div className="coupon-box__applied">
          <span className="coupon-box__applied-text">
            <strong>{applied.code}</strong> applied
            {bonus > 0 ? ` · +${rupees(bonus)} bonus` : discount > 0 ? ` · −${rupees(discount)}` : ''}
          </span>
          <button type="button" className="coupon-box__remove" onClick={remove} disabled={disabled}>
            Remove
          </button>
        </div>
        {applied.coupon?.title && <p className="coupon-box__hint">{applied.coupon.title}</p>}
      </div>
    )
  }

  return (
    <div className={cls}>
      <div className="coupon-box__row">
        <input
          className="coupon-box__input"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="Have a coupon code?"
          aria-label="Coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            if (error) setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply(e)
          }}
          disabled={busy || disabled}
          maxLength={20}
        />
        <button
          type="button"
          className="coupon-box__apply"
          onClick={apply}
          disabled={!code.trim() || busy || disabled}
        >
          {busy ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="coupon-box__error" role="alert">
          {error}
        </p>
      )}
      {!error && note && (
        <p className="coupon-box__note" role="status">
          {note}
        </p>
      )}
    </div>
  )
}
