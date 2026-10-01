import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { secondsUntil, toContinueBody } from '../../data/consultPackages.js'
import {
  ApiError,
  cancelChat,
  continueConsultation,
  endChat,
  fetchAstrologer,
  fetchConsultations,
  fetchMessages,
  fetchWallet,
  getChatState,
  isPaymentCancelled,
  joinLabels,
  markRead,
  messageOf,
  payTopUp,
  rateChat,
  sendMessage,
  sendTyping,
  subscribeToConsultation,
  subscribeToRequest,
} from '../../api/index.js'

/** How long the astrologer has to answer — backend/config/env.js astrologerJoinTimeoutSeconds. */
export const REQUEST_TIMEOUT_SECONDS = 120
const REQUEST_POLL_MS = 5000
const TYPING_IDLE_MS = 2500
const TYPING_RESEND_MS = 2000
const PAYMENT_CANCELLED_NOTE = 'Payment cancelled.'

/* ---------------------------------------------------------------- helpers */

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function formatClock(value) {
  const date = value ? new Date(value) : new Date()
  let h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  const suffix = h >= 12 ? 'PM' : 'AM'
  h %= 12
  if (h === 0) h = 12
  return `${h}:${m} ${suffix}`
}

/** A neutral initial-letter avatar, for astrologers without a photo. */
/**
 * The completed screen's headline: who closed the consultation. The socket's
 * `session:ended` carries `endedBy` + `reason`; the REST read after a reload
 * only `reason` — so both are checked. Nothing is said about the seeker's own
 * end, they just did it.
 */
export function endedMessage(ended, astrologerName, kind = 'chat') {
  const name = astrologerName || 'Your astrologer'
  if (ended?.reason === 'astrologer_disconnected') {
    return `${name} got disconnected, so your ${kind} consultation has ended. The unfinished minute was refunded.`
  }
  if (ended?.endedBy === 'astrologer' || ended?.reason === 'astrologer_ended') {
    return `${name} has ended the ${kind} consultation.`
  }
  return `Your ${kind} consultation with ${name} has ended.`
}

export function avatarFor(name) {
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="60" fill="#f4d3b0"/><text x="50%" y="50%" dy=".36em" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="700" fill="#b4531c">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** GET /astrologers/:id → what the consult components read. */
export function toAstrologerView(astrologer, channel = 'chat') {
  if (!astrologer) return null
  const rate = astrologer.rates?.[channel]?.now ?? astrologer.rates?.chat?.now ?? astrologer.rates?.call?.now ?? 0
  const expertise = joinLabels((astrologer.expertise || []).slice(0, 2))
  return {
    id: astrologer.id,
    name: astrologer.name,
    avatar: astrologer.photo || avatarFor(astrologer.name),
    specialty: astrologer.tagline || expertise || 'Astrologer',
    rating: Number(astrologer.rating || 0).toFixed(1),
    reviews: Number(astrologer.ratingCount || 0).toLocaleString('en-IN'),
    rate,
    languages: joinLabels(astrologer.languages) || '—',
    experience: `${astrologer.experienceYears || 0} yrs`,
    online: Boolean(astrologer.online),
    rates: astrologer.rates,
  }
}

const rowToView = (row) =>
  row?.with
    ? { id: row.with.id, name: row.with.name, avatar: row.with.photo || avatarFor(row.with.name), specialty: 'Astrologer' }
    : null

const senderOf = (message) => {
  if (message.type === 'system' || message.senderRole === 'system') return 'system'
  return message.senderRole === 'user' ? 'user' : 'astrologer'
}

/** A socket/REST message → one transcript row. */
export const toRow = (message) => ({
  id: message.id,
  seq: message.seq ?? 0,
  from: senderOf(message),
  text: message.content?.text ?? '',
  time: formatClock(message.createdAt),
  pending: false,
})

const durationOf = (state) =>
  state?.startedAt && state?.endedAt ? Math.max(0, Math.round((new Date(state.endedAt) - new Date(state.startedAt)) / 1000)) : 0

async function findRow(chatId) {
  try {
    const data = await fetchConsultations({ limit: 50 })
    return (data.items ?? []).find((item) => item.id === chatId) ?? null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------- hook */

/**
 * The request → live → ended machine one consultation goes through, driven by
 * the server (GET /chats/:id, then the socket). Chat and Call both render off
 * this; only the visuals differ.
 *
 * phase: 'loading' | 'requested' | 'live' | 'ended' | 'closed' | 'error'
 *   closed = rejected / missed / cancelled — nothing was charged.
 */
export function useConsultation(chatId, channel = 'chat') {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state || {}

  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [astrologer, setAstrologer] = useState(() => routeState.astrologer ?? null)
  const [session, setSession] = useState(null)
  const [ratePerMinute, setRatePerMinute] = useState(routeState.ratePerMinute ?? 0)
  const [closeReason, setCloseReason] = useState('')

  const [expiresAt, setExpiresAt] = useState(() => Date.now() + (routeState.expiresInSeconds ?? REQUEST_TIMEOUT_SECONDS) * 1000)
  const [secondsLeft, setSecondsLeft] = useState(REQUEST_TIMEOUT_SECONDS)

  const [messages, setMessages] = useState([])
  const [elapsed, setElapsed] = useState(0)
  const [minutesBilled, setMinutesBilled] = useState(0)
  const [balance, setBalance] = useState(null)
  const [paused, setPaused] = useState(false)
  const [lowBalance, setLowBalance] = useState(null)
  const [resuming, setResuming] = useState(false)
  const [astrologerAway, setAstrologerAway] = useState(null)
  const [typing, setTyping] = useState(false)
  const [packageChoice, setPackageChoice] = useState(null)
  /**
   * Package sessions only (null for per-minute): where the server-side package
   * clock stands — `{ phase: 'package'|'awaiting_choice'|'per_minute', endsAt,
   * warningSeconds, amountCharged, minutesPurchased }` — from the state read,
   * every socket (re)join and the package events. Countdowns use the server's clock.
   */
  const [pkg, setPkg] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [ended, setEnded] = useState(null)
  const [rated, setRated] = useState(false)
  const [busy, setBusy] = useState('')

  const clockOffset = useRef(0)
  const pausedAccumMs = useRef(0)
  const pausedSince = useRef(null)
  const seenIds = useRef(new Set())
  const lastSeq = useRef(0)
  const typingTimer = useRef(null)
  const readTimer = useRef(null)
  const typingSentAt = useRef(0)
  const peerTypingTimer = useRef(null)

  const syncClock = (serverTime) => {
    if (serverTime) clockOffset.current = new Date(serverTime).getTime() - Date.now()
  }

  /* The timer freezes whenever billing does: a balance pause, or the astrologer dropping. */
  const frozen = paused || Boolean(astrologerAway)
  useEffect(() => {
    if (frozen) {
      if (pausedSince.current === null) pausedSince.current = Date.now()
    } else if (pausedSince.current !== null) {
      pausedAccumMs.current += Date.now() - pausedSince.current
      pausedSince.current = null
    }
  }, [frozen])

  const applyState = useCallback((state) => {
    setSession(state)
    syncClock(state.serverTime)
    if (state.ratePerMinute != null) setRatePerMinute(state.ratePerMinute)
    if (state.minutesBilled != null) setMinutesBilled(state.minutesBilled)
    if (state.paused) {
      pausedSince.current = state.pausedSince ? new Date(state.pausedSince).getTime() : Date.now()
    }
    setPaused(Boolean(state.paused))
    setPkg(state.billingMode === 'package' && state.package ? state.package : null)
    if (state.package?.phase === 'awaiting_choice' && state.status === 'active') {
      setPackageChoice({ ...state.package, balanceRemaining: state.package.balanceRemaining })
    } else if (state.status === 'active') {
      setPackageChoice(null)
    }
  }, [])

  const finish = useCallback((payload) => {
    setEnded((current) => current ?? payload)
    setPhase('ended')
    setPaused(false)
    setLowBalance(null)
    setPackageChoice(null)
    setAstrologerAway(null)
    setTyping(false)
  }, [])

  /* ---- 1. boot: where does this consultation stand? */
  useEffect(() => {
    let cancelled = false
    setPhase('loading')
    setError('')
    ;(async () => {
      try {
        const state = await getChatState(chatId)
        if (cancelled) return
        applyState(state)

        const needsRow = !routeState.astrologer || state.status === 'ended' || state.status === 'requested'
        const row = needsRow ? await findRow(chatId) : null
        if (cancelled) return
        if (row?.rating) setRated(true)
        if (row?.createdAt && state.status === 'requested') {
          setExpiresAt(new Date(row.createdAt).getTime() + REQUEST_TIMEOUT_SECONDS * 1000 - clockOffset.current)
        }
        if (!routeState.astrologer) {
          const basic = rowToView(row)
          if (basic) {
            setAstrologer(basic)
            fetchAstrologer(basic.id)
              .then((full) => {
                if (!cancelled) setAstrologer({ ...toAstrologerView(full, state.channel || channel), ...(!full.photo && { avatar: basic.avatar }) })
              })
              .catch(() => {})
          }
        }

        if (state.status === 'requested') setPhase('requested')
        else if (state.status === 'active') setPhase('live')
        else if (state.status === 'ended') {
          finish({
            durationSeconds: row?.durationSeconds ?? durationOf(state),
            amountCharged: state.amountCharged ?? row?.amountCharged ?? 0,
            endedBy: null,
            reason: state.endReason,
          })
        } else {
          setCloseReason(state.status)
          setPhase('closed')
        }
      } catch (e) {
        if (cancelled) return
        setError(messageOf(e))
        setPhase('error')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  /* ---- 2. requested: wait for chat:accepted / rejected / missed */
  useEffect(() => {
    if (phase !== 'requested') return undefined
    let cancelled = false

    const refresh = async () => {
      try {
        const state = await getChatState(chatId)
        if (cancelled) return
        if (state.status === 'requested') return
        applyState(state)
        if (state.status === 'active') setPhase('live')
        else if (state.status === 'ended') finish({ durationSeconds: durationOf(state), amountCharged: state.amountCharged ?? 0, reason: state.endReason })
        else {
          setCloseReason(state.status)
          setPhase('closed')
        }
      } catch {
        /* keep waiting; the next poll or socket event will tell us */
      }
    }

    const unsubscribe = subscribeToRequest(chatId, {
      onAccepted: refresh,
      onRejected: (payload) => {
        setCloseReason('rejected')
        setActionError(payload?.reason && payload.reason !== 'Declined by astrologer' ? payload.reason : '')
        setPhase('closed')
      },
      onMissed: () => {
        setCloseReason('missed')
        setPhase('closed')
      },
    })
    const poll = setInterval(refresh, REQUEST_POLL_MS)
    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) refresh()
    }
    tick()
    const countdown = setInterval(tick, 1000)

    return () => {
      cancelled = true
      unsubscribe()
      clearInterval(poll)
      clearInterval(countdown)
    }
  }, [phase, chatId, expiresAt, applyState, finish])

  /* ---- 3. live: history, wallet, then the room */
  const appendMessage = useCallback(
    (message) => {
      if (!message?.id || seenIds.current.has(message.id)) return
      seenIds.current.add(message.id)
      lastSeq.current = Math.max(lastSeq.current, message.seq ?? 0)
      const row = toRow(message)
      setMessages((current) => {
        const pendingIndex = message.clientMessageId ? current.findIndex((entry) => entry.id === message.clientMessageId) : -1
        if (pendingIndex === -1) return [...current, row]
        const next = [...current]
        next[pendingIndex] = row
        return next
      })
      if (row.from === 'astrologer') {
        setTyping(false)
        /* One read receipt for a burst (or a backfill), not one per message. */
        clearTimeout(readTimer.current)
        readTimer.current = setTimeout(() => markRead(chatId, lastSeq.current), 150)
      }
    },
    [chatId],
  )

  useEffect(() => {
    if (phase !== 'live') return undefined
    let cancelled = false
    let unsubscribe = () => {}

    fetchWallet()
      .then((wallet) => {
        if (!cancelled && wallet?.balance != null) setBalance((current) => current ?? wallet.balance)
      })
      .catch(() => {})

    fetchMessages(chatId)
      .catch(() => [])
      .then((history) => {
        if (cancelled) return
        history.forEach(appendMessage)
        unsubscribe = subscribeToConsultation(chatId, lastSeq.current, {
          onMessage: appendMessage,
          onRejoinState: (state) => {
            syncClock(state.serverTime)
            if (state.status && state.status !== 'active') {
              getChatState(chatId)
                .then((fresh) => {
                  if (cancelled) return
                  if (fresh.status === 'ended') finish({ durationSeconds: durationOf(fresh), amountCharged: fresh.amountCharged ?? 0, reason: fresh.endReason })
                })
                .catch(() => {})
              return
            }
            if (state.package) setPkg(state.package)
            if (state.package?.phase === 'awaiting_choice') {
              setPackageChoice((current) => current ?? state.package)
              setPaused(true)
              return
            }
            if (state.paused) {
              if (pausedSince.current === null) pausedSince.current = state.pausedSince ? new Date(state.pausedSince).getTime() : Date.now()
              setPaused(true)
            } else {
              setPaused(false)
              setResuming(false)
            }
          },
          onTick: (payload) => {
            if (payload.minutesBilled != null) setMinutesBilled(payload.minutesBilled)
            if (payload.balanceRemaining != null) setBalance(payload.balanceRemaining)
            setPaused(false)
            setLowBalance(null)
            setResuming(false)
          },
          onLowBalance: (payload) => {
            if (payload.balanceRemaining != null) setBalance(payload.balanceRemaining)
            if (payload.paused === false) {
              setPaused(false)
              setLowBalance(null)
              setResuming(false)
              return
            }
            if (payload.paused || payload.exhausted) {
              setPaused(true)
              setLowBalance(null)
            } else {
              setLowBalance(payload)
            }
          },
          onEnded: (payload) => finish(payload),
          onStarted: (payload) => syncClock(payload?.serverTime),
          onTyping: (payload) => {
            const role = payload.role ?? payload.senderRole
            if (role === 'user') return
            setTyping(Boolean(payload.isTyping))
            clearTimeout(peerTypingTimer.current)
            if (payload.isTyping) peerTypingTimer.current = setTimeout(() => setTyping(false), 4000)
          },
          onAstrologerLeft: (payload) => setAstrologerAway(payload || {}),
          onAstrologerJoined: (payload) => {
            syncClock(payload?.serverTime)
            setAstrologerAway(null)
          },
          onPackageWarning: (payload) => {
            syncClock(payload?.serverTime)
            setPkg((current) => ({ ...(current ?? {}), phase: 'package', endsAt: payload?.endsAt ?? current?.endsAt }))
          },
          onPackageEnded: (payload) => {
            syncClock(payload?.serverTime)
            if (payload.balanceRemaining != null) setBalance(payload.balanceRemaining)
            setPkg((current) => ({ ...(current ?? {}), phase: 'awaiting_choice', awaitingChoiceSince: payload.pausedSince }))
            setPackageChoice(payload)
            setPaused(true)
          },
          /** Continued with another package (this tab or another of the seeker's) — a fresh countdown. */
          onPackageExtended: (payload) => {
            syncClock(payload?.serverTime)
            if (payload.balanceRemaining != null) setBalance(payload.balanceRemaining)
            setPkg((current) => ({
              ...(current ?? {}),
              phase: 'package',
              endsAt: payload.endsAt,
              awaitingChoiceSince: undefined,
              amountCharged: (current?.amountCharged ?? 0) + (payload.amount ?? 0),
              minutesPurchased: (current?.minutesPurchased ?? 0) + (payload.packageMinutes ?? 0),
            }))
            setPackageChoice(null)
            setPaused(false)
            setLowBalance(null)
          },
          /** Continued per-minute: from here it's an ordinary per-minute session (ticks, low balance, recharge). */
          onPerMinuteStarted: (payload) => {
            syncClock(payload?.serverTime)
            if (payload.balanceRemaining != null) setBalance(payload.balanceRemaining)
            setPkg((current) => ({ ...(current ?? {}), phase: 'per_minute', perMinuteStartedAt: payload.perMinuteStartedAt ?? payload.serverTime, awaitingChoiceSince: undefined }))
            setPackageChoice(null)
            setPaused(false)
          },
        })
      })

    return () => {
      cancelled = true
      unsubscribe()
      clearTimeout(peerTypingTimer.current)
    }
  }, [phase, chatId, appendMessage, finish])

  /* ---- the running clock, from the server's startedAt */
  const startedAt = session?.startedAt
  useEffect(() => {
    if (phase !== 'live' || !startedAt) return undefined
    const start = new Date(startedAt).getTime()
    const tick = () => {
      /* Frozen: hold the clock at the moment the pause began. */
      const now = (pausedSince.current ?? Date.now()) + clockOffset.current
      setElapsed(Math.max(0, Math.floor((now - start - pausedAccumMs.current) / 1000)))
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [phase, startedAt])

  useEffect(
    () => () => {
      clearTimeout(typingTimer.current)
      clearTimeout(readTimer.current)
    },
    [],
  )

  /* ---------------------------------------------------------- actions */

  const send = useCallback(
    async (text) => {
      const body = String(text || '').trim()
      if (!body || phase !== 'live' || paused) return false
      const clientMessageId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setMessages((current) => [...current, { id: clientMessageId, seq: Infinity, from: 'user', text: body, time: formatClock(), pending: true }])
      clearTimeout(typingTimer.current)
      typingSentAt.current = 0
      sendTyping(chatId, false)
      try {
        const message = await sendMessage(chatId, body, clientMessageId)
        if (message) appendMessage(message)
        return true
      } catch (e) {
        setMessages((current) => current.filter((entry) => entry.id !== clientMessageId))
        setActionError(messageOf(e, 'Message not sent. Please try again.'))
        return false
      }
    },
    [chatId, phase, paused, appendMessage],
  )

  const onDraftChange = useCallback(() => {
    if (phase !== 'live') return
    const now = Date.now()
    if (now - typingSentAt.current > TYPING_RESEND_MS) {
      typingSentAt.current = now
      sendTyping(chatId, true)
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      typingSentAt.current = 0
      sendTyping(chatId, false)
    }, TYPING_IDLE_MS)
  }, [chatId, phase])

  const cancel = useCallback(async () => {
    setBusy('cancel')
    try {
      await cancelChat(chatId)
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 400)) setActionError(messageOf(e))
    } finally {
      setBusy('')
    }
    navigate('/astrologers')
  }, [chatId, navigate])

  const end = useCallback(async () => {
    setBusy('end')
    try {
      const result = await endChat(chatId, 'user_ended')
      finish({ durationSeconds: result.durationSeconds, amountCharged: result.amountCharged, endedBy: 'user', reason: 'user_ended' })
      fetchWallet()
        .then((wallet) => wallet?.balance != null && setBalance(wallet.balance))
        .catch(() => {})
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && /already/i.test(e.message)) {
        getChatState(chatId)
          .then((state) => finish({ durationSeconds: durationOf(state), amountCharged: state.amountCharged ?? 0, reason: state.endReason }))
          .catch(() => {})
      } else setActionError(messageOf(e))
    } finally {
      setBusy('')
    }
  }, [chatId, finish])

  /** Razorpay checkout, then the verified confirm — on which the server resumes a paused session. */
  const topUp = useCallback(
    async (amount) => {
      setBusy('topup')
      try {
        await payTopUp({ amount })
        const wallet = await fetchWallet().catch(() => null)
        if (wallet?.balance != null) setBalance(wallet.balance)
        setLowBalance(null)
        if (paused) {
          setResuming(true)
          getChatState(chatId)
            .then((state) => {
              if (!state.paused && state.status === 'active' && !state.package?.awaitingChoiceSince) {
                setPaused(false)
                setResuming(false)
              }
              if (state.package?.phase === 'awaiting_choice') setPackageChoice((current) => ({ ...(current ?? {}), ...state.package }))
            })
            .catch(() => {})
        }
        return true
      } catch (e) {
        if (isPaymentCancelled(e)) {
          /** Closing the checkout is not an error — a brief note that clears itself. */
          setActionError(PAYMENT_CANCELLED_NOTE)
          setTimeout(() => setActionError((current) => (current === PAYMENT_CANCELLED_NOTE ? '' : current)), 4000)
          return false
        }
        setActionError(messageOf(e, 'Could not add money. Please try again.'))
        /** Paid but not confirmed yet — the webhook may have credited it already. */
        if (e?.code === 'payment_confirm_pending') {
          fetchWallet()
            .then((wallet) => wallet?.balance != null && setBalance(wallet.balance))
            .catch(() => {})
        }
        return false
      } finally {
        setBusy('')
      }
    },
    [chatId, paused],
  )

  /**
   * After a package ran out: continue per-minute or with another package
   * (`{ mode: 'per_minute' }` / `{ mode: 'package', minutes, price }`).
   * Resolves `{ ok: true }`, or `{ ok: false, recharge: ₹ }` when the wallet
   * can't cover the choice (the page opens its recharge modal for that amount).
   */
  const continueWith = useCallback(
    async (choice) => {
      setBusy('continue')
      try {
        const result = await continueConsultation(chatId, toContinueBody(choice))
        syncClock(result?.serverTime)
        if (result?.balanceRemaining != null) setBalance(result.balanceRemaining)
        setPkg((current) =>
          result?.mode === 'package'
            ? {
                ...(current ?? {}),
                phase: 'package',
                endsAt: result.endsAt,
                awaitingChoiceSince: undefined,
                amountCharged: (current?.amountCharged ?? 0) + (result.amount ?? 0),
                minutesPurchased: (current?.minutesPurchased ?? 0) + (result.packageMinutes ?? 0),
              }
            : { ...(current ?? {}), phase: 'per_minute', perMinuteStartedAt: result?.perMinuteStartedAt ?? result?.serverTime, awaitingChoiceSince: undefined },
        )
        setPackageChoice(null)
        setPaused(false)
        setLowBalance(null)
        /** The first per-minute minute (or the new package) is charged now — pick up the meter without waiting for the next tick. */
        getChatState(chatId).then(applyState).catch(() => {})
        return { ok: true }
      } catch (e) {
        if (e instanceof ApiError && e.code === 'insufficient_balance') {
          const price = Number(e.details?.price ?? (choice?.mode === 'package' ? choice.price : ratePerMinute)) || 0
          const short = Number(e.details?.shortfallAmount)
          return { ok: false, recharge: Number.isFinite(short) && short > 0 ? short : Math.max(price - (balance ?? 0), price) }
        }
        if (e instanceof ApiError && (e.code === 'price_changed' || e.code === 'not_awaiting_choice')) {
          /** Re-read the session: fresh quotes (and whether the choice is still open) come with the state. */
          getChatState(chatId).then(applyState).catch(() => {})
          if (e.code === 'price_changed') setActionError(e.message)
          return { ok: false }
        }
        setActionError(messageOf(e))
        return { ok: false }
      } finally {
        setBusy('')
      }
    },
    [chatId, ratePerMinute, balance, applyState],
  )

  const continuePerMinute = useCallback(async () => (await continueWith({ mode: 'per_minute' })).ok, [continueWith])

  const rate = useCallback(
    async (rating, comment) => {
      setBusy('rate')
      try {
        await rateChat(chatId, rating, comment || undefined)
        setRated(true)
        return true
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          setRated(true)
          return true
        }
        setActionError(messageOf(e))
        return false
      } finally {
        setBusy('')
      }
    },
    [chatId],
  )

  /* ---- package countdown: re-render once a second while package time is running */
  const packageClockRunning = phase === 'live' && pkg?.phase === 'package' && Boolean(pkg.endsAt)
  useEffect(() => {
    if (!packageClockRunning) return undefined
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [packageClockRunning])
  const packageSecondsLeft = packageClockRunning ? secondsUntil(pkg.endsAt, clockOffset.current, now) : 0

  /** While the request is pending: which package was booked (charged on accept), for the waiting screen's hint. */
  const requestedPackage = routeState.packageMinutes
    ? { minutes: routeState.packageMinutes, price: routeState.packagePrice }
    : pkg?.requestedMinutes
      ? { minutes: pkg.requestedMinutes, price: pkg.requestedPrice }
      : null

  /** Package money is prepaid; the per-minute meter only counts a per-minute tail (or a per-minute session). */
  const charge = minutesBilled * ratePerMinute + (pkg?.amountCharged ?? 0)

  return {
    phase,
    error,
    actionError,
    clearActionError: () => setActionError(''),
    astrologer,
    session,
    channel: session?.channel || channel,
    ratePerMinute,
    closeReason,
    secondsLeft,
    messages,
    elapsed,
    minutesBilled,
    charge,
    balance,
    paused,
    resuming,
    lowBalance,
    astrologerAway,
    typing,
    packageChoice,
    pkg,
    packageSecondsLeft,
    requestedPackage,
    ended,
    rated,
    busy,
    send,
    onDraftChange,
    cancel,
    end,
    topUp,
    continuePerMinute,
    continueWith,
    rate,
  }
}
