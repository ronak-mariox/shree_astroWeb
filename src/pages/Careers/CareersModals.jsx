import { useEffect, useId, useState } from 'react'
import { messageOf, submitApplication } from '../../api/index.js'
import modalStar from '../../assets/pages/careers/modal-star.svg'
import modalCheck from '../../assets/pages/careers/modal-check.svg'
import modalClose from '../../assets/pages/careers/modal-close.svg'
import modalChevron from '../../assets/pages/careers/modal-chevron.svg'
import modalUpload from '../../assets/pages/careers/modal-upload.svg'
import modalSend from '../../assets/pages/careers/modal-send.svg'
import modalCheckCircle from '../../assets/pages/careers/modal-check-circle.svg'
import './CareersModals.css'

const ASTROLOGER_PERKS = [
  { title: '3-stage verification process', text: 'Your credibility is protected' },
  { title: 'Set your own rates & availability', text: 'Full flexibility, no lock-in' },
  { title: 'Average astrologer earns ₹80K/mo', text: 'Top earners cross ₹3L/mo' },
  { title: 'Dedicated astrologer support team', text: 'We handle tech so you focus on practice' },
]

const EXPERIENCE_OPTIONS = ['0–1 years', '1–2 years', '3–5 years', '5–8 years', '8+ years']

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  experience: '1–2 years',
  url: '',
  why: '',
}

const RESUME_MAX_BYTES = 5 * 1024 * 1024
const RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

/** '' when the file is acceptable, otherwise the message to show. */
function resumeProblem(file) {
  if (!file) return ''
  const ext = /\.(pdf|docx?)$/i.test(file.name || '')
  if (!ext && !RESUME_TYPES.has(file.type)) return 'Please upload a PDF, DOC or DOCX file.'
  if (file.size > RESUME_MAX_BYTES) return 'Resume must be 5 MB or smaller.'
  return ''
}

/** Server `fields` keys → the inputs in this form. */
const FIELD_KEYS = { fullName: 'name', email: 'email', phone: 'phone', experience: 'experience', linkedin: 'url', message: 'why', resume: 'resume' }

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

function useModalBehaviour(onClose) {
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
}

function Overlay({ onClose, children }) {
  return (
    <div
      className="careers-modal__overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      {children}
    </div>
  )
}

export function JoinAstrologerModal({ onClose, onApply }) {
  const titleId = useId()
  useModalBehaviour(onClose)

  return (
    <Overlay onClose={onClose}>
      <div className="careers-modal careers-modal--join" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <span className="careers-modal__hero-icon">
          <img src={modalStar} alt="" />
        </span>
        <h2 className="careers-modal__join-title" id={titleId}>
          Join as an Astrologer
        </h2>
        <p className="careers-modal__join-text">
          Are you a verified Jyotish practitioner? Join 2,000+ astrologers earning on Shree Astro. Our
          vetting process ensures quality — and your reputation.
        </p>
        <ul className="careers-modal__perks">
          {ASTROLOGER_PERKS.map((p) => (
            <li key={p.title} className="careers-modal__perk">
              <img src={modalCheck} alt="" />
              <span>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="careers-modal__submit careers-modal__submit--join" onClick={onApply}>
          Apply as Astrologer
        </button>
      </div>
    </Overlay>
  )
}

export function ApplyModal({ role, onClose, onSubmit }) {
  const titleId = useId()
  const fileId = useId()
  const [form, setForm] = useState(EMPTY_FORM)
  const [resume, setResume] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  useModalBehaviour(onClose)

  const setField = (key) => (e) => {
    const { value } = e.target
    setForm((f) => ({ ...f, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    if (error) setError('')
  }

  const pickResume = (e) => {
    const file = e.target.files?.[0] ?? null
    const problem = resumeProblem(file)
    setResumeError(problem)
    setResume(problem ? null : file)
    if (problem) e.target.value = ''
  }

  const valid = form.name.trim().length > 0 && isValidEmail(form.email) && isValidPhone(form.phone) && !resumeError

  const submit = async (e) => {
    e.preventDefault()
    if (!valid || sending) return
    setSending(true)
    setError('')
    setFieldErrors({})
    try {
      const application = await submitApplication({
        jobId: role.jobId || undefined,
        kind: role.kind || 'job',
        roleTitle: role.title,
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''),
        experience: form.experience,
        linkedin: form.url.trim() || undefined,
        message: form.why.trim() || undefined,
        resume: resume || undefined,
      })
      onSubmit?.(application)
    } catch (err) {
      const fields = err?.fields && typeof err.fields === 'object' ? err.fields : {}
      const mapped = {}
      Object.entries(fields).forEach(([key, message]) => {
        if (FIELD_KEYS[key]) mapped[FIELD_KEYS[key]] = String(message)
      })
      setFieldErrors(mapped)
      if (mapped.resume) setResumeError(mapped.resume)
      const wait = err?.status === 429 ? Number(err.retryAfterSeconds) : 0
      setError(
        Object.keys(mapped).length > 0 && !mapped.resume
          ? 'Please check the highlighted fields.'
          : `${messageOf(err, 'Could not send your application.')}${wait > 0 ? ` Try again in ${wait}s.` : ''}`,
      )
    } finally {
      setSending(false)
    }
  }

  const invalid = (key) => (fieldErrors[key] ? ' careers-modal__input--invalid' : '')

  return (
    <Overlay onClose={onClose}>
      <form
        className="careers-modal careers-modal--apply"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
      >
        <div className="careers-modal__head">
          <div>
            <h2 className="careers-modal__title" id={titleId}>
              Apply Now
            </h2>
            <div className="careers-modal__role">
              <span className="careers-modal__role-dept">{role.department}</span>
              <span className="careers-modal__role-title">{role.title}</span>
            </div>
          </div>
          <button type="button" className="careers-modal__close" onClick={onClose} aria-label="Close">
            <img className="icon-ink" src={modalClose} alt="" />
          </button>
        </div>

        <div className="careers-modal__fields">
          <div className="careers-modal__row">
            <label className="careers-modal__field">
              <span className="careers-modal__label">Full Name</span>
              <input
                className={`careers-modal__input${invalid('name')}`}
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your full name"
                value={form.name}
                onChange={setField('name')}
                disabled={sending}
              />
              {fieldErrors.name && <span className="careers-modal__field-error">{fieldErrors.name}</span>}
            </label>
            <label className="careers-modal__field">
              <span className="careers-modal__label">Email</span>
              <input
                className={`careers-modal__input${invalid('email')}`}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={setField('email')}
                disabled={sending}
              />
              {fieldErrors.email && <span className="careers-modal__field-error">{fieldErrors.email}</span>}
            </label>
          </div>
          <div className="careers-modal__row">
            <label className="careers-modal__field">
              <span className="careers-modal__label">Phone</span>
              <input
                className={`careers-modal__input${invalid('phone')}`}
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={setField('phone')}
                disabled={sending}
              />
              {fieldErrors.phone && <span className="careers-modal__field-error">{fieldErrors.phone}</span>}
            </label>
            <label className="careers-modal__field">
              <span className="careers-modal__label">Years of Experience</span>
              <span className="careers-modal__select-wrap">
                <select
                  className="careers-modal__input careers-modal__select"
                  name="experience"
                  value={form.experience}
                  onChange={setField('experience')}
                  disabled={sending}
                >
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <img className="careers-modal__select-icon icon-ink" src={modalChevron} alt="" />
              </span>
            </label>
          </div>
          <label className="careers-modal__field">
            <span className="careers-modal__label">LinkedIn / Portfolio URL</span>
            <input
              className={`careers-modal__input${invalid('url')}`}
              type="url"
              name="url"
              placeholder="linkedin.com/in/yourname"
              value={form.url}
              onChange={setField('url')}
              disabled={sending}
            />
            {fieldErrors.url && <span className="careers-modal__field-error">{fieldErrors.url}</span>}
          </label>
          <label className="careers-modal__field">
            <span className="careers-modal__label">Why do you want to join Shree Astro?</span>
            <textarea
              className="careers-modal__input careers-modal__textarea"
              name="why"
              placeholder="Tell us what excites you about this role..."
              value={form.why}
              onChange={setField('why')}
              disabled={sending}
            />
          </label>
          <label
            className={`careers-modal__upload${resume ? ' careers-modal__upload--filled' : ''}${resumeError ? ' careers-modal__upload--invalid' : ''}`}
            htmlFor={fileId}
          >
            <input
              id={fileId}
              className="careers-modal__file"
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={pickResume}
              disabled={sending}
            />
            <img src={modalUpload} alt="" />
            <span className="careers-modal__upload-text">
              {resume ? (
                <strong>{resume.name}</strong>
              ) : (
                <>
                  Upload Resume <strong>Browse</strong>
                </>
              )}
            </span>
            <span className={`careers-modal__upload-hint${resumeError ? ' careers-modal__upload-hint--error' : ''}`}>
              {resumeError || (resume ? 'Click to choose a different file' : 'PDF, DOC or DOCX, max 5 MB')}
            </span>
          </label>
        </div>

        {error && (
          <p className="careers-modal__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="careers-modal__submit careers-modal__submit--apply" disabled={!valid || sending}>
          <img src={modalSend} alt="" />
          {sending ? 'Sending…' : 'Submit Application'}
        </button>
      </form>
    </Overlay>
  )
}

export function ApplicationSentModal({ role, application, onClose }) {
  const titleId = useId()
  useModalBehaviour(onClose)

  return (
    <Overlay onClose={onClose}>
      <div className="careers-modal careers-modal--sent" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <span className="careers-modal__sent-icon">
          <img src={modalCheckCircle} alt="" />
        </span>
        <h3 className="careers-modal__sent-title" id={titleId}>
          Application Sent!
        </h3>
        <p className="careers-modal__sent-text">
          Your application for <strong>{application?.roleTitle || role.title}</strong> has been received.
        </p>
        {application?.reference && (
          <p className="careers-modal__sent-ref">
            Reference <strong>{application.reference}</strong>
          </p>
        )}
        <p className="careers-modal__sent-note">
          Our team will review your profile and reach out within 5 business days.
        </p>
        <button type="button" className="careers-modal__submit careers-modal__submit--done" onClick={onClose}>
          Done
        </button>
      </div>
    </Overlay>
  )
}
