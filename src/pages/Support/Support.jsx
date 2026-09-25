import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { dateTime, digitsOf, fetchSettings, fetchTickets, messageOf, raiseTicket } from '../../api/index.js'
import SupportChat from './SupportChat.jsx'
import shieldIcon from '../../assets/pages/support/shield-icon.svg'
import searchIcon from '../../assets/pages/support/search-icon.svg'
import chatIcon from '../../assets/pages/support/chat-icon.svg'
import whatsappIcon from '../../assets/pages/support/whatsapp-icon.svg'
import emailIcon from '../../assets/pages/support/email-icon.svg'
import phoneIcon from '../../assets/pages/support/phone-icon.svg'
import chevronDown from '../../assets/pages/support/chevron-down.svg'
import zapIcon from '../../assets/pages/support/zap-icon.svg'
import zapIconWhite from '../../assets/pages/support/zap-icon-white.svg'
import linkArrow from '../../assets/pages/support/link-arrow.svg'
import './Support.css'

const FALLBACK_EMAIL = 'support@shreeastro.com'
const FALLBACK_PHONE = '1800-XXX-XXXX'

function channels({ supportEmail, supportPhone }) {
  const email = supportEmail || FALLBACK_EMAIL
  const phone = supportPhone || FALLBACK_PHONE
  const phoneDigits = digitsOf(supportPhone)
  const waNumber = phoneDigits ? (phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits) : '911800000000'
  return [
    {
      id: 'chat',
      icon: chatIcon,
      color: '245, 81, 2',
      title: 'Live Chat',
      desc: 'Chat with our team now. Average response time: 2 minutes.',
      cta: 'Start Chat',
      action: 'chat',
    },
    {
      id: 'whatsapp',
      icon: whatsappIcon,
      color: '34, 197, 94',
      title: 'WhatsApp Support',
      desc: 'Message us on WhatsApp. Available 6 AM – 11 PM daily.',
      cta: 'Open WhatsApp',
      href: `https://wa.me/${waNumber}`,
      external: true,
    },
    {
      id: 'email',
      icon: emailIcon,
      color: '59, 130, 246',
      title: 'Email Support',
      desc: `Write to ${email}. Response within 4 business hours.`,
      cta: 'Send Email',
      href: `mailto:${email}`,
    },
    {
      id: 'phone',
      icon: phoneIcon,
      color: '139, 92, 246',
      title: 'Phone Support',
      desc: `Call us toll-free: ${phone}. 8 AM – 10 PM daily.`,
      cta: 'Call Now',
      href: `tel:${supportPhone ? String(supportPhone).replace(/[^\d+]/g, '') : '1800XXXXXXX'}`,
    },
  ]
}

const FAQ_CATEGORIES = ['All', 'Account', 'Consultations', 'Payments', 'Store', 'Technical']

const FAQS = [
  {
    id: 1,
    category: 'Consultations',
    q: 'How does a consultation work on Shree Astro?',
    a: 'Pick an astrologer, choose chat or call, and share your birth details on the intake form. Your session starts instantly if the astrologer is online and is billed per minute from your wallet balance. A full transcript or call summary is saved in your account afterwards.',
  },
  {
    id: 2,
    category: 'Consultations',
    q: 'Is my first consultation really free?',
    a: 'Shree Astro does not offer free minutes. Every consultation is billed per minute at the rate shown on the astrologer profile, and you only need enough wallet balance for one minute to begin. Look out for cashback offers under Offers & Rewards to stretch your balance further.',
  },
  {
    id: 3,
    category: 'Consultations',
    q: 'How are astrologers verified on Shree Astro?',
    a: 'Each astrologer submits proof of formal training, a minimum of 5 years of practice, and government ID. They complete a live assessment with our panel before receiving the verified badge, and their rating is continuously reviewed.',
  },
  {
    id: 4,
    category: 'Payments',
    q: 'What payment methods are accepted?',
    a: 'UPI, credit and debit cards, net banking, and popular wallets are all accepted for recharging your Astro Wallet. International cards are supported with 3-D Secure verification.',
  },
  {
    id: 5,
    category: 'Payments',
    q: 'How do I get a refund?',
    a: 'If a session dropped or the astrologer did not respond, raise a ticket within 24 hours from Account → Appointments. Approved refunds are credited back to your wallet instantly, or to the original payment method within 5–7 business days on request.',
  },
  {
    id: 6,
    category: 'Consultations',
    q: 'Can I book an appointment in advance?',
    a: 'Yes. Open an astrologer profile and choose Book Appointment to pick a date and slot. You will receive a reminder 30 minutes before the session, and you can reschedule up to 2 hours in advance at no charge.',
  },
  {
    id: 7,
    category: 'Account',
    q: 'How is my chat or call history stored?',
    a: 'All chat transcripts and call summaries are encrypted and stored under Account → Appointments for your reference. Only you and the astrologer can view them, and you can request deletion at any time from your profile settings.',
  },
  {
    id: 8,
    category: 'Store',
    q: 'How do I track my Store order?',
    a: 'Go to Account → Orders to see live tracking for every Store purchase. You will also receive SMS and email updates when your order is packed, shipped, and delivered.',
  },
  {
    id: 9,
    category: 'Technical',
    q: 'Why is the app not loading?',
    a: 'First check your internet connection and refresh the page. If the issue continues, clear your browser cache or update the app to the latest version. Still stuck? Start a live chat and share your device and browser details.',
  },
  {
    id: 10,
    category: 'Account',
    q: 'How do I earn and redeem loyalty points?',
    a: 'You earn 10–12 points for every ₹10 spent on consultations and pujas. Points are visible under Account → Wallet and can be redeemed against future sessions once you have 500 points or more.',
  },
]

const QUICK_LINKS = [
  { label: 'Track my order', to: '/account/orders' },
  { label: 'Offers & Rewards', to: '/offers' },
  { label: 'Refund policy', to: '/refund' },
  { label: 'Privacy policy', to: '/privacy' },
  { label: 'Astrologer application', to: '/careers' },
]

const STATS = [
  { value: '< 2 min', label: 'Live chat response' },
  { value: '4 hrs', label: 'Ticket resolution' },
  { value: '99.2%', label: 'Satisfaction rate' },
  { value: '24 / 7', label: 'Support available' },
]

/** The backend's issue types, labelled for the form. */
const ISSUE_TYPES = [
  { value: 'astrologer', label: 'Astrologer or consultation' },
  { value: 'payment', label: 'Payment or wallet' },
  { value: 'puja', label: 'Puja booking' },
  { value: 'product', label: 'Store order or product' },
  { value: 'donation', label: 'Donation' },
  { value: 'other', label: 'Something else' },
]

const STATUS_LABELS = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' }

const MIN_DESCRIPTION = 10

const issueLabel = (value) => ISSUE_TYPES.find((t) => t.value === value)?.label || value

export default function Support() {
  const { isLoggedIn } = useAuth()
  const [settings, setSettings] = useState({})
  const [query, setQuery] = useState('')
  const [faqCategory, setFaqCategory] = useState('All')
  const [openId, setOpenId] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  const [ticketOpen, setTicketOpen] = useState(false)
  const [ticket, setTicket] = useState({ issueType: '', description: '' })
  const [ticketError, setTicketError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  const [tickets, setTickets] = useState({ status: 'idle', items: [] })

  useEffect(() => {
    let active = true
    fetchSettings()
      .then((data) => active && setSettings(data || {}))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return undefined
    let active = true
    fetchTickets()
      .then((data) => active && setTickets({ status: 'ready', items: data?.items ?? [] }))
      .catch((error) => active && setTickets({ status: 'error', items: [], error: messageOf(error) }))
    return () => {
      active = false
    }
  }, [isLoggedIn])

  const q = query.trim().toLowerCase()
  const faqs = FAQS.filter((f) => {
    if (faqCategory !== 'All' && f.category !== faqCategory) return false
    if (!q) return true
    return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
  })

  const submitTicket = async (e) => {
    e.preventDefault()
    const description = ticket.description.trim()
    if (!ticket.issueType) {
      setTicketError('Pick the kind of issue you are reporting.')
      return
    }
    if (description.length < MIN_DESCRIPTION) {
      setTicketError(`Describe the issue in at least ${MIN_DESCRIPTION} characters.`)
      return
    }
    setSubmitting(true)
    setTicketError('')
    try {
      const result = await raiseTicket(ticket.issueType, description)
      setCreated(result)
      setTickets((prev) => ({ status: 'ready', items: [result, ...prev.items] }))
      setTicket({ issueType: '', description: '' })
    } catch (error) {
      setTicketError(messageOf(error, 'Could not raise the ticket. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const startAnother = () => {
    setCreated(null)
    setTicketOpen(true)
  }

  return (
    <div className="support-page">
      <section className="support-page__hero">
        <div className="support-page__inner">
          <span className="support-page__pill">
            <img src={shieldIcon} alt="" className="support-page__pill-icon icon-ink" />
            Always Here for You
          </span>
          <h1 className="support-page__title">
            Shree Astro <span className="support-page__title-accent">Support Center</span>
          </h1>
          <p className="support-page__subtitle">
            Get help anytime. Our support team and comprehensive help center are available 24/7.
          </p>
          <label className="support-page__search">
            <img src={searchIcon} alt="" className="support-page__search-icon" />
            <input
              type="search"
              className="support-page__search-input"
              placeholder="Search for help articles, FAQs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search help articles"
            />
          </label>
        </div>
      </section>

      <section className="support-page__body">
        <div className="support-page__inner">
          <div className="support-page__channels">
            {channels(settings).map((c) => (
              <article key={c.id} className="support-channel" style={{ '--channel': c.color }}>
                <div className="support-channel__tile">
                  <img src={c.icon} alt="" className="support-channel__icon" />
                </div>
                <h3 className="support-channel__title">{c.title}</h3>
                <p className="support-channel__desc">{c.desc}</p>
                {c.action === 'chat' ? (
                  <button type="button" className="support-channel__btn" onClick={() => setChatOpen(true)}>
                    {c.cta}
                  </button>
                ) : (
                  <a
                    href={c.href}
                    className="support-channel__btn"
                    target={c.external ? '_blank' : undefined}
                    rel={c.external ? 'noreferrer' : undefined}
                  >
                    {c.cta}
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="support-page__columns">
            <div className="support-faq">
              <div className="support-faq__head">
                <h2 className="support-faq__title">Frequently Asked Questions</h2>
                <span className="support-faq__count">
                  {faqs.length} {faqs.length === 1 ? 'article' : 'articles'}
                </span>
              </div>
              <div className="support-faq__chips" role="tablist" aria-label="FAQ categories">
                {FAQ_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={faqCategory === c}
                    className={`support-faq__chip${faqCategory === c ? ' support-faq__chip--active' : ''}`}
                    onClick={() => setFaqCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="support-faq__list">
                {faqs.map((f) => {
                  const isOpen = openId === f.id
                  return (
                    <div key={f.id} className={`support-faq__item${isOpen ? ' support-faq__item--open' : ''}`}>
                      <button
                        type="button"
                        className="support-faq__question"
                        aria-expanded={isOpen}
                        aria-controls={`support-faq-${f.id}`}
                        onClick={() => setOpenId(isOpen ? null : f.id)}
                      >
                        <span className="support-faq__q">{f.q}</span>
                        <img src={chevronDown} alt="" className="support-faq__chevron" />
                      </button>
                      <div id={`support-faq-${f.id}`} className="support-faq__answer" hidden={!isOpen}>
                        <p>{f.a}</p>
                      </div>
                    </div>
                  )
                })}
                {faqs.length === 0 && (
                  <p className="support-faq__empty">
                    No articles match “{query}”. Try a different keyword or start a live chat.
                  </p>
                )}
              </div>
            </div>

            <aside className="support-side">
              <div className="support-side__card support-ticket">
                <div className="support-ticket__tile">
                  <img src={zapIcon} alt="" className="support-ticket__icon" />
                </div>
                <h3 className="support-ticket__title">Can't find an answer?</h3>
                <p className="support-ticket__desc">
                  Raise a support ticket and our team will respond within 4 business hours.
                </p>

                {!isLoggedIn && (
                  <Link to="/login" state={{ from: '/support' }} className="support-ticket__btn">
                    <img src={zapIconWhite} alt="" className="support-ticket__btn-icon" />
                    Sign in to raise a ticket
                  </Link>
                )}

                {isLoggedIn && !ticketOpen && !created && (
                  <button type="button" className="support-ticket__btn" onClick={() => setTicketOpen(true)}>
                    <img src={zapIconWhite} alt="" className="support-ticket__btn-icon" />
                    Raise a Ticket
                  </button>
                )}

                {isLoggedIn && ticketOpen && !created && (
                  <form className="support-ticket__form" onSubmit={submitTicket} noValidate>
                    <select
                      className="support-ticket__input support-ticket__select"
                      value={ticket.issueType}
                      onChange={(e) => {
                        setTicket({ ...ticket, issueType: e.target.value })
                        setTicketError('')
                      }}
                      aria-label="Issue type"
                      required
                    >
                      <option value="">What is the issue about?</option>
                      {ISSUE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="support-ticket__input support-ticket__textarea"
                      placeholder="Describe your issue…"
                      rows={4}
                      value={ticket.description}
                      onChange={(e) => {
                        setTicket({ ...ticket, description: e.target.value })
                        setTicketError('')
                      }}
                      aria-label="Ticket description"
                      required
                    />
                    {ticketError && (
                      <p className="support-ticket__error" role="alert">
                        {ticketError}
                      </p>
                    )}
                    <button type="submit" className="support-ticket__btn" disabled={submitting}>
                      <img src={zapIconWhite} alt="" className="support-ticket__btn-icon" />
                      {submitting ? 'Submitting…' : 'Submit Ticket'}
                    </button>
                  </form>
                )}

                {isLoggedIn && created && (
                  <>
                    <p className="support-ticket__success" role="status">
                      Ticket <strong>{created.reference}</strong> raised! We&apos;ll respond within 4 business hours.
                    </p>
                    <button type="button" className="support-ticket__again" onClick={startAnother}>
                      Raise another ticket
                    </button>
                  </>
                )}
              </div>

              {isLoggedIn && (
                <div className="support-side__card support-tickets">
                  <p className="support-tickets__title">Your tickets</p>
                  {(tickets.status === 'idle' || tickets.status === 'loading') && (
                    <p className="support-tickets__empty">Loading your tickets…</p>
                  )}
                  {tickets.status === 'error' && <p className="support-tickets__empty">{tickets.error}</p>}
                  {tickets.status === 'ready' && tickets.items.length === 0 && (
                    <p className="support-tickets__empty">You haven&apos;t raised any tickets yet.</p>
                  )}
                  {tickets.items.length > 0 && (
                    <ul className="support-tickets__list">
                      {tickets.items.map((t) => (
                        <li key={t.id || t._id || t.reference} className="support-tickets__item">
                          <div className="support-tickets__row">
                            <span className="support-tickets__ref">{t.reference}</span>
                            <span className={`support-tickets__status support-tickets__status--${t.status}`}>
                              {STATUS_LABELS[t.status] || t.status}
                            </span>
                          </div>
                          <p className="support-tickets__meta">
                            {issueLabel(t.issueType)} · {dateTime(t.createdAt)}
                          </p>
                          {t.resolution && <p className="support-tickets__resolution">{t.resolution}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="support-side__card support-links">
                <p className="support-links__title">Quick Links</p>
                <ul className="support-links__list">
                  {QUICK_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="support-links__item">
                        {l.label}
                        <img src={linkArrow} alt="" className="support-links__arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="support-stats">
                {STATS.map((s) => (
                  <div key={s.label} className="support-stats__tile">
                    <p className="support-stats__value">{s.value}</p>
                    <p className="support-stats__label">{s.label}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <SupportChat open={chatOpen} onOpen={() => setChatOpen(true)} onClose={() => setChatOpen(false)} />
    </div>
  )
}
