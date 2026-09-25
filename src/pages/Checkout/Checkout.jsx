import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { createOrder, loginPhoneOf, messageOf, rupees } from '../../api/index.js'
import { useAuth } from '../../context/useAuth.js'
import { useCart } from '../../context/useCart.js'
import { mediaUrl } from '../Account/accountUtils.js'
import CouponBox from '../../components/ui/CouponBox.jsx'
import stepCheck from '../../assets/cart/step-check.svg'
import stepCircle from '../../assets/cart/step-circle.svg'
import crumbChevron from '../../assets/cart/crumb-chevron.svg'
import trashIcon from '../../assets/cart/trash.svg'
import chevronSelect from '../../assets/cart/chevron-select.svg'
import flagIndia from '../../assets/cart/flag-india.svg'
import caretIcon from '../../assets/cart/caret.svg'
import './Checkout.css'

/* Mirrors the order contract; the server recomputes and is the source of truth. */
const GST_RATE = 0.18
const FREE_SHIPPING_FROM = 999
const SHIPPING_FEE = 49
const MAX_QTY = 10

const STEPS = ['Cart', 'Payment', 'Details']
const COUNTRIES = ['India']
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Puducherry',
]

const pad2 = (n) => String(n).padStart(2, '0')

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  address: '',
  country: 'India',
  state: 'Delhi',
  city: '',
  postcode: '',
}

/** Splits "Priya Sharma" into the two name boxes the design has. */
function splitName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function formFromUser(user) {
  if (!user) return EMPTY_FORM
  return {
    ...EMPTY_FORM,
    ...splitName(user.name),
    email: user.email || '',
    mobile: loginPhoneOf(user.phone || ''),
    city: user.birthDetails?.placeOfBirth || '',
  }
}

function validate(f) {
  const e = {}
  if (!f.firstName.trim()) e.firstName = 'First name is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email'
  if (!/^\d{10}$/.test(f.mobile)) e.mobile = 'Enter a 10-digit mobile number'
  if (!f.address.trim()) e.address = 'Address is required'
  if (!f.city.trim()) e.city = 'City is required'
  if (!/^\d{6}$/.test(f.postcode.trim())) e.postcode = 'Enter a 6-digit pincode'
  return e
}

/** Server `fields` keys (shipping.fullName …) → the form's field names. */
const SERVER_FIELD = {
  fullName: 'firstName',
  'shipping.fullName': 'firstName',
  phone: 'mobile',
  'shipping.phone': 'mobile',
  email: 'email',
  'shipping.email': 'email',
  address: 'address',
  'shipping.address': 'address',
  city: 'city',
  'shipping.city': 'city',
  state: 'state',
  'shipping.state': 'state',
  pincode: 'postcode',
  'shipping.pincode': 'postcode',
}

export default function Checkout() {
  const { isLoggedIn, user, refreshUser } = useAuth()
  const location = useLocation()
  const { items, count, subtotal, remove, setQty, clear } = useCart()
  const [form, setForm] = useState(() => formFromUser(user))
  const [prefilledFor, setPrefilledFor] = useState(user?.id ?? null)
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  /** `{ code, coupon, discount, payable }` from POST /coupons/validate, or null. */
  const [coupon, setCoupon] = useState(null)

  // The profile can arrive after the first render; prefill once it does.
  if (user && user.id !== prefilledFor) {
    setForm(formFromUser(user))
    setPrefilledFor(user.id)
  }

  const errors = useMemo(() => ({ ...validate(form), ...serverErrors }), [form, serverErrors])
  const isValid = Object.keys(validate(form)).length === 0

  const tax = Math.round(subtotal * GST_RATE)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
  const total = subtotal + tax + shipping
  const discount = coupon ? Math.min(total, Math.max(0, Number(coupon.discount) || 0)) : 0
  const payable = coupon && Number.isFinite(Number(coupon.payable)) ? Number(coupon.payable) : total - discount
  const balance = Number(user?.wallet?.balance) || 0
  const shortfall = Math.max(0, payable - balance)

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const field = (name) => ({
    name,
    value: form[name],
    onChange: (e) => {
      const { value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
      setServerErrors((prev) => {
        if (!prev[name]) return prev
        const next = { ...prev }
        delete next[name]
        return next
      })
    },
    onBlur: () => setTouched((prev) => ({ ...prev, [name]: true })),
  })
  const showError = (name) => (touched[name] || serverErrors[name]) && errors[name]

  const payNow = async () => {
    if (!isValid) {
      setTouched({ firstName: true, email: true, mobile: true, address: true, city: true, postcode: true })
      return
    }
    if (placing) return
    setPlacing(true)
    setSubmitError(null)
    setServerErrors({})
    try {
      const placed = await createOrder({
        items: items.map((i) => ({ productId: i.id, qty: Math.min(MAX_QTY, i.qty) })),
        ...(coupon?.code ? { couponCode: coupon.code } : {}),
        shipping: {
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          phone: form.mobile,
          email: form.email.trim().toLowerCase(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state,
          pincode: form.postcode.trim(),
        },
      })
      setOrder(placed)
      clear()
      refreshUser?.().catch(() => {})
    } catch (err) {
      if (err?.code === 'insufficient_balance') {
        const short = err.details?.shortfallAmount ?? shortfall
        setSubmitError({ kind: 'balance', text: `Your wallet is ${rupees(short)} short for this order.` })
      } else if (err?.code === 'coupon_invalid') {
        setCoupon(null)
        setSubmitError({ kind: 'coupon', text: messageOf(err, 'That coupon could not be applied.') })
      } else if (err?.code === 'out_of_stock') {
        const hit = items.find((i) => String(i.id) === String(err.details?.productId))
        const available = err.details?.available
        setSubmitError({
          kind: 'stock',
          text: hit
            ? `${hit.name} ${available > 0 ? `only has ${available} left` : 'is out of stock'}. Adjust the quantity and try again.`
            : messageOf(err, 'An item in your cart is out of stock.'),
        })
      } else if (err?.status === 422 && err.fields && typeof err.fields === 'object') {
        const mapped = {}
        const unmapped = []
        Object.entries(err.fields).forEach(([key, msg]) => {
          const name = SERVER_FIELD[key]
          if (name) mapped[name] = String(msg)
          else unmapped.push(String(msg))
        })
        setServerErrors(mapped)
        setSubmitError({ kind: 'fields', text: unmapped.join(' ') || 'Please check the highlighted fields.' })
      } else {
        setSubmitError({ kind: 'other', text: messageOf(err) })
      }
    } finally {
      setPlacing(false)
    }
  }

  const progress = (
    <div className="checkout-page__progress">
      <div className="checkout-page__steps">
        {STEPS.map((label, i) => (
          <div key={label} className={`checkout-page__step${i === 0 || order ? ' checkout-page__step--done' : ''}`}>
            {i > 0 && <span className="checkout-page__step-line" />}
            <img className="checkout-page__step-icon" src={i === 0 || order ? stepCheck : stepCircle} alt="" />
            <span className="checkout-page__step-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const crumbs = (
    <nav className="checkout-page__crumbs" aria-label="Breadcrumb">
      <Link to="/" className="checkout-page__crumb checkout-page__crumb--home">
        Home
      </Link>
      <img className="checkout-page__crumb-sep icon-ink" src={crumbChevron} alt="" />
      <Link to="/store" className="checkout-page__crumb">
        Store
      </Link>
      <img className="checkout-page__crumb-sep icon-ink" src={crumbChevron} alt="" />
      <span className="checkout-page__crumb" aria-current="page">
        Checkout
      </span>
    </nav>
  )

  if (order) {
    return (
      <section className="checkout-page">
        {progress}
        <div className="checkout-page__inner">
          {crumbs}
          <div className="checkout-page__success">
            <h2 className="checkout-page__success-title">Order placed!</h2>
            <p className="checkout-page__success-text">
              Order <strong>{order.reference}</strong> · {rupees(order.total)} paid from your wallet.
              {order.shipping?.email ? (
                <>
                  {' '}
                  Confirmation sent to <strong>{order.shipping.email}</strong>.
                </>
              ) : null}
            </p>
            <div className="checkout-page__success-actions">
              <Link to="/account/orders" className="btn-gradient checkout-page__success-btn">
                View my orders
              </Link>
              <Link to="/store" className="checkout-page__success-link">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="checkout-page">
        {progress}
        <div className="checkout-page__inner">
          {crumbs}
          <div className="checkout-page__empty">
            <h2 className="checkout-page__empty-title">Your cart is empty</h2>
            <p className="checkout-page__empty-text">Add a few products before checking out.</p>
            <Link to="/store" className="btn-gradient checkout-page__success-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="checkout-page">
      {progress}
      <div className="checkout-page__inner">
        {crumbs}

        <div className="checkout-page__grid">
          <div className="checkout-page__main">
            <h2 className="checkout-page__heading">Order Summary</h2>
            <div className="checkout-page__card checkout-page__summary">
              {items.map((item) => (
                <article key={item.id} className="checkout-item">
                  <img className="checkout-item__image" src={mediaUrl(item.image)} alt={item.name} />
                  <div className="checkout-item__body">
                    <h3 className="checkout-item__name">
                      <Link to={`/store/${item.slug}`}>{item.name}</Link>
                    </h3>
                    <p className="checkout-item__desc">
                      Energized and certified by Shree Astro. Delivered to your doorstep across India.
                    </p>
                    <div className="checkout-item__bottom">
                      <p className="checkout-item__price">
                        {rupees(item.price)}
                        {item.qty > 1 && (
                          <span className="checkout-item__line"> × {item.qty} = {rupees(item.price * item.qty)}</span>
                        )}
                      </p>
                      <div className="checkout-item__quantity">
                        <span className="checkout-item__quantity-label">Quantity</span>
                        <div className="checkout-item__stepper">
                          <button
                            type="button"
                            className="checkout-item__step"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(item.id, item.qty - 1)}
                          >
                            –
                          </button>
                          <span className="checkout-item__qty">{item.qty}</span>
                          <button
                            type="button"
                            className="checkout-item__step"
                            aria-label="Increase quantity"
                            disabled={item.qty >= MAX_QTY}
                            onClick={() => setQty(item.id, Math.min(MAX_QTY, item.qty + 1))}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="checkout-item__remove"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => remove(item.id)}
                  >
                    <img className="icon-ink" src={trashIcon} alt="" />
                  </button>
                </article>
              ))}
            </div>

            <h2 className="checkout-page__heading">Contact Details</h2>
            <form className="checkout-page__card checkout-form" noValidate onSubmit={(e) => e.preventDefault()}>
              <div className="checkout-form__col">
                <div className="checkout-form__group">
                  <input
                    className={`checkout-form__input${showError('firstName') ? ' checkout-form__input--error' : ''}`}
                    type="text"
                    placeholder="First Name"
                    autoComplete="given-name"
                    aria-label="First Name"
                    {...field('firstName')}
                  />
                  {showError('firstName') && <p className="checkout-form__error">{errors.firstName}</p>}
                </div>
                <div className="checkout-form__group">
                  <input
                    className={`checkout-form__input${showError('email') ? ' checkout-form__input--error' : ''}`}
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    aria-label="Email"
                    {...field('email')}
                  />
                  {showError('email') && <p className="checkout-form__error">{errors.email}</p>}
                </div>
              </div>
              <div className="checkout-form__divider" />
              <div className="checkout-form__col">
                <div className="checkout-form__group">
                  <input
                    className="checkout-form__input"
                    type="text"
                    placeholder="Last Name"
                    autoComplete="family-name"
                    aria-label="Last Name"
                    {...field('lastName')}
                  />
                </div>
                <div className="checkout-form__group">
                  <div
                    className={`checkout-form__input checkout-form__phone${
                      showError('mobile') ? ' checkout-form__input--error' : ''
                    }`}
                  >
                    <span className="checkout-form__code">
                      <img className="checkout-form__flag" src={flagIndia} alt="" />
                      <span className="checkout-form__code-text">+91</span>
                      <img className="checkout-form__caret icon-ink" src={caretIcon} alt="" />
                    </span>
                    <input
                      className="checkout-form__phone-input"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Mobile Number"
                      autoComplete="tel-national"
                      aria-label="Mobile Number"
                      {...field('mobile')}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))
                      }
                    />
                  </div>
                  {showError('mobile') && <p className="checkout-form__error">{errors.mobile}</p>}
                </div>
              </div>
            </form>

            <h2 className="checkout-page__heading">Shipping Details</h2>
            <form
              className="checkout-page__card checkout-form checkout-form--shipping"
              noValidate
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="checkout-form__group checkout-form__group--full">
                <textarea
                  className={`checkout-form__input checkout-form__textarea${
                    showError('address') ? ' checkout-form__input--error' : ''
                  }`}
                  placeholder="Address"
                  autoComplete="street-address"
                  aria-label="Address"
                  {...field('address')}
                />
                {showError('address') && <p className="checkout-form__error">{errors.address}</p>}
              </div>
              <div className="checkout-form__row">
                <label className="checkout-form__input checkout-form__select-wrap">
                  <span className="checkout-form__select-label">Country</span>
                  <select className="checkout-form__select" {...field('country')}>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <img className="checkout-form__chevron icon-ink" src={chevronSelect} alt="" />
                </label>
                <label className="checkout-form__input checkout-form__select-wrap">
                  <span className="checkout-form__select-label">State</span>
                  <select className="checkout-form__select" {...field('state')}>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <img className="checkout-form__chevron icon-ink" src={chevronSelect} alt="" />
                </label>
              </div>
              <div className="checkout-form__row">
                <div className="checkout-form__group">
                  <label
                    className={`checkout-form__input checkout-form__select-wrap checkout-form__select-wrap--text${
                      showError('city') ? ' checkout-form__input--error' : ''
                    }`}
                  >
                    <span className="checkout-form__select-label">City</span>
                    <input
                      className="checkout-form__select checkout-form__zip"
                      type="text"
                      placeholder="New Delhi"
                      autoComplete="address-level2"
                      {...field('city')}
                    />
                  </label>
                  {showError('city') && <p className="checkout-form__error">{errors.city}</p>}
                </div>
                <div className="checkout-form__group">
                  <label
                    className={`checkout-form__input checkout-form__select-wrap checkout-form__select-wrap--text${
                      showError('postcode') ? ' checkout-form__input--error' : ''
                    }`}
                  >
                    <span className="checkout-form__select-label">Postcode/ZIP</span>
                    <input
                      className="checkout-form__select checkout-form__zip"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="110001"
                      autoComplete="postal-code"
                      {...field('postcode')}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, postcode: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                      }
                    />
                  </label>
                  {showError('postcode') && <p className="checkout-form__error">{errors.postcode}</p>}
                </div>
              </div>
            </form>
          </div>

          <aside className="checkout-page__side">
            <div className="checkout-pay">
              <h2 className="checkout-pay__title">Payment Details</h2>
              <div className="checkout-pay__rows">
                <div className="checkout-pay__row">
                  <span>Item/s</span>
                  <span className="checkout-pay__colon">:</span>
                  <span className="checkout-pay__value">{pad2(count)}</span>
                </div>
                <div className="checkout-pay__row">
                  <span>Subtotal</span>
                  <span className="checkout-pay__colon">:</span>
                  <span className="checkout-pay__value">{rupees(subtotal)}</span>
                </div>
                <div className="checkout-pay__row">
                  <span>GST (18%)</span>
                  <span className="checkout-pay__colon">:</span>
                  <span className="checkout-pay__value">{rupees(tax)}</span>
                </div>
                <div className="checkout-pay__row">
                  <span>Shipping</span>
                  <span className="checkout-pay__colon">:</span>
                  <span className="checkout-pay__value">{shipping === 0 ? 'FREE' : rupees(shipping)}</span>
                </div>
                {coupon && (
                  <div className="checkout-pay__row checkout-pay__row--discount">
                    <span>Coupon {coupon.code}</span>
                    <span className="checkout-pay__colon">:</span>
                    <span className="checkout-pay__value">−{rupees(discount)}</span>
                  </div>
                )}
              </div>
              <div className="checkout-pay__row checkout-pay__row--payable">
                <span>Payable Amount</span>
                <span className="checkout-pay__colon">:</span>
                <span className="checkout-pay__value">{rupees(payable)}</span>
              </div>

              <CouponBox
                context="order"
                amount={total}
                applied={coupon}
                onChange={(next) => {
                  setCoupon(next)
                  if (submitError?.kind === 'coupon') setSubmitError(null)
                }}
                disabled={placing}
              />

              <div className={`checkout-pay__wallet${shortfall > 0 ? ' checkout-pay__wallet--short' : ''}`}>
                <div className="checkout-pay__wallet-row">
                  <span>Wallet balance</span>
                  <strong>{user ? rupees(balance) : '…'}</strong>
                </div>
                {user && shortfall > 0 && (
                  <p className="checkout-pay__wallet-note">
                    You need {rupees(shortfall)} more.{' '}
                    <Link to="/account/wallet" className="checkout-pay__link">
                      Add money
                    </Link>
                  </p>
                )}
              </div>

              {submitError && (
                <p className="checkout-pay__error" role="alert">
                  {submitError.text}
                  {submitError.kind === 'balance' && (
                    <>
                      {' '}
                      <Link to="/account/wallet" className="checkout-pay__link">
                        Add money
                      </Link>
                    </>
                  )}
                </p>
              )}

              <button
                type="button"
                className="checkout-pay__btn"
                disabled={!isValid || placing || !user || shortfall > 0}
                onClick={payNow}
              >
                {placing ? 'Placing order…' : `Pay ${rupees(payable)} from wallet`}
              </button>
              <p className="checkout-pay__hint">Paid from your Shree Astro wallet. Totals are confirmed by the server.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
