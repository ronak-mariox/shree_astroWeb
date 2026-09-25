import { client } from './client.js'
import { clearSession, getRefreshToken, saveSession } from './session.js'
import { joinChatRoom, sendChatMessage, subscribeToChat, subscribeToChatRequest } from './socket.js'

export { ApiError, API_BASE_URL, messageOf } from './client.js'
export * from './socket.js'

/* ------------------------------------------------------------- formatting */

export const titleCase = (value) =>
  String(value || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const joinLabels = (values) => (values ?? []).map(titleCase).join(', ')

export const rupees = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`

export const minutesOf = (seconds) => (seconds ? `${Math.ceil(seconds / 60)} min` : '—')

export const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const dateTime = (value) =>
  value
    ? `${shortDate(value)}, ${new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}`
    : '—'

export const timeAgo = (value) => {
  if (!value) return '—'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return '—'
  const minutes = Math.floor((Date.now() - then) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return shortDate(value)
}

/** "+91 98765 43210" → "9876543210" (the ten digits the API wants). */
export const digitsOf = (value) => String(value || '').replace(/\D/g, '')
export const loginPhoneOf = (value) => {
  const digits = digitsOf(value)
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
}

/** "1990-06-15" → "15/06/1990" (the API's DD/MM/YYYY). */
export const toApiDate = (isoDate) => {
  if (!isoDate) return ''
  const [y, m, d] = String(isoDate).split('-')
  return d && m && y ? `${d}/${m}/${y}` : String(isoDate)
}

/** A birthDetails.dateOfBirth Date/ISO → "1990-06-15" for <input type="date">. */
export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

/* ------------------------------------------------------------------- auth */

export async function requestLoginOtp(identifier) {
  return client.post('/auth/login/otp/request', { role: 'user', ...identifier }, { auth: false })
}

/** Throws ApiError with code `account_not_found` (404) when the number has no account. */
export async function verifyLoginOtp(identifier, code) {
  const data = await client.post('/auth/login/otp/verify', { role: 'user', ...identifier, code: digitsOf(code) }, { auth: false })
  saveSession(data)
  return data
}

/**
 * Opens the account and signs in. `dateOfBirth` as DD/MM/YYYY, `timeOfBirth` as
 * "HH:MM" (24h) or "HH:MM AM/PM", `placeOfBirth` free text, `photo` an optional File.
 */
export async function register({ fullName, email, phone, gender, dateOfBirth, timeOfBirth, placeOfBirth, photo, referralCode }) {
  const form = new FormData()
  form.append('fullName', fullName.trim())
  form.append('email', email.trim().toLowerCase())
  form.append('phone', loginPhoneOf(phone))
  if (gender) form.append('gender', gender.toLowerCase())
  form.append('dateOfBirth', dateOfBirth.trim())
  form.append('timeOfBirth', timeOfBirth.trim())
  form.append('placeOfBirth', placeOfBirth.trim())
  if (photo) form.append('photo', photo, photo.name || 'profile.jpg')
  if (referralCode) form.append('referralCode', String(referralCode).trim().toUpperCase())
  const data = await client.post('/auth/register', form, { auth: false })
  saveSession(data)
  return data
}

export async function loginWithGoogle(idToken, fullName) {
  const data = await client.post('/auth/google', { idToken, fullName }, { auth: false })
  saveSession(data)
  return data
}

export async function loginWithApple(identityToken, fullName) {
  const data = await client.post('/auth/apple', { identityToken, fullName }, { auth: false })
  saveSession(data)
  return data
}

export async function signOut() {
  try {
    await client.post('/auth/logout', { refreshToken: getRefreshToken() })
  } catch {
    /* signing out locally regardless */
  }
  clearSession()
}

/* -------------------------------------------------------------- account */

export const fetchProfile = async () => (await client.get('/users/me')).user
export const fetchHome = () => client.get('/users/me/home')

/** JSON unless a `photo` File is included. */
export async function saveProfile(changes) {
  if (!changes.photo) {
    const { photo: _photo, ...rest } = changes
    return (await client.patch('/users/me', rest)).user
  }
  const form = new FormData()
  Object.entries(changes).forEach(([key, value]) => {
    if (key !== 'photo' && value !== undefined && value !== null) form.append(key, String(value))
  })
  form.append('photo', changes.photo, changes.photo.name || 'profile.jpg')
  return (await client.patch('/users/me', form)).user
}

export const updateNotificationPrefs = async (prefs) => (await client.patch('/users/me/notification-prefs', prefs)).notificationPrefs

export const fetchFavourites = async () => (await client.get('/users/me/favourites')).items ?? []
export const toggleFavourite = async (astrologerId) => Boolean((await client.post(`/users/me/favourites/${astrologerId}`, {})).favourite)

/* ------------------------------------------------------------ directory */

/** Works signed out too (the backend directory router uses optional auth). */
export async function fetchAstrologers(filters = {}) {
  return client.get('/astrologers', { params: filters })
}

export const fetchAstrologer = async (astrologerId) => (await client.get(`/astrologers/${astrologerId}`)).astrologer
export const fetchAstrologerReviews = async (astrologerId, page = 1, limit = 20) =>
  (await client.get(`/astrologers/${astrologerId}/reviews`, { params: { page, limit } })).items ?? []

/* ---------------------------------------------------------------- wallet */

export const fetchWallet = async () => (await client.get('/wallet')).wallet
export const fetchTransactions = (filter = 'all', page = 1, limit = 50) =>
  client.get('/wallet/transactions', { params: { filter, page, limit } })
/** With a `topup` coupon the start response carries `bonusAmount` (credited on confirm). */
export const startTopUp = (amount, couponCode) =>
  client.post('/wallet/topup', couponCode ? { amount, couponCode } : { amount })
export const confirmTopUp = async (transactionId, paymentId, method) =>
  (await client.post('/wallet/topup/confirm', { transactionId, paymentId, method })).transaction
export const fetchSettings = async () => (await client.get('/settings', { auth: false })).settings

/* --------------------------------------------------------- consultations */

export const TOPICS = [
  { value: 'love-relationship', label: 'Love & Relationship' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'career-job', label: 'Career & Job' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'wealth-finance', label: 'Wealth & Finance' },
  { value: 'family', label: 'Family' },
  { value: 'kundli-milan', label: 'Kundli Milan' },
  { value: 'muhurat', label: 'Muhurat' },
  { value: 'vastu', label: 'Vastu' },
  { value: 'general', label: 'General' },
]

export const precheckSession = (astrologerId, channel = 'chat') => client.post('/chats/precheck', { astrologerId, channel })
export const requestChat = (astrologerId, intake, channel = 'chat', billing) =>
  client.post('/chats', billing ? { astrologerId, channel, intake, billing } : { astrologerId, channel, intake })
export const continueConsultation = (chatId, body) => client.post(`/chats/${chatId}/continue`, body)
export const cancelChat = (chatId) => client.post(`/chats/${chatId}/cancel`, {})
export const endChat = (chatId, reason) => client.post(`/chats/${chatId}/end`, { reason })
export const rateChat = (chatId, rating, comment) => client.post(`/chats/${chatId}/rate`, { rating, comment })
export const getChatState = (chatId) => client.get(`/chats/${chatId}`)
export const fetchConsultations = (params = {}) => client.get('/chats', { params: { limit: 50, ...params } })
export const fetchMessages = async (chatId, beforeSeq, limit = 50) =>
  (await client.get(`/chats/${chatId}/messages`, { params: { beforeSeq, limit } })).items ?? []
export const joinChat = joinChatRoom
export const subscribeToConsultation = subscribeToChat
export const subscribeToRequest = subscribeToChatRequest

export async function sendMessage(chatId, text, clientMessageId = `local-${Date.now()}`) {
  try {
    const result = await sendChatMessage(chatId, text, clientMessageId)
    return result.message
  } catch {
    /* no socket — REST fallback */
  }
  return (await client.post(`/chats/${chatId}/messages`, { type: 'text', content: { text }, clientMessageId })).message
}

export const fetchAiThread = (limit = 50) => client.get('/chats/ai', { params: { limit } })
export const askAi = (text, clientMessageId) => client.post('/chats/ai/messages', { text, clientMessageId })

/* ---------------------------------------------------------------- kundli */

export async function searchPlaces(query) {
  const q = String(query || '').trim()
  if (q.length < 3) return []
  return (await client.get('/places/search', { params: { q }, auth: false })).items ?? []
}
export const createBirthProfile = (input) => client.post('/birth-profiles', input)
export const fetchCurrentKundli = () => client.get('/kundli/me')
export const fetchKundliOverview = (profileId) => client.get(`/kundli/${profileId}`)
export const fetchKundliDasha = (profileId) => client.get(`/kundli/${profileId}/dasha`)
export const fetchKundliAntardasha = (profileId, lord) => client.get(`/kundli/${profileId}/dasha/${lord}`)
export const fetchKundliDoshas = (profileId) => client.get(`/kundli/${profileId}/doshas`)
export const fetchKundliStrength = (profileId) => client.get(`/kundli/${profileId}/strength`)
export const fetchKundliRemedies = (profileId) => client.get(`/kundli/${profileId}/remedies`)
/**
 * Rule-engine reading for one life area, `domain` ∈ career | finance | health | marriage:
 * `{ profileId, domain, tiles: [{ label, value }], summary, factors: [{ title, text, tone, basis }],
 *   periods: [{ label, from: 'YYYY-MM', to, tone, reason }], scores, basedOn: [...], confidence, disclaimer }`.
 * Same not-ready status as the overview while the chart is still pending.
 */
export const fetchKundliAnalysis = (profileId, domain) => client.get(`/kundli/${profileId}/analysis/${domain}`)

/* ------------------------------------------------------------- horoscope */

export const fetchHoroscope = async (sign) => {
  const data = await client.get('/horoscope', { params: { sign }, auth: false })
  return sign ? data.horoscope : data
}
export const fetchDailyHoroscope = (sign, day) =>
  client.get('/horoscope/daily', { params: { sign: String(sign).toLowerCase(), day }, auth: false })
/** `{ sign, items: [{ partner_sign, percentage, report }] }`, best match first — cached forever server-side. */
export const fetchCompatibility = (sign) =>
  client.get('/horoscope/compatibility', { params: { sign: String(sign).toLowerCase() }, auth: false })

/* -------------------------------------------------------------- panchang */

/**
 * `date` as YYYY-MM-DD (yesterday … today+30, IST; default today) → the day's
 * panchang: `{ date, place, weekday, vaar, subline, sun, rahuKaal, tithi,
 * nakshatra, yoga, karana, choghadiya: { day, night }, … }`; works signed out.
 */
export const fetchPanchang = (date) => client.get('/panchang', { params: { date }, auth: false })

/* ------------------------------------------------ notifications, support */

export const fetchNotifications = (page = 1, limit = 50) => client.get('/notifications', { params: { page, limit } })
export const markNotificationsRead = (notificationId) => client.post('/notifications/read', { notificationId })
export const raiseTicket = async (issueType, description, chatId) =>
  (await client.post('/support/tickets', { issueType, description, chatId })).ticket
export const fetchTickets = (page = 1, limit = 20) => client.get('/support/tickets', { params: { page, limit } })

/* ------------------------------------------------------ store & orders */

/** `{ items, total, page, limit, categories: [{ key, label, count }] }`; works signed out. */
export const fetchProducts = (params = {}) => client.get('/products', { params, auth: false })
/** `{ product, related }` — `slug` may also be an id. */
export const fetchProduct = (slug) => client.get(`/products/${slug}`, { auth: false })

/**
 * Pays from the wallet. Throws ApiError with `code` `insufficient_balance`
 * (details `{ total, balance, shortfallAmount }`) or `out_of_stock`
 * (details `{ productId, available }`); 422 carries `fields`.
 */
export const createOrder = async (body) => (await client.post('/orders', body)).order
/** `status`: active | delivered | cancelled. */
export const fetchOrders = (params = {}) => client.get('/orders', { params: { limit: 50, ...params } })
/** Each item carries `review: { id, rating } | null` and `canReview` (delivered and not yet reviewed). */
export const fetchOrder = async (orderId) => (await client.get(`/orders/${orderId}`)).order
export const cancelOrder = async (orderId) => (await client.post(`/orders/${orderId}/cancel`, {})).order

/* ------------------------------------------------------- product reviews */

/**
 * `{ items: [{ id, rating, title, comment, reply, pinned, createdAt, reviewer: { name, avatarUrl }, verified }],
 *   total, page, limit, summary: { average, count, distribution: { "1"…"5" } } }` — pinned first, then
 * newest; `params` may carry `page`, `limit`, `rating`. Works signed out.
 */
export const fetchProductReviews = (slug, params = {}) =>
  client.get(`/products/${slug}/reviews`, { params, auth: false })

/**
 * Only after a delivered order that contains the product. `body` is
 * `{ orderId, rating, title?, comment }` → `{ review, product: { rating, ratingCount } }`.
 * Throws ApiError with `code` `already_reviewed` (409) the second time for the same order.
 */
/**
 * `{ orderId, rating, title?, comment, images?: File[] }` — sent as multipart
 * when photos are attached (field `images`, up to 3), plain JSON otherwise.
 */
export const submitProductReview = (slug, { images, ...body }) => {
  if (!images?.length) return client.post(`/products/${slug}/reviews`, body)
  const form = new FormData()
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value))
  })
  images.forEach((file) => form.append('images', file))
  return client.post(`/products/${slug}/reviews`, form)
}

/* -------------------------------------------------------- pujas & bookings */

/** `{ items, total, page, limit, categories }`; works signed out. */
export const fetchPujas = (params = {}) => client.get('/pujas', { params, auth: false })
export const fetchPuja = async (slug) => (await client.get(`/pujas/${slug}`, { auth: false })).puja
/** `date` as YYYY-MM-DD (today or later) → `{ date, slots: [{ time, available, left }] }`. */
export const fetchPujaSlots = (slug, date) => client.get(`/pujas/${slug}/slots`, { params: { date }, auth: false })

/** Throws ApiError with `code` `insufficient_balance` or `slot_full`. */
export const createPujaBooking = async (body) => (await client.post('/puja-bookings', body)).booking
/** `status`: upcoming | completed | cancelled. */
export const fetchPujaBookings = (params = {}) => client.get('/puja-bookings', { params: { limit: 50, ...params } })
export const fetchPujaBooking = async (bookingId) => (await client.get(`/puja-bookings/${bookingId}`)).booking
export const cancelPujaBooking = async (bookingId) => (await client.post(`/puja-bookings/${bookingId}/cancel`, {})).booking
export const ratePujaBooking = async (bookingId, rating, comment) =>
  (await client.post(`/puja-bookings/${bookingId}/rate`, comment ? { rating, comment } : { rating })).booking

/* ------------------------------------------------------------- articles */

/** `{ items, total, page, limit, categories: [{ key, count }] }`; the token (when signed in) unlocks users-only posts. */
export const fetchArticles = (params = {}) => client.get('/articles', { params })
export const fetchArticle = async (slug) => (await client.get(`/articles/${slug}`)).article

/* ---------------------------------------------------- offers & coupons */

/**
 * `{ coupons, festivals, loyalty: { tiers, earn, me? }, referral? }` — `me` and
 * `referral` only when signed in; works signed out.
 */
export const fetchOffers = () => client.get('/offers')

/**
 * `{ valid, coupon, discount, payable }` (+ `bonusAmount` for top-ups). Throws
 * ApiError with `code` `coupon_invalid` and a human message otherwise.
 */
export const validateCoupon = ({ code, context, amount }) =>
  client.post('/coupons/validate', { code: String(code || '').trim().toUpperCase(), context, amount })

/* ----------------------------------------------------- loyalty, referral */

/** `{ points, lifetimePoints, tier, nextTier, pointsToNext, cashbackPercent, history }`. */
export const fetchLoyalty = () => client.get('/loyalty')
export const fetchLoyaltyHistory = (page = 1, limit = 20) => client.get('/loyalty/history', { params: { page, limit } })
/** `{ code, link, rewardAmount, stats: { invited, completed, earned }, recent }`. */
export const fetchReferral = () => client.get('/referral')

/* -------------------------------------------------- reviews, testimonials */

/** `{ items, total, page, limit, summary }`; `rating`, `min`, `kind` optional; works signed out. */
export const fetchReviews = (params = {}) => client.get('/reviews', { params, auth: false })
/** `kind`: video | story → `{ items, total }` (published, sorted); works signed out. */
export const fetchTestimonials = (params = {}) => client.get('/testimonials', { params, auth: false })

/* --------------------------------------------------------------- careers */

/** `{ items, total, page, limit, departments: [{ key, label, count }] }`; open jobs only. */
export const fetchJobs = (params = {}) => client.get('/careers/jobs', { params, auth: false })
export const fetchJob = async (slug) => (await client.get(`/careers/jobs/${slug}`, { auth: false })).job

/**
 * Multipart: `{ jobId?, kind, roleTitle?, fullName, email, phone, experience, linkedin?, message?, resume? }`
 * (`resume` a File) → `{ id, reference, roleTitle, status }`.
 */
export async function submitApplication(input) {
  const form = input instanceof FormData ? input : new FormData()
  if (!(input instanceof FormData)) {
    Object.entries(input).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (key === 'resume') form.append('resume', value, value.name || 'resume.pdf')
      else form.append(key, String(value))
    })
  }
  return (await client.post('/careers/applications', form, { auth: false })).application
}
