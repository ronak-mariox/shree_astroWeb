import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { createBirthProfile, fetchCurrentKundli, messageOf, searchPlaces, toApiDate, toInputDate } from '../../api/index.js'
import iconBolt from '../../assets/pages/kundli/icon-bolt.svg'
import iconSparkle from '../../assets/pages/kundli/icon-sparkle.svg'
import './Kundli.css'

const FEATURES = [
  { icon: '⬡', title: 'Kundli Birth Chart', text: 'Complete North Indian chart with all 12 houses' },
  { icon: '♥', title: 'Kundli Matching', text: 'Ashtkoot Gun Milan for marriage compatibility' },
  { icon: '♂', title: 'Mangal Dosha', text: 'Full Mangal Dosha analysis with remedies' },
  { icon: '♄', title: 'Sade Sati Report', text: 'Saturn transit timeline and impact analysis' },
  { icon: '◎', title: 'Mahadasha', text: 'Current and upcoming planetary period analysis' },
  { icon: '◆', title: 'Career Analysis', text: 'Planetary influence on career and profession' },
  { icon: '₹', title: 'Finance Analysis', text: 'Wealth yoga and financial opportunity periods' },
  { icon: '♥', title: 'Health Insights', text: 'Constitution analysis and health precautions' },
  { icon: '⚭', title: 'Marriage Timing', text: 'Auspicious marriage periods and spouse traits' },
  { icon: '7', title: 'Lucky Elements', text: 'Numbers, colors, gemstones & favorable directions' },
]

const GENDERS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const SEARCH_DEBOUNCE_MS = 300
const MIN_PLACE_QUERY = 3

function prefillFrom(user) {
  const details = user?.birthDetails || {}
  return {
    name: details.fullName || user?.name || '',
    gender: details.gender || '',
    dob: toInputDate(details.dateOfBirth),
    tob: details.timeOfBirth || '',
    place: details.place?.formatted || '',
    placeId: '',
  }
}

function validate(form) {
  const errors = {}
  if (form.name.trim().length < 2) errors.name = 'Please enter your full name'
  if (!form.dob) errors.dob = 'Please select your date of birth'
  if (!form.tob) errors.tob = 'Please select your time of birth'
  if (!form.place.trim()) errors.place = 'Please enter your place of birth'
  else if (!form.placeId) errors.place = 'Pick a place from the list'
  return errors
}

const inputClass = (value, error) =>
  `kundli-page__input${value === '' ? ' kundli-page__input--empty' : ''}${error ? ' kundli-page__input--error' : ''}`

/** The birth-details form. Mounted with a `key` of the user id so the prefill happens in the state initialiser. */
function BirthForm({ user, saved, refreshUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => prefillFrom(user))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const searchSeq = useRef(0)

  /** The place text the account already holds — resolved silently to a place id when the search returns an exact match. */
  const prefilledPlace = user?.birthDetails?.place?.formatted || ''

  // Debounced place search while typing (only until a place has been picked).
  useEffect(() => {
    if (form.placeId) return undefined
    const q = form.place.trim()
    if (q.length < MIN_PLACE_QUERY) return undefined
    const seq = ++searchSeq.current
    const timer = setTimeout(() => {
      setSearching(true)
      searchPlaces(q)
        .then((items) => {
          if (seq !== searchSeq.current) return
          const exact = q === prefilledPlace ? items.find((item) => item.formatted === q) : null
          if (exact) {
            setForm((prev) => (prev.place === q ? { ...prev, placeId: exact.id } : prev))
            setSuggestions([])
            setListOpen(false)
          } else {
            setSuggestions(items)
            setHighlight(-1)
            setListOpen(true)
          }
        })
        .catch(() => {
          if (seq === searchSeq.current) setSuggestions([])
        })
        .finally(() => {
          if (seq === searchSeq.current) setSearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [form.place, form.placeId, prefilledPlace])

  const update = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const updatePlace = (e) => {
    const { value } = e.target
    setForm((prev) => ({ ...prev, place: value, placeId: '' }))
    if (value.trim().length < MIN_PLACE_QUERY) {
      setSuggestions([])
      setListOpen(false)
    }
    if (errors.place) setErrors((prev) => ({ ...prev, place: '' }))
  }

  const pickPlace = (item) => {
    searchSeq.current += 1
    setForm((prev) => ({ ...prev, place: item.formatted, placeId: item.id }))
    setSuggestions([])
    setListOpen(false)
    setHighlight(-1)
    setSearching(false)
    setErrors((prev) => ({ ...prev, place: '' }))
  }

  const onPlaceKeyDown = (e) => {
    if (!listOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1))
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault()
      pickPlace(suggestions[highlight])
    } else if (e.key === 'Escape') {
      setListOpen(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    setSubmitError('')
    try {
      const name = form.name.trim()
      const result = await createBirthProfile({
        fullName: name,
        ...(form.gender ? { gender: form.gender } : {}),
        dateOfBirth: toApiDate(form.dob),
        timeOfBirth: form.tob,
        placeId: form.placeId,
      })
      /** The account's birth details were just synced server-side — refresh so the form and report pick up the new ones, not the old cached user. */
      await refreshUser?.().catch(() => null)
      navigate(`/kundli/report?profile=${encodeURIComponent(result.id)}`, { state: { name } })
    } catch (error) {
      if (error?.fields) {
        setErrors({
          name: error.fields.fullName || '',
          dob: error.fields.dateOfBirth || '',
          tob: error.fields.timeOfBirth || '',
          place: error.fields.placeId || '',
        })
      }
      setSubmitError(messageOf(error, 'Could not generate your kundli. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const showList = listOpen && !form.placeId && suggestions.length > 0

  return (
    <form className="kundli-page__card" onSubmit={handleSubmit} noValidate>
      <h2 className="kundli-page__card-title">Enter Birth Details</h2>
      <p className="kundli-page__card-subtitle">Accurate details ensure precise predictions</p>

      {saved && (
        <div className="kundli-page__saved" role="status">
          <span>You already have a kundli for these birth details.</span>
          <Link to={`/kundli/report?profile=${encodeURIComponent(saved.profileId)}`} className="kundli-page__saved-link">
            View your saved kundli →
          </Link>
        </div>
      )}

      <div className="kundli-page__fields">
        <div className="kundli-page__group">
          <label className="kundli-page__label" htmlFor="kundli-name">
            Full Name <span className="kundli-page__required">*</span>
          </label>
          <input
            id="kundli-name"
            name="name"
            type="text"
            value={form.name}
            onChange={update}
            placeholder="Enter your full name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={inputClass(form.name, errors.name)}
          />
          {errors.name && <p className="kundli-page__error">{errors.name}</p>}
        </div>

        <div className="kundli-page__group">
          <label className="kundli-page__label" htmlFor="kundli-gender">
            Gender
          </label>
          <select
            id="kundli-gender"
            name="gender"
            value={form.gender}
            onChange={update}
            className={`${inputClass(form.gender, '')} kundli-page__select`}
          >
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="kundli-page__group">
          <label className="kundli-page__label" htmlFor="kundli-dob">
            Date of Birth <span className="kundli-page__required">*</span>
          </label>
          <input
            id="kundli-dob"
            name="dob"
            type="date"
            value={form.dob}
            onChange={update}
            placeholder="DD/MM/YYYY"
            max={new Date().toISOString().slice(0, 10)}
            aria-invalid={Boolean(errors.dob)}
            className={inputClass(form.dob, errors.dob)}
          />
          {errors.dob && <p className="kundli-page__error">{errors.dob}</p>}
        </div>

        <div className="kundli-page__group">
          <label className="kundli-page__label" htmlFor="kundli-tob">
            Time of Birth <span className="kundli-page__required">*</span>
          </label>
          <input
            id="kundli-tob"
            name="tob"
            type="time"
            value={form.tob}
            onChange={update}
            placeholder="-- : -- --"
            aria-invalid={Boolean(errors.tob)}
            className={inputClass(form.tob, errors.tob)}
          />
          {errors.tob && <p className="kundli-page__error">{errors.tob}</p>}
        </div>

        <div className="kundli-page__group kundli-page__group--place">
          <label className="kundli-page__label" htmlFor="kundli-place">
            Place of Birth <span className="kundli-page__required">*</span>
          </label>
          <input
            id="kundli-place"
            name="place"
            type="text"
            value={form.place}
            onChange={updatePlace}
            onFocus={() => suggestions.length > 0 && setListOpen(true)}
            onBlur={() => setTimeout(() => setListOpen(false), 150)}
            onKeyDown={onPlaceKeyDown}
            placeholder="City, State, Country"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls="kundli-place-list"
            aria-autocomplete="list"
            aria-invalid={Boolean(errors.place)}
            className={inputClass(form.place, errors.place)}
          />
          {form.placeId && (
            <span className="kundli-page__place-check" aria-hidden="true">
              ✓
            </span>
          )}
          {searching && !form.placeId && <span className="kundli-page__place-hint">Searching…</span>}
          {showList && (
            <ul id="kundli-place-list" className="kundli-page__suggestions" role="listbox">
              {suggestions.map((item, i) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={i === highlight}
                  className={`kundli-page__suggestion${i === highlight ? ' kundli-page__suggestion--active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickPlace(item)}
                >
                  {item.formatted}
                </li>
              ))}
            </ul>
          )}
          {errors.place && <p className="kundli-page__error">{errors.place}</p>}
        </div>

        {submitError && (
          <p className="kundli-page__error kundli-page__error--submit" role="alert">
            {submitError}
          </p>
        )}

        <button type="submit" className="kundli-page__submit" disabled={submitting}>
          <img src={iconSparkle} alt="" className="kundli-page__submit-icon" />
          {submitting ? 'Generating your kundli…' : 'Generate Free Kundli'}
        </button>
      </div>
    </form>
  )
}

export default function Kundli() {
  const { isLoggedIn, user, refreshUser } = useAuth()
  const [saved, setSaved] = useState(null)

  // Is there already a generated kundli for the account's current birth details?
  useEffect(() => {
    if (!isLoggedIn) return undefined
    let active = true
    fetchCurrentKundli()
      .then((result) => {
        if (active && result?.found) setSaved(result)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isLoggedIn])

  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/kundli' }} />

  return (
    <section className="kundli-page">
      <div className="kundli-page__hero">
        <div className="container">
          <div className="kundli-page__hero-inner">
            <span className="kundli-page__pill">
              <img src={iconBolt} alt="" className="kundli-page__pill-icon" />
              100% Free
            </span>
            <h1 className="kundli-page__title">
              Free <span className="kundli-page__title-accent">Kundli</span> Generator
            </h1>
            <p className="kundli-page__subtitle">
              Generate your detailed Vedic birth chart with planetary positions, Dasha analysis, and life predictions — completely free.
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="kundli-page__body">
          {/* Re-mounted when the profile arrives so the form initialises from the saved birth details. */}
          <BirthForm key={user?.id || 'loading'} user={user} saved={saved} refreshUser={refreshUser} />

          <div className="kundli-page__included">
            <h3 className="kundli-page__included-title">What&apos;s Included in Your Free Report</h3>
            <ul className="kundli-page__features">
              {FEATURES.map((f) => (
                <li key={f.title} className="kundli-page__feature">
                  <span className="kundli-page__feature-icon" aria-hidden="true">
                    {f.icon}
                  </span>
                  <div className="kundli-page__feature-body">
                    <p className="kundli-page__feature-title">{f.title}</p>
                    <p className="kundli-page__feature-text">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
