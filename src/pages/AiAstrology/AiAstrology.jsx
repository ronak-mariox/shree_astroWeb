import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { askAi, fetchAiThread, fetchSettings, messageOf } from '../../api/index.js'
import backIcon from '../../assets/pages/ai-astrology/back-icon.svg'
import aiIcon from '../../assets/pages/ai-astrology/ai-icon.svg'
import aiIconSm from '../../assets/pages/ai-astrology/ai-icon-sm.svg'
import sendIcon from '../../assets/pages/ai-astrology/send-icon.svg'
import './AiAstrology.css'

const GREETING =
  "Namaste! I'm Jyoti, your AI Astrologer. I can analyze your birth chart, answer astrology questions, and provide guidance on love, career, health, and finances. How can I assist you today?"

const SUGGESTIONS = [
  'What does my kundli say about career?',
  'Love compatibility',
  "Today's lucky colour",
  'Best time to start a business',
]

let clientSeq = 0
/** Idempotency key for a send — the server echoes it back on the stored question. */
const nextClientMessageId = () => `local-${Date.now()}-${++clientSeq}`

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
}

function formatTime(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  let h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  const suffix = h >= 12 ? 'PM' : 'AM'
  h %= 12
  if (h === 0) h = 12
  return `${h}:${m} ${suffix}`
}

/** A thread item from the API → a chat bubble. */
function toBubble(item) {
  return {
    id: item.id,
    from: item.senderRole === 'user' ? 'user' : 'ai',
    text: item.content?.text ?? '',
    time: formatTime(item.createdAt),
  }
}

export default function AiAstrology() {
  const { isLoggedIn } = useAuth()

  const [messages, setMessages] = useState([])
  const [thread, setThread] = useState({ status: 'loading', error: '' })
  const [available, setAvailable] = useState(true)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [seconds, setSeconds] = useState(0)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Feature switch — the assistant can be turned off from the admin panel.
  useEffect(() => {
    let active = true
    fetchSettings()
      .then((settings) => {
        if (active && settings?.features?.aiAssistant === false) setAvailable(false)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isLoggedIn) return undefined
    let active = true
    fetchAiThread()
      .then((data) => {
        if (!active) return
        const items = (data?.items ?? []).map(toBubble).filter((m) => m.text)
        setMessages(items.length ? items : [{ id: 'greeting', from: 'ai', text: GREETING, time: 'Now' }])
        setThread({ status: 'ready', error: '' })
      })
      .catch((error) => {
        if (active) setThread({ status: 'error', error: messageOf(error, 'Could not load your conversation.') })
      })
    return () => {
      active = false
    }
  }, [isLoggedIn, attempt])

  const reloadThread = () => {
    setThread({ status: 'loading', error: '' })
    setAttempt((n) => n + 1)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing])

  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/ai-astrology' }} />

  const send = async (raw) => {
    const text = raw.trim()
    if (!text || typing || !available) return
    const clientMessageId = nextClientMessageId()
    setMessages((list) => [...list, { id: clientMessageId, from: 'user', text, time: formatTime() }])
    setDraft('')
    setTyping(true)
    try {
      const result = await askAi(text, clientMessageId)
      setMessages((list) => {
        const next = list.map((m) =>
          m.id === clientMessageId && result?.question ? { ...toBubble(result.question), text: m.text } : m,
        )
        if (result?.answer) next.push(toBubble(result.answer))
        return next
      })
    } catch (error) {
      setMessages((list) =>
        list.map((m) => (m.id === clientMessageId ? { ...m, failed: true, error: messageOf(error, 'Not sent') } : m)),
      )
    } finally {
      setTyping(false)
      inputRef.current?.focus()
    }
  }

  const retry = (msg) => {
    setMessages((list) => list.filter((m) => m.id !== msg.id))
    send(msg.text)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    send(draft)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }

  const ready = thread.status === 'ready' && available
  const canSend = ready && draft.trim().length > 0 && !typing
  const showSuggestions = ready && messages.filter((m) => m.from === 'user').length === 0 && !typing

  return (
    <div className="ai-chat">
      <header className="ai-chat__bar">
        <div className="ai-chat__bar-left">
          <Link to="/" className="ai-chat__back">
            <span className="ai-chat__back-icon">
              <img className="icon-ink" src={backIcon} alt="" />
            </span>
            Back to AI Astrology
          </Link>
          <span className="ai-chat__divider" />
          <div className="ai-chat__who">
            <span className="ai-chat__avatar">
              <img src={aiIcon} alt="" />
            </span>
            <div className="ai-chat__who-text">
              <h2 className="ai-chat__name">Jyoti — AI Astrologer</h2>
              <p className={`ai-chat__status${available ? '' : ' ai-chat__status--off'}`}>
                <span className="ai-chat__status-dot" />
                {available ? 'Online & Ready' : 'Temporarily unavailable'}
              </p>
            </div>
          </div>
        </div>
        <span className="ai-chat__timer">{formatTimer(seconds)}</span>
      </header>

      <div className="ai-chat__messages" role="log" aria-live="polite">
        <div className="ai-chat__thread">
          {!available && (
            <div className="ai-chat__notice" role="status">
              <p className="ai-chat__notice-title">Jyoti is temporarily unavailable</p>
              <p className="ai-chat__notice-text">
                The AI astrologer is paused for maintenance. Please check back soon, or{' '}
                <Link to="/astrologers">talk to a live astrologer</Link> instead.
              </p>
            </div>
          )}

          {available && thread.status === 'loading' && (
            <div className="ai-chat__notice" role="status">
              <span className="ai-chat__spinner" aria-hidden="true" />
              <p className="ai-chat__notice-text">Loading your conversation…</p>
            </div>
          )}

          {available && thread.status === 'error' && (
            <div className="ai-chat__notice ai-chat__notice--error" role="alert">
              <p className="ai-chat__notice-text">{thread.error}</p>
              <button type="button" className="ai-chat__retry" onClick={reloadThread}>
                Try again
              </button>
            </div>
          )}

          {available &&
            thread.status === 'ready' &&
            messages.map((msg) =>
              msg.from === 'ai' ? (
                <div key={msg.id} className="ai-chat__msg ai-chat__msg--ai">
                  <span className="ai-chat__msg-avatar">
                    <img src={aiIconSm} alt="" />
                  </span>
                  <div className="ai-chat__msg-body">
                    <div className="ai-chat__bubble ai-chat__bubble--ai">
                      <p className="ai-chat__bubble-text">{msg.text}</p>
                    </div>
                    <span className="ai-chat__msg-time">{msg.time}</span>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="ai-chat__msg ai-chat__msg--user">
                  <div className="ai-chat__msg-body">
                    <div className={`ai-chat__bubble ai-chat__bubble--user${msg.failed ? ' ai-chat__bubble--failed' : ''}`}>
                      <p className="ai-chat__bubble-text">{msg.text}</p>
                    </div>
                    {msg.failed ? (
                      <span className="ai-chat__msg-time ai-chat__msg-time--failed">
                        {msg.error} ·{' '}
                        <button type="button" className="ai-chat__retry-link" onClick={() => retry(msg)}>
                          Retry
                        </button>
                      </span>
                    ) : (
                      <span className="ai-chat__msg-time">{msg.time}</span>
                    )}
                  </div>
                </div>
              ),
            )}

          {typing && (
            <div className="ai-chat__msg ai-chat__msg--ai">
              <span className="ai-chat__msg-avatar">
                <img src={aiIconSm} alt="" />
              </span>
              <div className="ai-chat__msg-body">
                <div className="ai-chat__bubble ai-chat__bubble--ai ai-chat__bubble--typing" aria-label="Jyoti is typing">
                  <span className="ai-chat__typing-dot" />
                  <span className="ai-chat__typing-dot" />
                  <span className="ai-chat__typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="ai-chat__footer">
        {showSuggestions && (
          <div className="ai-chat__chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="ai-chat__chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <form className="ai-chat__composer" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className="ai-chat__input"
            type="text"
            placeholder={available ? 'Ask anything about your chart, destiny, love, career…' : 'The AI astrologer is unavailable right now'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!ready}
            aria-label="Message"
          />
          <button
            type="submit"
            className={`ai-chat__send${canSend ? ' ai-chat__send--active' : ''}`}
            disabled={!canSend}
            aria-label="Send message"
          >
            <span className="ai-chat__send-icon">
              <img src={sendIcon} alt="" />
            </span>
          </button>
        </form>
        <p className="ai-chat__disclaimer">AI Astrology guidance only. Not a substitute for professional advice.</p>
      </div>
    </div>
  )
}
