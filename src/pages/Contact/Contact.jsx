import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { fetchSettings, messageOf, raiseTicket } from '../../api/index.js'
import phoneIcon from '../../assets/pages/contact/phone-icon.svg'
import emailIcon from '../../assets/pages/contact/email-icon.svg'
import locationIcon from '../../assets/pages/contact/location-icon.svg'
import clockIcon from '../../assets/pages/contact/clock-icon.svg'
import submitArrow from '../../assets/pages/contact/submit-arrow.svg'
import linkArrow from '../../assets/pages/contact/link-arrow.svg'
import './Contact.css'

const FALLBACK_PHONE = '+91 1800-XXX-XXXX'
const FALLBACK_EMAIL = 'support@shreeastro.com'

const telHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`

function infoCards({ supportPhone, supportEmail }) {
  const phone = supportPhone || FALLBACK_PHONE
  const email = supportEmail || FALLBACK_EMAIL
  return [
    {
      id: 'phone',
      icon: phoneIcon,
      label: 'PHONE SUPPORT',
      value: phone,
      sub: 'Toll-Free · Mon–Sat, 9 AM – 9 PM IST',
      href: telHref(phone),
    },
    {
      id: 'email',
      icon: emailIcon,
      label: 'EMAIL SUPPORT',
      value: email,
      sub: 'Response within 24 hours',
      href: `mailto:${email}`,
    },
    {
      id: 'address',
      icon: locationIcon,
      label: 'OFFICE ADDRESS',
      value: '4th Floor, Prestige Tower',
      sub: 'MG Road, Bengaluru – 560001',
    },
    {
      id: 'hours',
      icon: clockIcon,
      label: 'SUPPORT HOURS',
      value: 'Mon – Saturday',
      sub: '9:00 AM – 9:00 PM IST',
    },
  ]
}

const QUICK_HELP = [
  { label: 'Wallet & Payments', to: '/account/wallet' },
  { label: 'Refund Policy', to: '/refund' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Support Center', to: '/support' },
]

const MIN_MESSAGE = 10

/** `name`/`email` stay null until edited, so the signed-in account's values show through. */
const EMPTY_FORM = { name: null, email: null, subject: '', message: '' }

export default function Contact() {
  const { isLoggedIn, user } = useAuth()
  const [settings, setSettings] = useState({})
  const [form, setForm] = useState(EMPTY_FORM)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    let active = true
    fetchSettings()
      .then((data) => active && setSettings(data || {}))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const name = form.name ?? user?.name ?? ''
  const email = form.email ?? user?.email ?? ''

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const message = form.message.trim()
    if (!name.trim() || !email.trim()) {
      setError('Please fill in your name and email address.')
      return
    }
    if (message.length < MIN_MESSAGE) {
      setError(`Please describe your question in at least ${MIN_MESSAGE} characters.`)
      return
    }
    const subject = form.subject.trim()
    const description = subject ? `${subject}\n\n${message}` : message

    setSending(true)
    setError('')
    try {
      const created = await raiseTicket('other', description)
      setTicket(created)
    } catch (err) {
      setError(messageOf(err, 'Could not send your message. Please try again.'))
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setForm(EMPTY_FORM)
    setTicket(null)
    setError('')
  }

  return (
    <div className="contact-page">
      <div className="contact-page__inner">
        <header className="contact-page__head">
          <span className="contact-page__pill">CONTACT US</span>
          <h1 className="contact-page__title">We're Here to Help</h1>
          <p className="contact-page__subtitle">
            Have a question, concern, or feedback? Reach out to us and our team will get back to you
            as soon as possible.
          </p>
        </header>

        <div className="contact-page__cards">
          {infoCards(settings).map((c) => (
            <article key={c.id} className="contact-card">
              <div className="contact-card__tile">
                <img src={c.icon} alt="" className="contact-card__icon" />
              </div>
              <p className="contact-card__label">{c.label}</p>
              {c.href ? (
                <a href={c.href} className="contact-card__value contact-card__value--link">
                  {c.value}
                </a>
              ) : (
                <p className="contact-card__value">{c.value}</p>
              )}
              <p className="contact-card__sub">{c.sub}</p>
            </article>
          ))}
        </div>

        <div className="contact-page__columns">
          <section className="contact-form" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title" className="contact-form__title">
              Send us a message
            </h2>

            {!isLoggedIn ? (
              <div className="contact-form__signin" role="note">
                <p className="contact-form__signin-title">Sign in to send us a message</p>
                <p className="contact-form__signin-text">
                  Messages are tracked as support tickets on your account so you can follow up on the reply. You can also
                  email us directly at{' '}
                  <a href={`mailto:${settings.supportEmail || FALLBACK_EMAIL}`}>{settings.supportEmail || FALLBACK_EMAIL}</a>.
                </p>
                <Link to="/login" state={{ from: '/contact' }} className="contact-form__submit">
                  Sign in to continue
                  <img src={submitArrow} alt="" className="contact-form__submit-icon" />
                </Link>
              </div>
            ) : ticket ? (
              <div className="contact-form__success" role="status">
                <p className="contact-form__success-title">Message sent!</p>
                <p className="contact-form__success-text">
                  Thanks, {name.trim()}. Your ticket reference is <strong>{ticket.reference}</strong>. We&apos;ll reply
                  within 24 hours — you can track it under Support.
                </p>
                <button type="button" className="contact-form__again" onClick={reset}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form__form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form__row">
                  <label className="contact-form__field">
                    <span className="contact-form__label">Full Name *</span>
                    <input
                      type="text"
                      className="contact-form__input"
                      placeholder="Your name"
                      value={name}
                      onChange={update('name')}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label className="contact-form__field">
                    <span className="contact-form__label">Email Address *</span>
                    <input
                      type="email"
                      className="contact-form__input"
                      placeholder="your@email.com"
                      value={email}
                      onChange={update('email')}
                      autoComplete="email"
                      required
                    />
                  </label>
                </div>
                <label className="contact-form__field">
                  <span className="contact-form__label">Subject</span>
                  <input
                    type="text"
                    className="contact-form__input"
                    placeholder="How can we help you?"
                    value={form.subject}
                    onChange={update('subject')}
                  />
                </label>
                <label className="contact-form__field">
                  <span className="contact-form__label">Message *</span>
                  <textarea
                    className="contact-form__input contact-form__textarea"
                    placeholder="Please describe your question or concern in detail…"
                    value={form.message}
                    onChange={update('message')}
                    required
                  />
                </label>
                {error && (
                  <p className="contact-form__error" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="contact-form__submit" disabled={sending}>
                  {sending ? 'Sending…' : 'Submit'}
                  <img src={submitArrow} alt="" className="contact-form__submit-icon" />
                </button>
              </form>
            )}
          </section>

          <aside className="contact-side">
            <div className="contact-help">
              <h3 className="contact-help__title">Quick Help</h3>
              <ul className="contact-help__list">
                {QUICK_HELP.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="contact-help__item">
                      {l.label}
                      <img src={linkArrow} alt="" className="contact-help__arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="contact-astro">
              <p className="contact-astro__eyebrow">AVAILABLE 24/7</p>
              <h3 className="contact-astro__title">Chat with an Astrologer</h3>
              <p className="contact-astro__desc">
                Connect directly with our expert astrologers for personalised guidance anytime.
              </p>
              <Link to="/astrologers" className="contact-astro__btn">
                Talk to an Astrologer
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
