import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import {
  fetchSettings,
  loginPhoneOf,
  messageOf,
  register,
  requestLoginOtp,
  toApiDate,
  verifyLoginOtp,
} from '../../api/index.js'
import iconStar from '../../assets/pages/login/icon-star.svg'
import iconCheck from '../../assets/pages/login/icon-check.svg'
import iconGoogle from '../../assets/pages/login/icon-google.svg'
import iconApple from '../../assets/pages/login/icon-apple.svg'
import iconChevronDown from '../../assets/pages/login/icon-chevron-down.svg'
import iconChevronLeft from '../../assets/pages/login/icon-chevron-left.svg'
import iconPhone from '../../assets/pages/login/icon-phone.svg'
import radioOn from '../../assets/pages/intake/radio-on.svg'
import radioOff from '../../assets/pages/intake/radio-off.svg'
import avatarPriya from '../../assets/pages/login/avatar-priya.jpg'
import './Login.css'

const PERKS = [
  { title: 'Free Kundli Report', text: 'Instant, comprehensive birth chart' },
  { title: '5 Minutes Free', text: 'First consultation on us' },
  { title: 'Verified Astrologers', text: 'Only top 15% are accepted' },
]

const BIRTH_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
  { name: 'dob', label: 'Date of Birth', type: 'date', placeholder: 'DD/MM/YYYY', autoComplete: 'bday' },
  { name: 'tob', label: 'Time of Birth', type: 'time', placeholder: '-- : -- --', autoComplete: 'off' },
  { name: 'place', label: 'Place of Birth', type: 'text', placeholder: 'City, State, Country', autoComplete: 'off' },
]

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

/** Backend field names (422 / 409 `fields`) → the inputs on the birth card. */
const FIELD_KEYS = {
  fullName: 'name',
  email: 'email',
  dateOfBirth: 'dob',
  timeOfBirth: 'tob',
  placeOfBirth: 'place',
  gender: 'gender',
}

const OTP_LENGTH = 6
const RESEND_SECONDS = 30
const EMPTY_OTP = () => Array(OTP_LENGTH).fill('')
const EMPTY_BIRTH = { name: '', email: '', dob: '', tob: '', place: '', gender: '' }
const REQUIRED_BIRTH = ['name', 'email', 'dob', 'tob', 'place']

/** `?ref=sa1b2c3d` → "SA1B2C3D"; anything that is not a plausible code is ignored. */
function referralFrom(params) {
  const raw = String(params.get('ref') || params.get('referral') || '').trim().toUpperCase()
  return /^[A-Z0-9]{4,12}$/.test(raw) ? raw : ''
}

function formatPhone(digits) {
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}

/** The inline text for a failed call; a 429 says how long to wait. */
function errorText(error) {
  const text = messageOf(error)
  const wait = error?.status === 429 ? Number(error.retryAfterSeconds) : 0
  return wait > 0 && !/\d+\s*s/.test(text) ? `${text} Try again in ${wait}s.` : text
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isLoggedIn } = useAuth()

  const [step, setStep] = useState(1)
  /* Prefilled from a referral link (`?ref=CODE`) and kept in state so it survives the OTP round-trip; editable on the sign-up step. */
  const [referralCode, setReferralCode] = useState(() => referralFrom(searchParams))
  const [referralFromLink] = useState(() => Boolean(referralFrom(searchParams)))
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(EMPTY_OTP)
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const [devCode, setDevCode] = useState('')
  const [birth, setBirth] = useState(EMPTY_BIRTH)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [socialNote, setSocialNote] = useState('')
  const [features, setFeatures] = useState({ googleSignIn: true, appleSignIn: true })
  const otpRefs = useRef([])

  const destination = location.state?.from || '/account'
  const phoneValid = /^[6-9]\d{9}$/.test(phone)
  const otpValue = otp.join('')
  const otpValid = otpValue.length === OTP_LENGTH
  const birthValid = REQUIRED_BIRTH.every((key) => birth[key].trim() !== '')

  /* Already signed in (on landing, or the moment a session is saved) → leave. */
  useEffect(() => {
    if (isLoggedIn) navigate(destination, { replace: true })
  }, [isLoggedIn, navigate, destination])

  /* Feature switches decide whether the social buttons are even clickable. */
  useEffect(() => {
    let active = true
    fetchSettings()
      .then((settings) => {
        if (!active || !settings?.features) return
        setFeatures({
          googleSignIn: settings.features.googleSignIn !== false,
          appleSignIn: settings.features.appleSignIn !== false,
        })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (step !== 2 || resendIn <= 0) return undefined
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [step, resendIn])

  useEffect(() => {
    if (step === 2) otpRefs.current[0]?.focus()
  }, [step])

  const identifier = () => ({ channel: 'phone', phone: loginPhoneOf(phone) })

  /** Asks the backend for a code and arms the resend countdown from its answer. */
  const sendCode = async () => {
    const data = await requestLoginOtp(identifier())
    setResendIn(Number(data?.resendInSeconds) || RESEND_SECONDS)
    const code = import.meta.env.DEV && data?.devCode ? String(data.devCode) : ''
    setDevCode(code)
    setOtp(code.length === OTP_LENGTH ? code.split('') : EMPTY_OTP())
    return data
  }

  const goToRegister = () => {
    setError('')
    setFieldErrors({})
    setStep(3)
  }

  const handleSocial = (provider) => () => {
    setSocialNote(`${provider} sign-in is coming soon — use your phone number.`)
  }

  const handlePhoneChange = (e) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
    if (error) setError('')
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!phoneValid || busy) return
    setError('')
    setBusy('send')
    try {
      await sendCode()
      setStep(2)
    } catch (err) {
      if (err?.code === 'account_not_found') {
        /* No account on this number — the backend never sends a code, so open one. */
        goToRegister()
      } else if (err?.code === 'otp_cooldown') {
        /* A code is already on its way; let them type it while the timer runs. */
        setOtp(EMPTY_OTP())
        setDevCode('')
        setResendIn(Number(err.retryAfterSeconds) || RESEND_SECONDS)
        setError(errorText(err))
        setStep(2)
      } else {
        setError(errorText(err))
      }
    } finally {
      setBusy(null)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(1)
  }

  const handleResend = async () => {
    if (resendIn > 0 || busy) return
    setError('')
    setBusy('resend')
    try {
      await sendCode()
      otpRefs.current[0]?.focus()
    } catch (err) {
      if (err?.code === 'account_not_found') {
        goToRegister()
        return
      }
      if (err?.status === 429 && err.retryAfterSeconds) setResendIn(Number(err.retryAfterSeconds))
      setError(errorText(err))
    } finally {
      setBusy(null)
    }
  }

  const setOtpDigits = (digits, startIndex) => {
    setOtp((prev) => {
      const next = [...prev]
      digits.split('').forEach((d, i) => {
        if (startIndex + i < OTP_LENGTH) next[startIndex + i] = d
      })
      return next
    })
    const focusIndex = Math.min(startIndex + digits.length, OTP_LENGTH - 1)
    otpRefs.current[focusIndex]?.focus()
  }

  const handleOtpChange = (index) => (e) => {
    if (error) setError('')
    const digits = e.target.value.replace(/\D/g, '')
    if (!digits) {
      setOtp((prev) => prev.map((d, i) => (i === index ? '' : d)))
      return
    }
    setOtpDigits(digits.slice(-1 * Math.min(digits.length, OTP_LENGTH - index)), index)
  }

  const handleOtpKeyDown = (index) => (e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      e.preventDefault()
      setOtp((prev) => prev.map((d, i) => (i === index - 1 ? '' : d)))
      otpRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (index) => (e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!digits) return
    e.preventDefault()
    setOtpDigits(digits.slice(0, OTP_LENGTH - index), index)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!otpValid || busy) return
    setError('')
    setBusy('verify')
    try {
      await verifyLoginOtp(identifier(), otpValue)
      navigate(destination, { replace: true })
    } catch (err) {
      if (err?.code === 'account_not_found') {
        goToRegister()
        return
      }
      setError(errorText(err))
      /* A wrong or expired code: clear the boxes so the retry starts clean. */
      if (err?.status === 400 || err?.status === 429) {
        setOtp(EMPTY_OTP())
        otpRefs.current[0]?.focus()
      }
    } finally {
      setBusy(null)
    }
  }

  const handleBirthChange = (e) => {
    const { name, value } = e.target
    setBirth((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    if (error) setError('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!birthValid || busy) return
    setError('')
    setFieldErrors({})
    setBusy('create')
    try {
      await register({
        fullName: birth.name,
        email: birth.email,
        phone,
        gender: birth.gender || undefined,
        dateOfBirth: toApiDate(birth.dob),
        timeOfBirth: birth.tob,
        placeOfBirth: birth.place,
        referralCode: referralCode.trim() || undefined,
      })
      navigate(destination, { replace: true })
    } catch (err) {
      const fields = err?.fields && typeof err.fields === 'object' ? err.fields : {}
      const mapped = {}
      Object.entries(fields).forEach(([key, message]) => {
        if (FIELD_KEYS[key]) mapped[FIELD_KEYS[key]] = String(message)
      })
      setFieldErrors(mapped)
      /* Anything without an input of its own (e.g. a phone conflict) goes above the button. */
      if (fields.phone || Object.keys(mapped).length === 0) setError(errorText(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="auth-page">
      <span className="auth-page__glow auth-page__glow--gold" aria-hidden="true" />
      <span className="auth-page__glow auth-page__glow--orange" aria-hidden="true" />

      <div className="auth-page__card">
        <aside className="auth-page__brand">
          <span className="auth-page__brand-glow" aria-hidden="true" />

          <Link to="/" className="auth-page__logo">
            <span className="auth-page__logo-tile">
              <img src={iconStar} alt="" className="auth-page__logo-icon" />
            </span>
            <span className="auth-page__logo-text">Shree Astro</span>
          </Link>

          <div className="auth-page__brand-body">
            <h1 className="auth-page__headline">
              Your cosmic
              <br />
              journey starts <span className="auth-page__headline-accent">here.</span>
            </h1>
            <p className="auth-page__lead">
              Join 5 lakh+ users discovering clarity through India&apos;s most trusted astrology platform.
            </p>
            <ul className="auth-page__perks">
              {PERKS.map((perk) => (
                <li key={perk.title} className="auth-page__perk">
                  <span className="auth-page__perk-check">
                    <img src={iconCheck} alt="" className="auth-page__perk-check-icon" />
                  </span>
                  <div>
                    <p className="auth-page__perk-title">{perk.title}</p>
                    <p className="auth-page__perk-text">{perk.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <figure className="auth-page__testimonial">
            <blockquote className="auth-page__quote">
              &quot;Shree Astro gave me clarity at a time I had none. The astrologer was precise, warm, and
              professional.&quot;
            </blockquote>
            <figcaption className="auth-page__author">
              <img src={avatarPriya} alt="" className="auth-page__avatar" />
              <span className="auth-page__author-name">Priya M. · Mumbai</span>
            </figcaption>
          </figure>
        </aside>

        <section className={`auth-page__panel${step === 3 ? ' auth-page__panel--birth' : ''}`}>
          {step === 1 && (
            <form className="auth-page__form" onSubmit={handleSendOtp} noValidate>
              <h2 className="auth-page__title">Welcome back</h2>
              <p className="auth-page__subtitle">Sign in or create your account</p>

              <div className="auth-page__social">
                <button
                  type="button"
                  className="auth-page__social-btn auth-page__social-btn--google"
                  onClick={handleSocial('Google')}
                  disabled={!features.googleSignIn}
                >
                  <img src={iconGoogle} alt="" className="auth-page__social-icon auth-page__social-icon--google" />
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="auth-page__social-btn auth-page__social-btn--apple"
                  onClick={handleSocial('Apple')}
                  disabled={!features.appleSignIn}
                >
                  <img src={iconApple} alt="" className="auth-page__social-icon auth-page__social-icon--apple" />
                  Continue with Apple
                </button>
                {socialNote && (
                  <p className="auth-page__note" role="status">
                    {socialNote}
                  </p>
                )}
              </div>

              <div className="auth-page__divider">
                <span className="auth-page__divider-line" />
                <span className="auth-page__divider-text">or use phone</span>
                <span className="auth-page__divider-line" />
              </div>

              <div className="auth-page__phone-group">
                <label className="auth-page__label" htmlFor="auth-phone">
                  Mobile Number
                </label>
                <div className="auth-page__phone-row">
                  <span className="auth-page__country">
                    +91
                    <img src={iconChevronDown} alt="" className="auth-page__country-icon" />
                  </span>
                  <input
                    id="auth-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    className="auth-page__phone-input"
                    placeholder="98765 43210"
                    value={formatPhone(phone)}
                    onChange={handlePhoneChange}
                    disabled={busy === 'send'}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'auth-phone-error' : undefined}
                  />
                </div>
                {error && (
                  <p id="auth-phone-error" className="auth-page__error" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" className="auth-page__submit" disabled={!phoneValid || Boolean(busy)}>
                {busy === 'send' ? 'Sending OTP…' : 'Send OTP'}
              </button>

              <p className="auth-page__footnote">
                By continuing, you agree to our <Link to="/terms" className="auth-page__footnote-link">Terms</Link> and{' '}
                <Link to="/privacy" className="auth-page__footnote-link">Privacy Policy</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form className="auth-page__form" onSubmit={handleVerify} noValidate>
              <button type="button" className="auth-page__back" onClick={handleBack} disabled={Boolean(busy)}>
                <img src={iconChevronLeft} alt="" className="auth-page__back-icon" />
                Back
              </button>

              <span className="auth-page__step-icon">
                <img src={iconPhone} alt="" className="auth-page__step-icon-img" />
              </span>

              <h2 className="auth-page__title auth-page__title--otp">Verify your phone</h2>
              <p className="auth-page__otp-hint">We sent a 6-digit OTP to</p>
              <p className="auth-page__otp-phone">+91 {formatPhone(phone)}</p>

              <div className="auth-page__otp" onPaste={handleOtpPaste(0)}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={OTP_LENGTH}
                    aria-label={`Digit ${i + 1}`}
                    aria-invalid={Boolean(error)}
                    className="auth-page__otp-box"
                    value={digit}
                    onChange={handleOtpChange(i)}
                    onKeyDown={handleOtpKeyDown(i)}
                    onPaste={handleOtpPaste(i)}
                    onFocus={(e) => e.target.select()}
                    disabled={busy === 'verify'}
                  />
                ))}
              </div>

              {devCode && <p className="auth-page__hint">Dev code: {devCode}</p>}

              {error && (
                <p className="auth-page__error auth-page__error--otp" role="alert">
                  {error}
                </p>
              )}

              <p className="auth-page__resend">
                Didn&apos;t receive?{' '}
                <button
                  type="button"
                  className="auth-page__resend-btn"
                  onClick={handleResend}
                  disabled={resendIn > 0 || Boolean(busy)}
                >
                  {busy === 'resend' ? 'Sending…' : `Resend OTP${resendIn > 0 ? ` in ${resendIn}s` : ''}`}
                </button>
              </p>

              <button type="submit" className="auth-page__submit" disabled={!otpValid || Boolean(busy)}>
                {busy === 'verify' ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form className="auth-page__form auth-page__form--birth" onSubmit={handleCreate} noValidate>
              <button type="button" className="auth-page__back" onClick={handleBack} disabled={Boolean(busy)}>
                <img src={iconChevronLeft} alt="" className="auth-page__back-icon" />
                Use another number
              </button>

              <div className="auth-page__birth-card">
                <h2 className="auth-page__birth-title">Enter Birth Details</h2>
                <p className="auth-page__birth-subtitle">Accurate details ensure precise predictions</p>
                {referralFromLink && referralCode && (
                  <p className="auth-page__referral" role="status">
                    <img src={iconCheck} alt="" className="auth-page__referral-icon" />
                    Referral code applied: <strong>{referralCode}</strong>
                  </p>
                )}

                <div className="auth-page__fields">
                  {BIRTH_FIELDS.map((f) => (
                    <div key={f.name} className="auth-page__group">
                      <label className="auth-page__field-label" htmlFor={`auth-${f.name}`}>
                        {f.label} <span className="auth-page__required">*</span>
                      </label>
                      <input
                        id={`auth-${f.name}`}
                        name={f.name}
                        type={f.type}
                        value={birth[f.name]}
                        onChange={handleBirthChange}
                        placeholder={f.placeholder}
                        autoComplete={f.autoComplete}
                        required
                        disabled={busy === 'create'}
                        aria-invalid={Boolean(fieldErrors[f.name])}
                        aria-describedby={fieldErrors[f.name] ? `auth-${f.name}-error` : undefined}
                        className={`auth-page__input${birth[f.name] === '' ? ' auth-page__input--empty' : ''}${
                          fieldErrors[f.name] ? ' auth-page__input--invalid' : ''
                        }`}
                      />
                      {fieldErrors[f.name] && (
                        <p id={`auth-${f.name}-error`} className="auth-page__field-error" role="alert">
                          {fieldErrors[f.name]}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="auth-page__group" role="radiogroup" aria-labelledby="auth-gender-label">
                    <span id="auth-gender-label" className="auth-page__field-label">
                      Gender
                    </span>
                    <div className="auth-page__radios">
                      {GENDERS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`auth-page__radio${birth.gender === opt.value ? ' auth-page__radio--checked' : ''}`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={opt.value}
                            checked={birth.gender === opt.value}
                            onChange={handleBirthChange}
                            disabled={busy === 'create'}
                            className="auth-page__radio-input"
                          />
                          <img
                            src={birth.gender === opt.value ? radioOn : radioOff}
                            alt=""
                            className="auth-page__radio-icon"
                          />
                          <span className="auth-page__radio-text">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.gender && (
                      <p className="auth-page__field-error" role="alert">
                        {fieldErrors.gender}
                      </p>
                    )}
                  </div>
                  <div className="auth-page__group auth-page__group--referral">
                    <label className="auth-page__field-label" htmlFor="auth-referral">
                      Referral code <span className="auth-page__optional">(optional)</span>
                    </label>
                    <input
                      id="auth-referral"
                      name="referralCode"
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                      placeholder="e.g. SA1B2C3D"
                      autoComplete="off"
                      className={`auth-page__input${referralCode === '' ? ' auth-page__input--empty' : ''}`}
                    />
                    <p className="auth-page__field-hint">Got a friend's code? Both of you earn a wallet reward after your first consultation.</p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="auth-page__error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="auth-page__submit" disabled={!birthValid || Boolean(busy)}>
                {busy === 'create' ? 'Creating your account…' : 'Create My Account'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
