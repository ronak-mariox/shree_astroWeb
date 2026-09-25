/**
 * Shared view-model for the directory card, the homepage card and the profile
 * page. Everything that turns a backend DirectoryCard / profile into strings
 * lives here so the three screens can never disagree.
 */
import { API_BASE_URL, joinLabels, titleCase } from '../../api/index.js'

const ASSET_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '')

/* --------------------------------------------------------- label → id maps */

/** Backend `expertise` ids that read badly through titleCase. */
const EXPERTISE_LABELS = {
  vedic: 'Vedic Astrology',
  'krishnamurti-paddhati': 'KP Astrology',
  'lal-kitab': 'Lal Kitab',
  nadi: 'Nadi Astrology',
  prashna: 'Prashna',
  horary: 'Horary',
  'face-reading': 'Face Reading',
  'life-coach': 'Life Coach',
  muhurat: 'Muhurat',
}

export const expertiseLabel = (id) => EXPERTISE_LABELS[id] ?? titleCase(id)
export const expertiseLabels = (ids) => (ids ?? []).map(expertiseLabel)

/** Backend `topics` ids → what the seeker reads. */
const TOPIC_LABELS = {
  'love-relationship': 'Love & Relationship',
  marriage: 'Marriage',
  'career-job': 'Career & Job',
  business: 'Business',
  education: 'Education',
  health: 'Health',
  'wealth-finance': 'Wealth & Finance',
  family: 'Family',
  'kundli-milan': 'Kundli Milan',
  muhurat: 'Muhurat',
  vastu: 'Vastu',
  general: 'General',
}
export const topicLabel = (id) => TOPIC_LABELS[id] ?? titleCase(id)

/** The Expertise checkboxes on /astrologers, in design order. */
export const EXPERTISE_FILTERS = [
  { id: 'vedic', label: 'Vedic Astrology' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'numerology', label: 'Numerology' },
  { id: 'vastu', label: 'Vastu' },
  { id: 'palmistry', label: 'Palmistry' },
  { id: 'lal-kitab', label: 'Lal Kitab' },
  { id: 'krishnamurti-paddhati', label: 'KP Astrology' },
]

/** The Language chips on /astrologers, in design order. */
export const LANGUAGE_FILTERS = [
  { id: 'hindi', label: 'Hindi' },
  { id: 'english', label: 'English' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'bengali', label: 'Bengali' },
  { id: 'gujarati', label: 'Gujarati' },
  { id: 'marathi', label: 'Marathi' },
]

/** The homepage category row → backend `topics` ("any of"). */
export const HOME_TOPIC_FILTERS = [
  { label: 'All', topics: [] },
  { label: 'Love', topics: ['love-relationship'] },
  { label: 'Career', topics: ['career-job'] },
  { label: 'Finance', topics: ['wealth-finance'] },
  { label: 'Education', topics: ['education'] },
  { label: 'Kids', topics: ['family'] },
  { label: 'Marriage', topics: ['marriage'] },
  { label: 'Legal', topics: ['general'] },
  { label: 'General Health', topics: ['health'] },
  { label: 'Students', topics: ['education'] },
  { label: 'Opportunities', topics: ['career-job', 'business'] },
]

/* ------------------------------------------------------------- formatting */

/** Backend photos may be relative `/uploads/...` paths. */
export function photoUrl(photo) {
  if (!photo) return ''
  const value = String(photo)
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return ASSET_ORIGIN + (value.startsWith('/') ? value : `/${value}`)
}

/** An inline SVG with the astrologer's initials, for accounts without a photo. */
export function initialsAvatar(name) {
  const initials =
    String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('') || '?'
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">` +
    `<rect width="200" height="200" fill="#f5edd6"/>` +
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" ` +
    `font-size="72" font-weight="700" fill="#c98a12">${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const photoOf = (astrologer) => photoUrl(astrologer?.photo) || initialsAvatar(astrologer?.name)

export const formatCount = (value) => Math.round(Number(value) || 0).toLocaleString('en-IN')

/** 2400 → "2.4k", 850 → "850". */
export function compactCount(value) {
  const n = Number(value) || 0
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

/** "4.9", or "New" for an astrologer nobody has rated yet. */
export const ratingLabel = (rating, ratingCount) =>
  (Number(rating) || 0) > 0 && (ratingCount === undefined || Number(ratingCount) > 0)
    ? (Number(rating) || 0).toFixed(1)
    : 'New'

export const consultationsLabel = (count) => (count > 0 ? `${formatCount(count)}+ Consultations` : 'New on Shree Astro')

export const waitMinutes = (seconds) => Math.max(1, Math.ceil((Number(seconds) || 0) / 60))

/** Online / Busy / Offline, from the card's presence fields. */
export function statusOf(astrologer) {
  if (!astrologer?.online) return { key: 'offline', label: 'Offline' }
  if (astrologer.busy) return { key: 'busy', label: 'Busy', waitMinutes: waitMinutes(astrologer.waitSeconds) }
  return { key: 'online', label: 'Online' }
}

/** A one-line description for the profile page's availability tab. */
export function availabilityText(astrologer) {
  const status = statusOf(astrologer)
  if (status.key === 'online') return 'Online now — start instantly'
  if (status.key === 'busy') return `Busy — wait ~${status.waitMinutes} min`
  return 'Offline right now'
}

/** `{ now, was }` — `was` only when there is a real discount. */
export function rateOf(rate) {
  if (!rate || !(rate.now > 0 || rate.was > 0)) return null
  const now = Number(rate.now ?? rate.was) || 0
  const was = Number(rate.was) || 0
  return { now, was: was > now ? was : null }
}

/** The headline price for a card: chat first, then call. */
export const priceOf = (rates) => rateOf(rates?.chat) ?? rateOf(rates?.call)

/** Everything a card renders, derived once from a DirectoryCard row. */
export function toCardView(astrologer) {
  const expertise = expertiseLabels(astrologer.expertise)
  const rating = Number(astrologer.rating) || 0
  return {
    id: astrologer.id,
    name: astrologer.name,
    photo: photoOf(astrologer),
    status: statusOf(astrologer),
    rating: ratingLabel(rating, astrologer.ratingCount),
    stars: Math.round(rating),
    experienceYears: Number(astrologer.experienceYears) || 0,
    languages: joinLabels(astrologer.languages),
    languagesList: (astrologer.languages ?? []).map(titleCase),
    skills: expertise.slice(0, 3),
    extraSkills: Math.max(0, expertise.length - 3),
    consultations: consultationsLabel(astrologer.consultations),
    price: priceOf(astrologer.rates),
    reviews: compactCount(astrologer.ratingCount),
    reviewCount: Number(astrologer.ratingCount) || 0,
    hasChat: Boolean(rateOf(astrologer.rates?.chat)),
    hasCall: Boolean(rateOf(astrologer.rates?.call)),
  }
}
