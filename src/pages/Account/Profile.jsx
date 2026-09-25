import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import {
  ApiError,
  messageOf,
  titleCase,
  toApiDate,
  toInputDate,
  updateNotificationPrefs,
} from '../../api/index.js'
import editIcon from '../../assets/account/edit-icon.svg'
import { Avatar, ErrorState, Skeleton } from './accountUi.jsx'
import { initialOf } from './accountUtils.js'
import './Profile.css'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const PREFS = [
  { key: 'push', label: 'Push notifications', sub: 'Consultation and wallet alerts on this device' },
  { key: 'email', label: 'Email', sub: 'Receipts and important account updates' },
  { key: 'sms', label: 'SMS', sub: 'Text messages for session updates' },
  { key: 'whatsapp', label: 'WhatsApp', sub: 'Session reminders on WhatsApp' },
  { key: 'dailyHoroscope', label: 'Daily horoscope', sub: 'Your rashi reading every morning' },
  { key: 'promotions', label: 'Offers & promotions', sub: 'Discounts and festival specials' },
]

/** Form key → the field name the API reports errors under. */
const API_FIELD = {
  name: 'fullName',
  dob: 'dateOfBirth',
  tob: 'timeOfBirth',
  gender: 'gender',
  email: 'email',
  place: 'placeOfBirth',
  photo: 'photo',
}

function toForm(user) {
  const birth = user?.birthDetails ?? {}
  return {
    name: user?.name || birth.fullName || '',
    dob: toInputDate(birth.dateOfBirth),
    tob: birth.timeOfBirth || '',
    gender: (user?.gender || birth.gender || '').toLowerCase(),
    email: user?.email || '',
    place: birth.place?.formatted || '',
  }
}

/** Only what actually changed, in the shape `PATCH /users/me` expects. */
function diff(form, base, photo) {
  const changes = {}
  if (form.name.trim() && form.name.trim() !== base.name) changes.fullName = form.name.trim()
  if (form.email.trim() && form.email.trim().toLowerCase() !== base.email.toLowerCase()) {
    changes.email = form.email.trim().toLowerCase()
  }
  if (form.gender && form.gender !== base.gender) changes.gender = form.gender
  if (form.dob && form.dob !== base.dob) changes.dateOfBirth = toApiDate(form.dob)
  if (form.tob.trim() && form.tob.trim() !== base.tob) changes.timeOfBirth = form.tob.trim()
  if (form.place.trim() && form.place.trim() !== base.place) changes.placeOfBirth = form.place.trim()
  if (photo) changes.photo = photo
  return changes
}

function fieldErrorsOf(error) {
  if (!(error instanceof ApiError) || !error.fields) return {}
  const out = {}
  for (const [key, apiKey] of Object.entries(API_FIELD)) {
    if (error.fields[apiKey]) out[key] = error.fields[apiKey]
  }
  return out
}

function ProfileSkeleton() {
  return (
    <div className="account-profile">
      <section className="account-profile__card">
        <Skeleton style={{ width: 96, height: 96, borderRadius: '50%', flexShrink: 0 }} />
        <div className="account-profile__identity">
          <Skeleton style={{ width: '40%', height: 24 }} />
          <Skeleton style={{ width: '60%', height: 13, marginTop: 10 }} />
        </div>
      </section>
      <div className="account-profile__grid">
        {[0, 1].map((i) => (
          <section key={i} className="account-profile__section account-profile__skeleton-rows">
            <Skeleton style={{ width: '35%', height: 12 }} />
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </section>
        ))}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, loadingUser, refreshUser, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => toForm(user))
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!preview) return undefined
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  /* ------------------------------------------------- notification prefs */
  /** Local overrides on top of the server's prefs, so a toggle shows instantly and is dropped once `user` catches up. */
  const [overrides, setOverrides] = useState({})
  const [prefBusy, setPrefBusy] = useState('')
  const [prefError, setPrefError] = useState('')
  const prefs = { ...(user?.notificationPrefs ?? {}), ...overrides }

  const togglePref = async (key) => {
    if (prefBusy) return
    const next = !prefs[key]
    setOverrides((o) => ({ ...o, [key]: next }))
    setPrefBusy(key)
    setPrefError('')
    let keepOverride = false
    try {
      await updateNotificationPrefs({ [key]: next })
      try {
        await refreshUser()
      } catch {
        /* saved on the server; `user` is stale, so the override stays until the next refresh */
        keepOverride = true
      }
    } catch (err) {
      setPrefError(messageOf(err))
    } finally {
      if (!keepOverride) {
        setOverrides((o) => {
          const { [key]: _dropped, ...rest } = o
          return rest
        })
      }
      setPrefBusy('')
    }
  }

  if (loadingUser && !user) return <ProfileSkeleton />
  if (!user) {
    return (
      <div className="account-profile">
        <div className="account-page__head">
          <div>
            <h1 className="account-page__title">My Profile</h1>
          </div>
        </div>
        <div className="account-profile__error">
          <ErrorState message="We could not load your profile." onRetry={refreshUser} />
        </div>
      </div>
    )
  }

  const view = toForm(user)
  const zodiac = user.zodiac ?? {}
  const moonSign = zodiac.moonSign
  const sunSign = zodiac.sunSign
  const zodiacLabel = moonSign
    ? `${moonSign} (Moon)${sunSign ? ` · ${sunSign} (Sun)` : ''}`
    : sunSign
      ? `${sunSign} (Sun)`
      : ''

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er))
  }

  const startEdit = () => {
    setForm(toForm(user))
    setErrors({})
    setSaveError('')
    setSaved('')
    setEditing(true)
  }

  const cancel = () => {
    setForm(toForm(user))
    setErrors({})
    setSaveError('')
    setPhoto(null)
    setPreview('')
    setEditing(false)
  }

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((er) => ({ ...er, photo: 'Choose an image file.' }))
      return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setErrors((er) => ({ ...er, photo: undefined }))
  }

  const save = async (e) => {
    e.preventDefault()
    if (saving) return
    const changes = diff(form, view, photo)
    if (Object.keys(changes).length === 0) {
      setEditing(false)
      return
    }
    setSaving(true)
    setSaveError('')
    setErrors({})
    try {
      await updateProfile(changes)
      setSaved('Profile updated.')
      setPhoto(null)
      setPreview('')
      setEditing(false)
    } catch (err) {
      const fields = fieldErrorsOf(err)
      setErrors(fields)
      setSaveError(Object.keys(fields).length ? '' : messageOf(err))
    } finally {
      setSaving(false)
    }
  }

  const personal = [
    { key: 'name', label: 'Full Name', value: view.name, type: 'text', editable: true },
    { key: 'dob', label: 'Date of Birth', value: view.dob, type: 'date', editable: true },
    { key: 'tob', label: 'Time of Birth', value: view.tob, type: 'time', editable: true },
    { key: 'gender', label: 'Gender', value: titleCase(view.gender), type: 'select', editable: true },
    { key: 'zodiac', label: 'Zodiac Sign', value: zodiacLabel, type: 'text', editable: false, hint: 'Cast from your birth details' },
  ]

  const contact = [
    { key: 'phone', label: 'Phone', value: user.phone || '', type: 'tel', editable: false, hint: 'Sign-in number' },
    { key: 'email', label: 'Email', value: view.email, type: 'email', editable: true },
    { key: 'place', label: 'Place of Birth', value: view.place, type: 'text', editable: true },
    { key: 'code', label: 'User ID', value: user.userCode || '', type: 'text', editable: false },
  ]

  const renderField = (f) => {
    if (!editing || !f.editable) {
      return (
        <span className={`account-profile__value${f.value ? '' : ' account-profile__value--muted'}`}>
          {f.value || (f.editable ? 'Not set' : '—')}
        </span>
      )
    }
    const invalid = errors[f.key] ? ' account-profile__input--invalid' : ''
    return (
      <span className="account-profile__field">
        {f.type === 'select' ? (
          <select className={`account-profile__input${invalid}`} value={form[f.key]} onChange={set(f.key)} aria-label={f.label}>
            <option value="">Select</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={`account-profile__input${invalid}`}
            type={f.type}
            value={form[f.key]}
            onChange={set(f.key)}
            aria-label={f.label}
            aria-invalid={Boolean(errors[f.key])}
            placeholder={f.key === 'place' ? 'City, State' : undefined}
          />
        )}
        {errors[f.key] && <span className="account-profile__field-error">{errors[f.key]}</span>}
      </span>
    )
  }

  const avatarSrc = preview || user.avatarUrl

  return (
    <form className="account-profile" onSubmit={save}>
      <div className="account-page__head">
        <div>
          <h1 className="account-page__title">My Profile</h1>
          <p className="account-page__subtitle">Manage your personal information and preferences</p>
        </div>
      </div>

      <section className="account-profile__card">
        {editing ? (
          <button
            type="button"
            className="account-profile__avatar-btn"
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile photo"
          >
            <div className="account-profile__avatar">
              {avatarSrc ? <Avatar src={avatarSrc} name={view.name} /> : initialOf(view.name)}
            </div>
            <span className="account-profile__avatar-overlay">Change</span>
            <input
              ref={fileRef}
              className="account-profile__file"
              type="file"
              accept="image/*"
              onChange={pickPhoto}
              tabIndex={-1}
            />
          </button>
        ) : (
          <div className="account-profile__avatar">
            {avatarSrc ? <Avatar src={avatarSrc} name={view.name} /> : initialOf(view.name)}
          </div>
        )}
        <div className="account-profile__identity">
          <p className="account-profile__name">{view.name || 'Your name'}</p>
          <p className="account-profile__contact">
            {[view.email, user.phone].filter(Boolean).join(' · ')}
          </p>
          <div className="account-profile__chips">
            {moonSign && <span className="account-profile__chip">{moonSign}</span>}
            {user.birthDetails?.place?.city && (
              <span className="account-profile__chip">{user.birthDetails.place.city}</span>
            )}
            {user.userCode && <span className="account-profile__chip">{user.userCode}</span>}
            {user.profileComplete === false && (
              <span className="account-profile__chip">Profile incomplete</span>
            )}
          </div>
          {errors.photo && <p className="account-profile__field-error" style={{ textAlign: 'left', paddingTop: 6 }}>{errors.photo}</p>}
        </div>
        <div className="account-profile__actions">
          {editing ? (
            <>
              <button type="submit" className="account-profile__btn account-profile__btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="account-profile__btn account-profile__btn--ghost"
                onClick={cancel}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="account-profile__btn account-profile__btn--primary"
              onClick={startEdit}
            >
              <img src={editIcon} alt="" />
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {saveError && (
        <div className="account-profile__error">
          <ErrorState compact message={saveError} />
        </div>
      )}
      {saved && !editing && (
        <p className="account-profile__toast" role="status">
          {saved}
        </p>
      )}

      <div className="account-profile__grid">
        <section className="account-profile__section">
          <p className="account-profile__section-title">Personal Information</p>
          <ul className="account-profile__rows">
            {personal.map((f) => (
              <li key={f.key} className="account-profile__row">
                <span className="account-profile__label">{f.label}</span>
                {renderField(f)}
              </li>
            ))}
          </ul>
          {editing && (
            <p className="account-profile__hint">
              Changing your birth details recasts your rashi and kundli.
            </p>
          )}
        </section>

        <section className="account-profile__section">
          <p className="account-profile__section-title">Contact &amp; Birth Place</p>
          <ul className="account-profile__rows">
            {contact.map((f) => (
              <li key={f.key} className="account-profile__row">
                <span className="account-profile__label">{f.label}</span>
                {renderField(f)}
              </li>
            ))}
          </ul>
          {editing && (
            <p className="account-profile__hint">Your phone number is your sign-in and cannot be changed here.</p>
          )}
        </section>

        <section className="account-profile__section account-profile__section--wide">
          <p className="account-profile__section-title">Notification Preferences</p>
          <div className="account-profile__prefs">
            {PREFS.map((p) => {
              const on = Boolean(prefs[p.key])
              return (
                <button
                  key={p.key}
                  type="button"
                  className="account-profile__pref"
                  onClick={() => togglePref(p.key)}
                  disabled={prefBusy === p.key}
                  role="switch"
                  aria-checked={on}
                >
                  <span className="account-profile__pref-text">
                    <span className="account-profile__pref-label">{p.label}</span>
                    <br />
                    <span className="account-profile__pref-sub">{p.sub}</span>
                  </span>
                  <span className={`account-profile__switch${on ? ' account-profile__switch--on' : ''}`}>
                    <span className="account-profile__knob" />
                  </span>
                </button>
              )
            })}
            {prefError && (
              <p className="account-profile__pref-error" role="alert">
                {prefError}
              </p>
            )}
          </div>
        </section>
      </div>
    </form>
  )
}
