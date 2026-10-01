import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import RechargeModal from '../../components/consult/RechargeModal.jsx'
import ProcessingModal from '../../components/consult/ProcessingModal.jsx'
import ConsultationTypePicker from '../../components/consult/ConsultationTypePicker.jsx'
import { PER_MINUTE, resolveQuotes, shortfallFor, toPackageBooking } from '../../data/consultPackages.js'
import {
  ApiError,
  TOPICS,
  fetchAstrologer,
  fetchConsultations,
  fetchSettings,
  isPaymentCancelled,
  messageOf,
  payTopUp,
  precheckSession,
  requestChat,
  rupees,
  toApiDate,
} from '../../api/index.js'
import { useAuth } from '../../context/useAuth.js'
import { toAstrologerView } from '../Chat/useConsultation.js'
import ganeshaImg from '../../assets/pages/intake/ganesha.jpg'
import radioOn from '../../assets/pages/intake/radio-on.svg'
import radioOff from '../../assets/pages/intake/radio-off.svg'
import chevron from '../../assets/pages/intake/chevron.svg'
import './Intake.css'

const DATES = Array.from({ length: 31 }, (_, i) => String(i + 1))
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR - 1930 + 1 }, (_, i) => String(THIS_YEAR - i))
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const PERIODS = ['AM', 'PM']

const EMPTY_FORM = {
  name: '',
  gender: 'male',
  date: '',
  month: '',
  year: '',
  hour: '',
  minute: '',
  period: '',
  place: '',
  topic: '',
  question: '',
}

/** The account's own birth details → the form's fields (blank where unknown). */
function formFromBirthDetails(details) {
  if (!details) return {}
  const next = {}
  if (details.fullName) next.name = details.fullName
  if (details.gender === 'male' || details.gender === 'female') next.gender = details.gender
  if (details.dateOfBirth) {
    const d = new Date(details.dateOfBirth)
    if (!Number.isNaN(d.getTime())) {
      next.date = String(d.getUTCDate())
      next.month = MONTHS[d.getUTCMonth()]
      next.year = String(d.getUTCFullYear())
    }
  }
  const time = /^(\d{1,2}):(\d{2})/.exec(details.timeOfBirth || '')
  if (time && details.isBirthTimeKnown !== false) {
    const h24 = Number(time[1])
    next.hour = String(h24 % 12 === 0 ? 12 : h24 % 12)
    next.minute = time[2]
    next.period = h24 >= 12 ? 'PM' : 'AM'
  }
  const place = details.place?.formatted || details.place?.city || details.placeOfBirth
  if (place) next.place = place
  return next
}

const to24h = (hour, minute, period) => {
  let h = Number(hour) % 12
  if (period === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

const isoDate = (year, month, date) => `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`

function SelectField({ name, value, placeholder, options, onChange, ariaLabel }) {
  return (
    <div className="intake-field">
      <select
        name={name}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className={`intake-field__select${value === '' ? ' intake-field__select--placeholder' : ''}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <img src={chevron} alt="" className="intake-field__chevron icon-ink" />
    </div>
  )
}

export default function Intake() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: astrologerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn, user, refreshUser } = useAuth()

  const mode = searchParams.get('mode') === 'call' ? 'call' : 'chat'
  const isCall = mode === 'call'
  const modeWord = isCall ? 'Call' : 'Chat'

  const [tab, setTab] = useState('form')
  /** What the seeker typed, layered over the account's own birth details. */
  const [edits, setEdits] = useState({})
  const prefill = useMemo(() => formFromBirthDetails(user?.birthDetails), [user])
  const form = useMemo(() => ({ ...EMPTY_FORM, ...prefill, ...edits }), [prefill, edits])
  const [errors, setErrors] = useState({})
  const [activeDot, setActiveDot] = useState(0)

  const [astrologer, setAstrologer] = useState(null)
  const [precheck, setPrecheck] = useState(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [recharge, setRecharge] = useState(false)
  const [processingAmount, setProcessingAmount] = useState(0)
  /** Per-minute (default) or a fixed-length package — see data/consultPackages.js. */
  const [consultation, setConsultation] = useState(PER_MINUTE)

  const view = useMemo(() => toAstrologerView(astrologer, mode), [astrologer, mode])

  const runPrecheck = useCallback(async () => {
    try {
      const result = await precheckSession(astrologerId, mode)
      setPrecheck(result)
      setLoadError('')
      return result
    } catch (e) {
      setPrecheck(null)
      setLoadError(messageOf(e))
      return null
    }
  }, [astrologerId, mode])

  useEffect(() => {
    if (!isLoggedIn) return undefined
    let cancelled = false
    fetchAstrologer(astrologerId)
      .then((data) => !cancelled && setAstrologer(data))
      .catch((e) => !cancelled && setLoadError(messageOf(e)))
    precheckSession(astrologerId, mode)
      .then((result) => {
        if (cancelled) return
        setPrecheck(result)
        setLoadError('')
      })
      .catch((e) => {
        if (cancelled) return
        setPrecheck(null)
        setLoadError(messageOf(e))
      })
    if (isCall) {
      fetchSettings()
        .then((settings) => !cancelled && setVoiceEnabled(settings?.features?.voiceConsultations !== false))
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, astrologerId, mode, isCall])

  const savedKundlis = useMemo(() => {
    const details = user?.birthDetails
    if (!details?.dateOfBirth) return []
    const fields = formFromBirthDetails(details)
    return [
      {
        id: 'self',
        name: fields.name || user?.name || 'You',
        meta: `${fields.date} ${fields.month} ${fields.year}${fields.hour ? `, ${fields.hour}:${fields.minute} ${fields.period}` : ''}`,
        place: fields.place || '',
        details,
      },
    ]
  }, [user])

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  const update = (e) => {
    const { name, value } = e.target
    setEdits((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (submitError) setSubmitError(null)
  }

  const topicLabel = TOPICS.find((t) => t.value === form.topic)?.label ?? ''
  const timeKnown = Boolean(form.hour && form.minute && form.period)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Please enter your name'
    if (!form.date || !form.month || !form.year) nextErrors.dob = 'Please select your full date of birth'
    if ((form.hour || form.minute || form.period) && !timeKnown) nextErrors.tob = 'Please complete the time of birth, or leave it blank'
    if (!form.place.trim()) nextErrors.place = 'Please enter your place of birth'
    if (!form.topic) nextErrors.topic = 'Please choose a topic'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (precheck && !precheck.astrologerAvailable) return
    if (selectedConsultation.mode === 'package') {
      /** A package is charged in full on accept, so the wallet must cover it now. */
      if (packageShortfall > 0) {
        setRecharge(true)
        return
      }
    } else if (!precheck?.ok && precheck?.shortfallAmount > 0) {
      setRecharge(true)
      return
    }

    const dob = isoDate(form.year, form.month, form.date)
    const question = form.question.trim()
    const summary = [
      `Name: ${form.name.trim()}`,
      `Gender: ${form.gender === 'female' ? 'Female' : 'Male'}`,
      `Date of Birth: ${form.date} ${form.month} ${form.year}`,
      `Time of Birth: ${timeKnown ? `${form.hour}:${form.minute} ${form.period}` : 'Not known'}`,
      `Place of Birth: ${form.place.trim()}`,
      `Topic: ${topicLabel}`,
      question ? `Question: ${question}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const intake = {
      topic: form.topic,
      ...(question && { question }),
      summary,
      birthDetails: {
        fullName: form.name.trim(),
        gender: form.gender,
        dateOfBirth: toApiDate(dob),
        ...(timeKnown ? { timeOfBirth: to24h(form.hour, form.minute, form.period) } : { isBirthTimeKnown: false }),
        place: { formatted: form.place.trim() },
      },
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await requestChat(astrologerId, intake, mode, toPackageBooking(selectedConsultation))
      navigate(`/${mode}/${result.chatId}`, {
        state: {
          astrologer: view,
          ratePerMinute: result.ratePerMinute,
          requested: true,
          expiresInSeconds: result.expiresInSeconds,
          packageMinutes: result.packageMinutes ?? (selectedConsultation.mode === 'package' ? selectedConsultation.minutes : undefined),
          packagePrice: result.packagePrice ?? (selectedConsultation.mode === 'package' ? selectedConsultation.price : undefined),
        },
      })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'insufficient_balance') {
        const fresh = await runPrecheck()
        setSubmitError({ kind: 'balance', message: err.message, shortfall: err.details?.shortfallAmount ?? fresh?.shortfallAmount ?? 0 })
      } else if (err instanceof ApiError && err.code === 'price_changed') {
        /** The rate or discount changed since the form opened — show the real price and let the seeker confirm it. */
        const changed = err.details || {}
        if (changed.packageMinutes && changed.price != null) {
          setConsultation({ mode: 'package', minutes: changed.packageMinutes, price: changed.price })
        }
        await runPrecheck()
        setSubmitError({ kind: 'error', message: err.message })
      } else if (err instanceof ApiError && err.status === 409) {
        let openLink = '/account/appointments'
        const chatIdFromError = err.details?.chatId
        if (chatIdFromError) openLink = `/${err.details?.channel || mode}/${chatIdFromError}`
        else {
          try {
            const data = await fetchConsultations({ limit: 20 })
            const open = (data.items ?? []).find((row) => ['requested', 'active'].includes(row.status) && row.with?.id === astrologerId)
            if (open) openLink = `/${open.channel || 'chat'}/${open.id}`
          } catch {
            /* fall back to the appointments list */
          }
        }
        setSubmitError({ kind: 'conflict', message: 'You already have an open consultation with this astrologer.', link: openLink })
      } else {
        setSubmitError({ kind: 'error', message: messageOf(err) })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const proceedToPay = async (amount) => {
    setRecharge(false)
    setProcessingAmount(amount)
    try {
      await payTopUp({ amount })
      await Promise.all([runPrecheck(), refreshUser().catch(() => null)])
      setSubmitError(null)
    } catch (err) {
      if (isPaymentCancelled(err)) setSubmitError({ kind: 'notice', message: 'Payment cancelled.' })
      else setSubmitError({ kind: 'error', message: messageOf(err, 'Could not add money. Please try again.') })
    } finally {
      setProcessingAmount(0)
    }
  }

  const applyKundli = (details) => {
    setEdits((prev) => ({ ...prev, ...formFromBirthDetails(details) }))
    setErrors({})
    setTab('form')
  }

  const balance = precheck?.balance ?? user?.wallet?.balance ?? 0
  const rate = precheck?.ratePerMinute ?? view?.rate ?? 0
  /** Package quotes come from the precheck (priced server-side at the real rate, discounts applied). */
  const quotes = resolveQuotes(precheck?.packages, rate, precheck ? balance : undefined)
  const offersPackages = rate > 0 && quotes.length > 0
  /** A re-priced quote (a fresh precheck) replaces a stale selected price; no packages → per-minute. */
  const selectedQuote = consultation.mode === 'package' && offersPackages ? quotes.find((entry) => entry.minutes === consultation.minutes) : undefined
  const selectedConsultation = selectedQuote ? { mode: 'package', minutes: selectedQuote.minutes, price: selectedQuote.price } : PER_MINUTE
  const packageShortfall = selectedConsultation.mode === 'package' && precheck ? shortfallFor(selectedConsultation.price, balance) : 0
  const shortfall =
    submitError?.kind === 'balance'
      ? submitError.shortfall
      : selectedConsultation.mode === 'package'
        ? packageShortfall
        : precheck?.shortfallAmount ?? 0
  const unavailable = precheck && !precheck.astrologerAvailable
  const astroName = view?.name || 'Astrologer'
  const switchToChat = () => setSearchParams({ mode: 'chat' })

  const submitLabel = submitting
    ? 'Sending request…'
    : unavailable
      ? `${astroName} is not available right now`
      : shortfall > 0
        ? `Add ${rupees(shortfall)} to wallet`
        : selectedConsultation.mode === 'package'
          ? `Pay ${rupees(selectedConsultation.price)} & Connect with ${astroName}`
          : `Connect with ${astroName}`

  return (
    <section className="intake">
      <div className="container">
        <div className="intake__inner">
          <header className="intake__head">
            <h1 className="intake__title">{modeWord} Intake Form</h1>
            <p className="intake__subtitle">One-on-One {modeWord} With Skilled Astrologers</p>
          </header>

          {isCall && !voiceEnabled ? (
            <div className="intake-card intake-card--notice">
              <div className="intake-notice">
                <h2 className="intake-notice__title">Voice calls are coming soon on the web</h2>
                <p className="intake-notice__text">Start a chat with {astroName} instead — same astrologer, same wallet, billed per minute.</p>
                <button type="button" className="intake-form__submit intake-notice__btn" onClick={switchToChat}>
                  Start a chat instead
                </button>
              </div>
            </div>
          ) : (
            <div className="intake-card">
              <div className="intake-card__form">
                <div className="intake-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'form'}
                    className={`intake-tabs__tab${tab === 'form' ? ' intake-tabs__tab--active' : ''}`}
                    onClick={() => setTab('form')}
                  >
                    {modeWord} Intake Form
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'saved'}
                    className={`intake-tabs__tab${tab === 'saved' ? ' intake-tabs__tab--active' : ''}`}
                    onClick={() => setTab('saved')}
                  >
                    Saved Kundli
                  </button>
                  <span className={`intake-tabs__track${tab === 'saved' ? ' intake-tabs__track--right' : ''}`} />
                </div>

                <div className={`intake-precheck${precheck && !precheck.ok ? ' intake-precheck--short' : ''}`}>
                  <div className="intake-precheck__astro">
                    {view && <img className="intake-precheck__avatar" src={view.avatar} alt="" />}
                    <div>
                      <p className="intake-precheck__name">{astroName}</p>
                      <p className="intake-precheck__meta">
                        {precheck || view ? `${rupees(rate)}/min · ${modeWord}` : 'Loading…'}
                        {view && (
                          <>
                            {' · '}
                            <span className={view.online ? 'intake-precheck__online' : 'intake-precheck__offline'}>{view.online ? 'Online' : 'Offline'}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="intake-precheck__wallet">
                    <span className="intake-precheck__wallet-label">Wallet balance</span>
                    <span className="intake-precheck__wallet-amount">{precheck ? rupees(balance) : '—'}</span>
                  </div>
                  {precheck && !precheck.ok && (
                    <p className="intake-precheck__warn">
                      {unavailable
                        ? `${astroName} is not taking ${mode === 'call' ? 'calls' : 'chats'} right now. Please try again later or pick another astrologer.`
                        : `You need ${rupees(shortfall)} more to start (${rupees(rate)} for the first minute).`}
                      {!unavailable && shortfall > 0 && (
                        <button type="button" className="intake-precheck__add" onClick={() => setRecharge(true)}>
                          Add {rupees(shortfall)} to wallet
                        </button>
                      )}
                    </p>
                  )}
                  {loadError && <p className="intake-precheck__warn">{loadError}</p>}
                </div>

                {tab === 'form' ? (
                  <form className="intake-form" onSubmit={handleSubmit} noValidate>
                    <div className="intake-form__row intake-form__row--name">
                      <div className="intake-form__group">
                        <label className="intake-form__label" htmlFor="intake-name">
                          Name
                        </label>
                        <div className="intake-field intake-field--lg">
                          <input
                            id="intake-name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={update}
                            placeholder="Enter Your Name"
                            className="intake-field__input"
                          />
                        </div>
                        {errors.name && <p className="intake-form__error">{errors.name}</p>}
                      </div>

                      <div className="intake-form__group">
                        <span className="intake-form__label">Gender</span>
                        <div className="intake-radios">
                          {[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                          ].map((opt) => (
                            <label
                              key={opt.value}
                              className={`intake-radio${form.gender === opt.value ? ' intake-radio--checked' : ''}`}
                            >
                              <input
                                type="radio"
                                name="gender"
                                value={opt.value}
                                checked={form.gender === opt.value}
                                onChange={update}
                                className="intake-radio__input"
                              />
                              <img
                                src={form.gender === opt.value ? radioOn : radioOff}
                                alt=""
                                className="intake-radio__icon"
                              />
                              <span className="intake-radio__text">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="intake-form__group">
                      <span className="intake-form__label">Date of Birth</span>
                      <div className="intake-form__row intake-form__row--triple">
                        <SelectField name="date" value={form.date} placeholder="Date" options={DATES} onChange={update} ariaLabel="Date of birth: date" />
                        <SelectField name="month" value={form.month} placeholder="Month" options={MONTHS} onChange={update} ariaLabel="Date of birth: month" />
                        <SelectField name="year" value={form.year} placeholder="Year" options={YEARS} onChange={update} ariaLabel="Date of birth: year" />
                      </div>
                      {errors.dob && <p className="intake-form__error">{errors.dob}</p>}
                    </div>

                    <div className="intake-form__group">
                      <span className="intake-form__label">Time of Birth (optional)</span>
                      <div className="intake-form__row intake-form__row--triple">
                        <SelectField name="hour" value={form.hour} placeholder="Hour" options={HOURS} onChange={update} ariaLabel="Time of birth: hour" />
                        <SelectField name="minute" value={form.minute} placeholder="Min" options={MINUTES} onChange={update} ariaLabel="Time of birth: minute" />
                        <SelectField name="period" value={form.period} placeholder="AM" options={PERIODS} onChange={update} ariaLabel="Time of birth: AM or PM" />
                      </div>
                      {errors.tob && <p className="intake-form__error">{errors.tob}</p>}
                    </div>

                    <div className="intake-form__row intake-form__row--double">
                      <div className="intake-form__group">
                        <label className="intake-form__label" htmlFor="intake-place">
                          Place of Birth
                        </label>
                        <div className="intake-field intake-field--sm">
                          <input
                            id="intake-place"
                            name="place"
                            type="text"
                            value={form.place}
                            onChange={update}
                            placeholder="Enter your Place of Birth"
                            className="intake-field__input"
                          />
                        </div>
                        {errors.place && <p className="intake-form__error">{errors.place}</p>}
                      </div>

                      <div className="intake-form__group">
                        <span className="intake-form__label">Topic of Concern</span>
                        <div className="intake-field intake-field--sm">
                          <select
                            name="topic"
                            value={form.topic}
                            onChange={update}
                            aria-label="Topic of concern"
                            className={`intake-field__select${form.topic === '' ? ' intake-field__select--placeholder' : ''}`}
                          >
                            <option value="" disabled>
                              Select Topic of Concern
                            </option>
                            {TOPICS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          <img src={chevron} alt="" className="intake-field__chevron icon-ink" />
                        </div>
                        {errors.topic && <p className="intake-form__error">{errors.topic}</p>}
                      </div>
                    </div>

                    <div className="intake-form__group">
                      <label className="intake-form__label" htmlFor="intake-question">
                        Your question (optional)
                      </label>
                      <div className="intake-field intake-field--textarea">
                        <textarea
                          id="intake-question"
                          name="question"
                          value={form.question}
                          onChange={update}
                          maxLength={1000}
                          rows={3}
                          placeholder={`What would you like to ask ${astroName}?`}
                          className="intake-field__input intake-field__textarea"
                        />
                      </div>
                    </div>

                    {offersPackages && (
                      <div className="intake-form__consultation">
                        <ConsultationTypePicker
                          channel={mode}
                          ratePerMinute={rate}
                          quotes={quotes}
                          walletBalance={precheck ? balance : undefined}
                          value={selectedConsultation}
                          onChange={setConsultation}
                        />
                      </div>
                    )}

                    {submitError && (
                      <p
                        className={`intake-form__error intake-form__error--block${submitError.kind === 'notice' ? ' intake-form__error--quiet' : ''}`}
                        role={submitError.kind === 'notice' ? 'status' : 'alert'}
                      >
                        {submitError.message}{' '}
                        {submitError.kind === 'conflict' && (
                          <Link to={submitError.link} className="intake-form__error-link">
                            Open it
                          </Link>
                        )}
                        {submitError.kind === 'balance' && (
                          <button type="button" className="intake-form__error-link" onClick={() => setRecharge(true)}>
                            Add {rupees(submitError.shortfall)} to wallet
                          </button>
                        )}
                      </p>
                    )}

                    <button type="submit" className="intake-form__submit" disabled={submitting || unavailable || !precheck}>
                      {submitLabel}
                    </button>
                  </form>
                ) : (
                  <div className="intake-saved">
                    {savedKundlis.length ? (
                      <ul className="intake-saved__list">
                        {savedKundlis.map((k) => (
                          <li key={k.id} className="intake-saved__item">
                            <div className="intake-saved__info">
                              <p className="intake-saved__name">{k.name}</p>
                              <p className="intake-saved__meta">{k.meta}</p>
                              {k.place && <p className="intake-saved__meta">{k.place}</p>}
                            </div>
                            <button type="button" className="intake-saved__use" onClick={() => applyKundli(k.details)}>
                              Use
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="intake-saved__meta">
                        No saved kundli yet. Add your birth details in <Link to="/account/profile">your profile</Link> to reuse them here.
                      </p>
                    )}
                    <p className="intake-saved__hint">Select a saved kundli to fill the form automatically.</p>
                  </div>
                )}
              </div>

              <div className="intake-card__media">
                <img src={ganeshaImg} alt="Lord Ganesha writing on a manuscript" className="intake-card__image" />
                <div className="intake-dots" role="group" aria-label="Illustration slides">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      aria-pressed={activeDot === i}
                      className={`intake-dots__dot${activeDot === i ? ' intake-dots__dot--active' : ''}`}
                      onClick={() => setActiveDot(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {recharge && (
        <RechargeModal
          balance={balance}
          defaultAmount={Math.max(49, Math.ceil(Math.max(shortfall, rate * 5) / 50) * 50)}
          onClose={() => setRecharge(false)}
          onProceed={proceedToPay}
        />
      )}
      {processingAmount > 0 && <ProcessingModal amount={processingAmount} />}
    </section>
  )
}
