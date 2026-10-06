import { clearSession, getAccessToken, getRefreshToken, isSignedIn, updateTokens } from './session.js'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '')

const TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, status, { fields, code, retryAfterSeconds, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
    this.details = details
  }
}

function buildUrl(path, params) {
  const url = new URL(path.startsWith('http') ? path : API_BASE_URL + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value))
    })
  }
  return url.toString()
}

async function parseBody(response) {
  const type = response.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  const text = await response.text()
  return text ? { error: text } : null
}

function errorFrom(status, data) {
  const message =
    data?.error ||
    data?.message ||
    (status >= 500 ? 'The server had a problem. Please try again.' : 'Something went wrong. Please try again.')
  return new ApiError(message, status, {
    fields: data?.fields,
    code: data?.code,
    retryAfterSeconds: data?.retryAfterSeconds,
    details: data?.details,
  })
}

let refreshing = null

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new ApiError('Please sign in again.', 401, { code: 'no_refresh_token' })
  const response = await fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const data = await parseBody(response)
  if (!response.ok) throw errorFrom(response.status, data)
  updateTokens(data)
  return data.accessToken
}

/** One refresh at a time — REST retries and the socket's refused handshake (api/socket.js) share it. */
export function refreshOnce() {
  refreshing = refreshing ?? refreshAccessToken().finally(() => {
    refreshing = null
  })
  return refreshing
}

async function request(method, path, { body, params, signal, retried = false, auth = true } = {}) {
  const headers = {}
  const token = auth ? getAccessToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })

  let response
  try {
    response = await fetch(buildUrl(path, params), { method, headers, body: payload, signal: controller.signal })
  } catch (error) {
    clearTimeout(timer)
    if (error.name === 'AbortError') throw new ApiError('The request timed out. Please try again.')
    throw new ApiError('Cannot reach the server. Check your connection.')
  }
  clearTimeout(timer)

  const data = await parseBody(response)
  if (response.ok) return data

  const apiError = errorFrom(response.status, data)
  if (apiError.status !== 401 || !isSignedIn()) throw apiError

  if (apiError.code === 'token_expired' && !retried && getRefreshToken()) {
    try {
      await refreshOnce()
      return request(method, path, { body, params, signal, retried: true, auth })
    } catch {
      /* refresh token spent — fall through and sign out */
    }
  }

  clearSession()
  throw new ApiError('Your session has expired. Please sign in again.', 401, { code: 'session_expired' })
}

export const client = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
}

export function messageOf(error, fallback = 'Something went wrong. Please try again.') {
  return error instanceof ApiError ? error.message : error?.message || fallback
}
