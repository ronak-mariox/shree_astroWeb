const STORAGE_KEY = 'shreeastro-session'

let session = read()
const listeners = new Set()

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(next) {
  session = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn(session))
}

export const getSession = () => session
export const getAccessToken = () => session?.accessToken ?? null
export const getRefreshToken = () => session?.refreshToken ?? null
export const isSignedIn = () => Boolean(session?.accessToken)

export function saveSession({ accessToken, refreshToken, user }) {
  write({ accessToken, refreshToken, user })
}

export function updateTokens({ accessToken, refreshToken }) {
  if (!session) return
  write({ ...session, accessToken, refreshToken: refreshToken || session.refreshToken })
}

export function updateSessionUser(user) {
  if (!session) return
  write({ ...session, user: { ...session.user, ...user } })
}

export function clearSession() {
  if (session) write(null)
}

export function onSessionChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
