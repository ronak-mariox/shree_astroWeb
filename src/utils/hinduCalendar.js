/**
 * Lightweight Hindu lunar calendar, computed locally (no API calls).
 *
 * Sun/Moon ecliptic longitudes come from the truncated series in Meeus,
 * "Astronomical Algorithms" (ch. 25 and 47) — good to ~0.3° for the Moon,
 * i.e. tithi boundaries within about half an hour. Tithi = 12° steps of the
 * Moon–Sun elongation, so the ayanamsa cancels; months use the Lahiri
 * ayanamsa to place the Sun in a sidereal sign (amanta scheme).
 *
 * Everything is evaluated for one fixed place (New Delhi) at IST, matching
 * the backend panchang location.
 */

const DEG = Math.PI / 180
const MS_PER_DAY = 86_400_000
const IST_OFFSET_MIN = 330

const PLACE = { latitude: 28.6139, longitude: 77.209 }

const norm = (deg) => ((deg % 360) + 360) % 360

/* ------------------------------------------------------------ time helpers */

/** Milliseconds since epoch for `YYYY-MM-DD` at `hour` (may exceed 24) IST. */
const istInstant = (iso, hour) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d) + (hour * 60 - IST_OFFSET_MIN) * 60_000
}

const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10)

export const addIsoDays = (iso, delta) => isoOf(istInstant(iso, 12) + delta * MS_PER_DAY)

export const isoDaysBetween = (fromIso, toIso) =>
  Math.round((istInstant(toIso, 12) - istInstant(fromIso, 12)) / MS_PER_DAY)

const julianDay = (ms) => ms / MS_PER_DAY + 2440587.5

const centuries = (jd) => (jd - 2451545) / 36525

/* ---------------------------------------------------------------- positions */

/** Geocentric true longitude of the Sun (degrees, tropical). */
export const sunLongitude = (jd) => {
  const T = centuries(jd)
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M)
  return norm(L0 + C)
}

/* [coefficient (1e-6 deg), D, M, M', F] — main terms of Meeus table 47.A */
const MOON_TERMS = [
  [6288774, 0, 0, 1, 0],
  [1274027, 2, 0, -1, 0],
  [658314, 2, 0, 0, 0],
  [213618, 0, 0, 2, 0],
  [-185116, 0, 1, 0, 0],
  [-114332, 0, 0, 0, 2],
  [58793, 2, 0, -2, 0],
  [57066, 2, -1, -1, 0],
  [53322, 2, 0, 1, 0],
  [45758, 2, -1, 0, 0],
  [-40923, 0, 1, -1, 0],
  [-34720, 1, 0, 0, 0],
  [-30383, 0, 1, 1, 0],
  [15327, 2, 0, 0, -2],
  [-12528, 0, 0, 1, 2],
  [10980, 0, 0, 1, -2],
  [10675, 4, 0, -1, 0],
  [10034, 0, 0, 3, 0],
  [8548, 4, 0, -2, 0],
  [-7888, 2, 1, -1, 0],
  [-6766, 2, 1, 0, 0],
  [-5163, 1, 0, -1, 0],
  [4987, 1, 1, 0, 0],
  [4036, 2, -1, 1, 0],
  [3994, 2, 0, 2, 0],
  [3861, 4, 0, 0, 0],
  [3665, 2, 0, -3, 0],
  [-2689, 0, 1, -2, 0],
  [-2602, 2, 0, -1, 2],
  [2390, 2, -1, -2, 0],
  [-2348, 1, 0, 1, 0],
  [2236, 2, -2, 0, 0],
  [-2120, 0, 1, 2, 0],
  [-2069, 0, 2, 0, 0],
  [2048, 2, -2, -1, 0],
  [-1773, 2, 0, 1, -2],
  [-1595, 2, 0, 0, 2],
  [1215, 4, -1, -1, 0],
  [-1110, 0, 0, 2, 2],
  [-892, 3, 0, -1, 0],
  [-810, 2, 1, 1, 0],
  [759, 4, -1, -2, 0],
  [-713, 0, 2, -1, 0],
  [-700, 2, 2, -1, 0],
  [691, 2, 1, -2, 0],
  [596, 2, -1, 0, -2],
  [549, 4, 0, 1, 0],
  [537, 0, 0, 4, 0],
  [520, 4, -1, 0, 0],
  [-487, 1, 0, -2, 0],
  [-399, 2, 1, 0, -2],
  [-381, 0, 0, 2, -2],
  [351, 1, 1, 1, 0],
  [-340, 3, 0, -2, 0],
  [330, 4, 0, -3, 0],
  [327, 2, -1, 2, 0],
  [-323, 0, 2, 1, 0],
  [299, 1, 1, -1, 0],
  [294, 2, 0, 3, 0],
]

/** Geocentric longitude of the Moon (degrees, tropical). */
export const moonLongitude = (jd) => {
  const T = centuries(jd)
  const T2 = T * T
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2
  const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T2) * DEG
  const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T2) * DEG
  const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T2) * DEG
  const F = (93.272095 + 483202.0175233 * T - 0.0036539 * T2) * DEG
  const E = 1 - 0.002516 * T - 0.0000074 * T2
  const A1 = (119.75 + 131.849 * T) * DEG
  const A2 = (53.09 + 479264.29 * T) * DEG

  let sum = 0
  for (const [coef, d, m, mp, f] of MOON_TERMS) {
    const factor = m === 0 ? 1 : m === 1 || m === -1 ? E : E * E
    sum += coef * factor * Math.sin(d * D + m * M + mp * Mp + f * F)
  }
  sum += 3958 * Math.sin(A1) + 1962 * Math.sin(Lp * DEG - F) + 318 * Math.sin(A2)
  return norm(Lp + sum / 1e6)
}

/** Lahiri ayanamsa, degrees (linear fit, fine for ±50 years around 2000). */
export const ayanamsa = (jd) => 23.853 + 1.3966 * centuries(jd)

/* ------------------------------------------------------------------- tithi */

export const elongationAt = (ms) => {
  const jd = julianDay(ms)
  return norm(moonLongitude(jd) - sunLongitude(jd))
}

/** Tithi number 1–30 (1–15 Shukla, 16–29 Krishna, 30 Amavasya) at an instant. */
export const tithiAt = (ms) => Math.floor(elongationAt(ms) / 12) + 1

/** Sidereal sign index 0–11 (Mesha … Meena) of the Sun at an instant. */
export const sunSignAt = (ms) => {
  const jd = julianDay(ms)
  return Math.floor(norm(sunLongitude(jd) - ayanamsa(jd)) / 30)
}

/* ----------------------------------------------------------------- sunrise */

/** Approximate local sunrise, as fractional IST hours, for the fixed place. */
export const sunriseHour = (iso, place = PLACE) => {
  const noonUtc = istInstant(iso, 12)
  const jd = julianDay(noonUtc)
  const lambda = sunLongitude(jd) * DEG
  const obliquity = 23.4393 * DEG
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(lambda))
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(lambda), Math.cos(lambda))
  const meanLongitude = norm(280.46646 + 36000.76983 * centuries(jd)) * DEG
  let equationOfTime = (meanLongitude - rightAscension) / DEG
  equationOfTime = ((equationOfTime + 180) % 360) - 180 // degrees → keep in (-180, 180]
  const solarNoon = 12 + (IST_OFFSET_MIN / 60) - place.longitude / 15 - (equationOfTime * 4) / 60

  const latitude = place.latitude * DEG
  const zenith = 90.833 * DEG
  const cosHourAngle =
    (Math.cos(zenith) - Math.sin(latitude) * Math.sin(declination)) /
    (Math.cos(latitude) * Math.cos(declination))
  const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosHourAngle))) / DEG
  return solarNoon - hourAngle / 15
}

const tithiAtSunrise = (iso) => tithiAt(istInstant(iso, sunriseHour(iso)))

/* ------------------------------------------------------------------ months */

export const MONTH_NAMES = [
  'Chaitra',
  'Vaishakha',
  'Jyeshtha',
  'Ashadha',
  'Shravana',
  'Bhadrapada',
  'Ashwin',
  'Kartika',
  'Margashirsha',
  'Pausha',
  'Magha',
  'Phalguna',
]

/** Elongation folded to (-180, 180] so a new moon is a zero crossing. */
const foldedElongation = (ms) => ((elongationAt(ms) + 180) % 360) - 180

/** Instant of the first new moon strictly after `ms` (`direction` -1 → last one before). */
const newMoonInstant = (ms, direction = 1) => {
  let a = ms
  let ga = foldedElongation(a)
  for (let i = 0; i < 40; i += 1) {
    const b = a + direction * MS_PER_DAY
    const gb = foldedElongation(b)
    // Crossing: folded value jumps from negative (approaching) to positive (just past).
    const crossed = direction === 1 ? ga < 0 && gb >= 0 && gb - ga < 180 : gb < 0 && ga >= 0 && ga - gb < 180
    if (crossed) {
      let lo = direction === 1 ? a : b
      let hi = direction === 1 ? b : a
      for (let k = 0; k < 40; k += 1) {
        const mid = (lo + hi) / 2
        if (foldedElongation(mid) < 0) lo = mid
        else hi = mid
      }
      return (lo + hi) / 2
    }
    a = b
    ga = gb
  }
  return a
}

/** Amanta month of a date: `{ index, name, adhika }`. */
export const lunarMonthOf = (iso) => {
  const sunrise = istInstant(iso, sunriseHour(iso))
  const endsAt = newMoonInstant(sunrise, 1)
  const startedAt = newMoonInstant(sunrise, -1)
  const endSign = sunSignAt(endsAt)
  const startSign = sunSignAt(startedAt)
  const adhika = endSign === startSign
  const index = (endSign + (adhika ? 1 : 0)) % 12
  return { index, name: MONTH_NAMES[index], adhika }
}

/* ------------------------------------------------------------- sacred days */

/* [Shukla, Krishna] Ekadashi names per purnimanta month (the common listing). */
const EKADASHI_NAMES = [
  ['Kamada', 'Papmochani'],
  ['Mohini', 'Varuthini'],
  ['Nirjala', 'Apara'],
  ['Devshayani', 'Yogini'],
  ['Shravana Putrada', 'Kamika'],
  ['Parivartini', 'Aja'],
  ['Papankusha', 'Indira'],
  ['Devutthana', 'Rama'],
  ['Mokshada', 'Utpanna'],
  ['Pausha Putrada', 'Saphala'],
  ['Jaya', 'Shattila'],
  ['Amalaki', 'Vijaya'],
]

const SPECIAL_DAYS = {
  'Bhadrapada-30': 'Sarva Pitru Amavasya — Shraddha and tarpan for ancestors',
  'Ashwin-30': 'Diwali (Lakshmi Puja) — Amavasya of lights',
  'Ashwin-15': 'Sharad Purnima — Kheer under moonlight, Lakshmi worship',
  'Kartika-15': 'Dev Deepawali & Guru Nanak Jayanti — Lamps, charity',
  'Ashadha-15': 'Guru Purnima — Honouring gurus and teachers',
  'Shravana-15': 'Raksha Bandhan — Sibling bond, Shravani Upakarma',
  'Phalguna-15': 'Holika Dahan — Bonfire on the eve of Holi',
  'Vaishakha-15': 'Buddha Purnima — Birth of Gautama Buddha',
  'Chaitra-15': 'Hanuman Jayanti — Hanuman worship, Sundarkand',
  'Kartika-11': 'Devutthana (Prabodhini) Ekadashi — Tulsi Vivah, marriages resume',
  'Ashadha-11': 'Devshayani Ekadashi — Start of Chaturmas',
  'Jyeshtha-11': 'Nirjala Ekadashi — Waterless fast, most rewarding Ekadashi',
  'Margashirsha-11': 'Mokshada Ekadashi — Gita Jayanti',
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const weekdayOf = (iso) => WEEKDAYS[new Date(istInstant(iso, 12)).getUTCDay()]

const describeSacredDay = (tithi, month) => {
  const special = SPECIAL_DAYS[`${month.name}-${tithi}`]
  if (special && !month.adhika) return special
  const prefix = month.adhika ? `Adhika ${month.name}` : month.name
  if (tithi === 30) return `${prefix} Amavasya — Shraddha, tarpan and quiet reflection`
  if (tithi === 15) return `${prefix} Purnima — Satyanarayan puja, charity and meditation`
  // Amanta Krishna paksha = purnimanta next month's Krishna paksha.
  const name = month.adhika
    ? tithi === 11
      ? 'Padmini'
      : 'Parama'
    : tithi === 11
      ? EKADASHI_NAMES[month.index][0]
      : EKADASHI_NAMES[(month.index + 1) % 12][1]
  return `${name} Ekadashi — Fasting and Lord Vishnu worship`
}

const SACRED_TITHIS = { 11: 'Ekadashi', 26: 'Ekadashi', 15: 'Purnima', 30: 'Amavasya' }

/**
 * Next `count` Ekadashi / Purnima / Amavasya on or after `fromIso`
 * (tithi prevailing at sunrise). `[{ date, name, weekday, desc, kind }]`.
 */
export const upcomingSacredDays = (fromIso, count = 4) => {
  const out = []
  let cursor = fromIso
  let lastTithi = tithiAtSunrise(addIsoDays(fromIso, -1))
  for (let i = 0; i < 120 && out.length < count; i += 1) {
    const tithi = tithiAtSunrise(cursor)
    const kind = SACRED_TITHIS[tithi]
    if (kind && tithi !== lastTithi) {
      const month = lunarMonthOf(cursor)
      out.push({
        date: cursor,
        kind,
        name: kind === 'Ekadashi' && out.every((row) => row.kind !== 'Ekadashi') ? 'Next Ekadashi' : kind,
        weekday: weekdayOf(cursor),
        desc: describeSacredDay(tithi, month),
      })
    }
    lastTithi = tithi
    cursor = addIsoDays(cursor, 1)
  }
  return out
}

/* --------------------------------------------------------------- festivals */

/**
 * Rule: amanta month name, tithi (1–30), evaluation time (`sunrise` = udaya
 * tithi, or an IST hour such as 18.5 for pradosh, 24 for nishita) and an
 * optional day offset. Solar festivals give a sidereal sign instead.
 */
export const FESTIVAL_RULES = [
  { key: 'makar-sankranti', name: 'Makar Sankranti', tag: 'Festival', sign: 9 },
  { key: 'vasant-panchami', name: 'Vasant Panchami', tag: 'Festival', month: 'Magha', tithi: 5, at: 10 },
  { key: 'maha-shivratri', name: 'Maha Shivratri', tag: 'Major Festival', month: 'Magha', tithi: 29, at: 24 },
  { key: 'holika-dahan', name: 'Holika Dahan', tag: 'Festival', month: 'Phalguna', tithi: 15, at: 18.5 },
  { key: 'holi', name: 'Holi', tag: 'Major Festival', month: 'Phalguna', tithi: 15, at: 18.5, offset: 1 },
  { key: 'chaitra-navratri', name: 'Chaitra Navratri Begins', tag: 'Festival', month: 'Chaitra', tithi: 1 },
  { key: 'ram-navami', name: 'Ram Navami', tag: 'Major Festival', month: 'Chaitra', tithi: 9, at: 12.5 },
  { key: 'hanuman-jayanti', name: 'Hanuman Jayanti', tag: 'Festival', month: 'Chaitra', tithi: 15 },
  { key: 'akshaya-tritiya', name: 'Akshaya Tritiya', tag: 'Festival', month: 'Vaishakha', tithi: 3, at: 10 },
  { key: 'buddha-purnima', name: 'Buddha Purnima', tag: 'Festival', month: 'Vaishakha', tithi: 15 },
  { key: 'guru-purnima', name: 'Guru Purnima', tag: 'Festival', month: 'Ashadha', tithi: 15 },
  { key: 'nag-panchami', name: 'Nag Panchami', tag: 'Festival', month: 'Shravana', tithi: 5 },
  { key: 'raksha-bandhan', name: 'Raksha Bandhan', tag: 'Major Festival', month: 'Shravana', tithi: 15, at: 15 },
  { key: 'janmashtami', name: 'Krishna Janmashtami', tag: 'Major Festival', month: 'Shravana', tithi: 23, at: 24 },
  { key: 'hartalika-teej', name: 'Hartalika Teej', tag: 'Festival', month: 'Bhadrapada', tithi: 3 },
  { key: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', tag: 'Major Festival', month: 'Bhadrapada', tithi: 4, at: 12.5 },
  { key: 'anant-chaturdashi', name: 'Anant Chaturdashi', tag: 'Festival', month: 'Bhadrapada', tithi: 14 },
  { key: 'pitru-paksha', name: 'Pitru Paksha Begins', tag: 'Paksha', month: 'Bhadrapada', tithi: 16 },
  { key: 'mahalaya', name: 'Sarva Pitru Amavasya', tag: 'Paksha', month: 'Bhadrapada', tithi: 30 },
  { key: 'navratri', name: 'Sharad Navratri Begins', tag: 'Major Festival', month: 'Ashwin', tithi: 1 },
  { key: 'durga-ashtami', name: 'Durga Ashtami', tag: 'Festival', month: 'Ashwin', tithi: 8 },
  { key: 'dussehra', name: 'Dussehra', tag: 'Major Festival', month: 'Ashwin', tithi: 10, at: 15 },
  { key: 'sharad-purnima', name: 'Sharad Purnima', tag: 'Festival', month: 'Ashwin', tithi: 15 },
  { key: 'karwa-chauth', name: 'Karwa Chauth', tag: 'Festival', month: 'Ashwin', tithi: 19, at: 20 },
  { key: 'dhanteras', name: 'Dhanteras', tag: 'Festival', month: 'Ashwin', tithi: 28, at: 18.5 },
  { key: 'diwali', name: 'Diwali', tag: 'Major Festival', month: 'Ashwin', tithi: 30, at: 18.5 },
  { key: 'govardhan-puja', name: 'Govardhan Puja', tag: 'Festival', month: 'Kartika', tithi: 1 },
  { key: 'bhai-dooj', name: 'Bhai Dooj', tag: 'Festival', month: 'Kartika', tithi: 2, at: 15 },
  { key: 'chhath', name: 'Chhath Puja', tag: 'Major Festival', month: 'Kartika', tithi: 6 },
  { key: 'tulsi-vivah', name: 'Devutthana Ekadashi', tag: 'Festival', month: 'Kartika', tithi: 11 },
  { key: 'dev-deepawali', name: 'Dev Deepawali', tag: 'Festival', month: 'Kartika', tithi: 15 },
  { key: 'gita-jayanti', name: 'Gita Jayanti', tag: 'Festival', month: 'Margashirsha', tithi: 11 },
]

const tithiForRule = (iso, rule) =>
  rule.at == null ? tithiAtSunrise(iso) : tithiAt(istInstant(iso, rule.at))

/**
 * Festivals from `fromIso` onwards for the next `horizonDays`, sorted by date.
 * `[{ key, name, tag, date }]` — one entry per rule per lunar month.
 */
export const upcomingFestivals = (fromIso, horizonDays = 400) => {
  const found = []
  const seen = new Set()
  const monthCache = new Map()
  const monthOf = (iso) => {
    if (!monthCache.has(iso)) monthCache.set(iso, lunarMonthOf(iso))
    return monthCache.get(iso)
  }

  const previous = new Map()
  for (const rule of FESTIVAL_RULES) {
    previous.set(rule.key, rule.sign == null ? tithiForRule(addIsoDays(fromIso, -1), rule) : null)
  }
  const SUNSET = 18
  let lastSign = sunSignAt(istInstant(addIsoDays(fromIso, -1), SUNSET))

  let cursor = fromIso
  for (let i = 0; i <= horizonDays; i += 1) {
    const signToday = sunSignAt(istInstant(cursor, SUNSET))
    let month = null
    for (const rule of FESTIVAL_RULES) {
      if (rule.sign != null) {
        if (signToday === rule.sign && lastSign !== rule.sign) found.push({ ...rule, date: cursor })
        continue
      }
      const tithi = tithiForRule(cursor, rule)
      const before = previous.get(rule.key)
      previous.set(rule.key, tithi)
      // Udaya rule with a skipped (kshaya) tithi: it fell wholly inside yesterday → still count today.
      const skipped = before === ((rule.tithi + 28) % 30) + 1 && tithi === (rule.tithi % 30) + 1
      const hit = tithi === rule.tithi || (rule.at == null && skipped)
      if (!hit || before === rule.tithi) continue
      month = month ?? monthOf(cursor)
      if (month.adhika || month.name !== rule.month) continue
      const date = rule.offset ? addIsoDays(cursor, rule.offset) : cursor
      const dedupe = `${rule.key}:${month.name}:${date.slice(0, 4)}`
      if (seen.has(dedupe)) continue
      seen.add(dedupe)
      found.push({ key: rule.key, name: rule.name, tag: rule.tag, date })
    }
    lastSign = signToday
    cursor = addIsoDays(cursor, 1)
  }
  return found.filter((row) => row.date >= fromIso).sort((a, b) => (a.date < b.date ? -1 : 1))
}

/* ---------------------------------------------------------------- muhurats */

const MUHURAT_RULES = [
  { key: 'akshaya-tritiya', name: 'Business Start', desc: 'Akshaya Tritiya — buy gold, start ventures, property' },
  { key: 'dhanteras', name: 'Vehicle & Gold Purchase', desc: 'Dhanteras — auspicious for buying vehicles and metals' },
  { key: 'tulsi-vivah', name: 'Vivah Muhurat Season Opens', desc: 'Devutthana Ekadashi — marriages resume after Chaturmas' },
  { key: 'vasant-panchami', name: 'Griha Pravesh', desc: 'Vasant Panchami — abujha muhurat for housewarming' },
  { key: 'govardhan-puja', name: 'New Beginnings', desc: 'Kartika Shukla Pratipada — new accounts, shop openings' },
  { key: 'ram-navami', name: 'Griha Pravesh', desc: 'Ram Navami — favoured for entering a new home' },
]

/** Next `count` all-purpose muhurat days derived from the festival rules. */
export const upcomingMuhurats = (fromIso, count = 4, festivals = upcomingFestivals(fromIso)) => {
  const byKey = new Map()
  for (const festival of festivals) if (!byKey.has(festival.key)) byKey.set(festival.key, festival.date)
  return MUHURAT_RULES.filter((rule) => byKey.has(rule.key))
    .map((rule) => ({ ...rule, date: byKey.get(rule.key) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, count)
}
