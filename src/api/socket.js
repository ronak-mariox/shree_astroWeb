import { io } from 'socket.io-client'
import { SOCKET_BASE_URL } from './client.js'
import { getAccessToken } from './session.js'

export const CHAT_EVENTS = {
  JOIN: 'chat:join',
  LEAVE: 'chat:leave',
  SEND: 'message:send',
  NEW: 'message:new',
  DELIVERED: 'message:delivered',
  READ: 'message:read',
  TYPING: 'chat:typing',
  ENDED: 'session:ended',
  TICK: 'chat:tick',
  LOW_BALANCE: 'chat:low_balance',
  ASTROLOGER_LEFT: 'chat:astrologer_left',
  ASTROLOGER_JOINED: 'chat:astrologer_joined',
  PACKAGE_WARNING: 'chat:package_warning',
  PACKAGE_ENDED: 'chat:package_ended',
  PACKAGE_EXTENDED: 'chat:package_extended',
  PER_MINUTE_STARTED: 'chat:per_minute_started',
  REQUESTED: 'chat:requested',
  STARTED: 'chat:started',
  ACCEPTED: 'chat:accepted',
  REJECTED: 'chat:rejected',
  MISSED: 'chat:missed',
  CANCELLED: 'chat:cancelled',
  NOTIFICATION: 'notification:new',
}

let socket = null

export function connectSocket() {
  const token = getAccessToken()
  if (!token) return null

  if (socket) {
    if (socket.auth?.token !== token) {
      socket.auth = { token }
      socket.disconnect().connect()
    } else if (!socket.connected) {
      socket.connect()
    }
    return socket
  }

  socket = io(SOCKET_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
  })
  socket.on('connect_error', (error) => {
    console.warn('[socket] connect_error:', error.message)
  })
  return socket
}

export const getSocket = () => socket

export function disconnectSocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}

export function joinChatRoom(chatId, lastSeq = 0) {
  return new Promise((resolve, reject) => {
    const active = connectSocket()
    if (!active) return reject(new Error('Not signed in.'))
    active.emit(CHAT_EVENTS.JOIN, { chatId, lastSeq }, (state) => {
      if (state?.error) return reject(new Error(state.error))
      resolve(state)
    })
  })
}

export function leaveChatRoom(chatId) {
  socket?.emit(CHAT_EVENTS.LEAVE, { chatId })
}

export function sendChatMessage(chatId, text, clientMessageId) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error('offline'))
    socket.emit(CHAT_EVENTS.SEND, { chatId, type: 'text', content: { text }, clientMessageId }, (result) => {
      if (result?.error) return reject(new Error(result.error))
      resolve(result)
    })
  })
}

export function sendTyping(chatId, isTyping) {
  socket?.emit(CHAT_EVENTS.TYPING, { chatId, isTyping })
}

export function markRead(chatId, seq) {
  socket?.emit(CHAT_EVENTS.READ, { chatId, seq })
}

const forChat = (chatId, handler) => (payload) => {
  if (payload?.chatId === chatId) handler?.(payload)
}

export function subscribeToChat(chatId, initialSeq, handlers) {
  const active = connectSocket()
  if (!active) return () => {}

  let seq = initialSeq
  const rejoin = () => {
    joinChatRoom(chatId, seq)
      .then((state) => {
        handlers.onRejoinState?.(state)
        for (const message of state.messages || []) {
          seq = Math.max(seq, message.seq ?? seq)
          handlers.onMessage?.(message)
        }
      })
      .catch(() => {})
  }

  if (active.connected) rejoin()
  active.on('connect', rejoin)

  const onMessage = (payload) => {
    if (payload?.chatId !== chatId) return
    seq = Math.max(seq, payload.seq ?? seq)
    handlers.onMessage?.(payload)
  }
  const bindings = [
    [CHAT_EVENTS.NEW, onMessage],
    [CHAT_EVENTS.TICK, forChat(chatId, handlers.onTick)],
    [CHAT_EVENTS.LOW_BALANCE, forChat(chatId, handlers.onLowBalance)],
    [CHAT_EVENTS.ENDED, forChat(chatId, handlers.onEnded)],
    [CHAT_EVENTS.STARTED, forChat(chatId, handlers.onStarted)],
    [CHAT_EVENTS.TYPING, forChat(chatId, handlers.onTyping)],
    [CHAT_EVENTS.READ, forChat(chatId, handlers.onRead)],
    [CHAT_EVENTS.ASTROLOGER_LEFT, forChat(chatId, handlers.onAstrologerLeft)],
    [CHAT_EVENTS.ASTROLOGER_JOINED, forChat(chatId, handlers.onAstrologerJoined)],
    [CHAT_EVENTS.PACKAGE_WARNING, forChat(chatId, handlers.onPackageWarning)],
    [CHAT_EVENTS.PACKAGE_ENDED, forChat(chatId, handlers.onPackageEnded)],
    [CHAT_EVENTS.PACKAGE_EXTENDED, forChat(chatId, handlers.onPackageExtended)],
    [CHAT_EVENTS.PER_MINUTE_STARTED, forChat(chatId, handlers.onPerMinuteStarted)],
  ]
  bindings.forEach(([event, fn]) => active.on(event, fn))

  return () => {
    active.off('connect', rejoin)
    bindings.forEach(([event, fn]) => active.off(event, fn))
    leaveChatRoom(chatId)
  }
}

export function subscribeToChatRequest(chatId, handlers) {
  const active = connectSocket()
  if (!active) return () => {}
  const onAccepted = forChat(chatId, handlers.onAccepted)
  const onRejected = forChat(chatId, handlers.onRejected)
  const onMissed = forChat(chatId, handlers.onMissed)
  active.on(CHAT_EVENTS.ACCEPTED, onAccepted)
  active.on(CHAT_EVENTS.REJECTED, onRejected)
  active.on(CHAT_EVENTS.MISSED, onMissed)
  return () => {
    active.off(CHAT_EVENTS.ACCEPTED, onAccepted)
    active.off(CHAT_EVENTS.REJECTED, onRejected)
    active.off(CHAT_EVENTS.MISSED, onMissed)
  }
}

export function subscribeToNotifications(handler) {
  const active = connectSocket()
  if (!active) return () => {}
  active.on(CHAT_EVENTS.NOTIFICATION, handler)
  return () => active.off(CHAT_EVENTS.NOTIFICATION, handler)
}
