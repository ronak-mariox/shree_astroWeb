import { useEffect, useRef, useState } from 'react'
import chatIcon from '../../assets/pages/support/widget-chat-icon.svg'
import closeIcon from '../../assets/pages/support/widget-close.svg'
import sendIcon from '../../assets/pages/support/widget-send.svg'
import './SupportChat.css'

const QUICK_OPTIONS = ['Consultation issue', 'Payment help', 'Track my order', 'Account support']

const REPLIES = {
  'Consultation issue':
    'Sorry to hear that. Please share the astrologer name and the approximate time of your session and our team will look into it right away.',
  'Payment help':
    'Happy to help with payments. Wallet recharges reflect within 2 minutes; if a deduction looks wrong, share the transaction ID and we will verify it.',
  'Track my order':
    'You can track every Store order under Account → Orders. Share your order ID here if you would like a live update from our team.',
  'Account support':
    'Sure. Tell us what you need — updating your profile, birth details, or login help — and we will guide you through it.',
}

const GREETING = {
  id: 0,
  from: 'agent',
  text: 'Namaste! Welcome to Shree Astro Support. How can I help you today?',
}

export default function SupportChat({ open, onClose, onOpen }) {
  const [messages, setMessages] = useState([GREETING])
  const [draft, setDraft] = useState('')
  const [showOptions, setShowOptions] = useState(true)
  const threadRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const node = threadRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = (text) => {
    const clean = text.trim()
    if (!clean) return
    const reply =
      REPLIES[clean] ||
      'Thanks for reaching out. A support agent will be with you in under 2 minutes. Meanwhile, feel free to add any details.'
    setMessages((prev) => [
      ...prev,
      { id: prev.length, from: 'user', text: clean },
      { id: prev.length + 1, from: 'agent', text: reply },
    ])
    setShowOptions(false)
    setDraft('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    send(draft)
  }

  return (
    <>
      {!open && (
        <button type="button" className="support-chat__fab" onClick={onOpen} aria-label="Open live chat">
          <img src={chatIcon} alt="" className="support-chat__fab-icon" />
        </button>
      )}

      <section
        className={`support-chat${open ? ' support-chat--open' : ''}`}
        aria-label="Shree Astro Support live chat"
        aria-hidden={!open}
      >
        <header className="support-chat__head">
          <div className="support-chat__avatar">
            <img src={chatIcon} alt="" className="support-chat__avatar-icon" />
          </div>
          <div className="support-chat__who">
            <p className="support-chat__name">Shree Astro Support</p>
            <p className="support-chat__status">
              <span className="support-chat__dot" />
              Online · Typically replies in 2 min
            </p>
          </div>
          <button type="button" className="support-chat__close" onClick={onClose} aria-label="Close chat">
            <img src={closeIcon} alt="" className="support-chat__close-icon" />
          </button>
        </header>

        <div className="support-chat__body" ref={threadRef}>
          {messages.map((m) => (
            <div key={m.id} className={`support-chat__msg support-chat__msg--${m.from}`}>
              <p className="support-chat__bubble">{m.text}</p>
            </div>
          ))}

          {showOptions && (
            <div className="support-chat__options">
              <p className="support-chat__options-label">QUICK OPTIONS</p>
              {QUICK_OPTIONS.map((opt) => (
                <button key={opt} type="button" className="support-chat__option" onClick={() => send(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="support-chat__composer" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="support-chat__input"
            placeholder="Type your message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Type your message"
          />
          <button type="submit" className="support-chat__send" aria-label="Send message">
            <img src={sendIcon} alt="" className="support-chat__send-icon" />
          </button>
        </form>
      </section>
    </>
  )
}
