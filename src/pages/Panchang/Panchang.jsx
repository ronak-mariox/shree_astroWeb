import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPanchang, messageOf } from '../../api/index.js'
import { Bone, PageError } from '../../components/ui/PageState.jsx'
import iconCalendar from '../../assets/pages/panchang/icon-calendar.svg'
import ganeshChaturthi from '../../assets/pages/panchang/ganesh-chaturthi.jpg'
import pitruPaksha from '../../assets/pages/panchang/pitru-paksha.jpg'
import navratri from '../../assets/pages/panchang/navratri.jpg'
import dussehra from '../../assets/pages/panchang/dussehra.jpg'
import diwali from '../../assets/pages/panchang/diwali.jpg'
import rakshaBandhan from '../../assets/home/festival-calendar/raksha-bandhan.jpg'
import janmashtami from '../../assets/home/festival-calendar/janmashtami.jpg'
import genericFestival from '../../assets/pages/puja/personalised-puja.jpg'
import { isoDaysBetween, upcomingFestivals, upcomingMuhurats, upcomingSacredDays } from '../../utils/hinduCalendar.js'
import './Panchang.css'

/* Festival photos by rule key (see utils/hinduCalendar.js); others share a generic one. */
const FESTIVAL_IMAGES = {
  'ganesh-chaturthi': ganeshChaturthi,
  'pitru-paksha': pitruPaksha,
  mahalaya: pitruPaksha,
  navratri,
  'chaitra-navratri': navratri,
  'durga-ashtami': navratri,
  dussehra,
  diwali,
  dhanteras: diwali,
  'dev-deepawali': diwali,
  'govardhan-puja': diwali,
  'bhai-dooj': diwali,
  'raksha-bandhan': rakshaBandhan,
  janmashtami,
}

const festivalImage = (key) => FESTIVAL_IMAGES[key] ?? genericFestival

const RATING_CLASS = { Good: 'good', Bad: 'bad', Excellent: 'excellent', Neutral: 'neutral' }

const TILE_ICONS = { tithi: '①', nakshatra: '✦', yoga: '◎', karana: '◆', vaar: '☿' }

const SUN_TONES = ['sunrise', 'sunset', 'rahu']

const SLOT_COUNT = 8

/** Backend window: yesterday … today+30 (IST). */
const MIN_OFFSET_DAYS = -1
const MAX_OFFSET_DAYS = 30

/* ------------------------------------------------------------- IST helpers */

const IST_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })
const IST_CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
})

/** Today as YYYY-MM-DD in IST. */
const istToday = (now = new Date()) => IST_DATE.format(now)

/** Minutes since midnight in IST. */
const istMinutes = (now = new Date()) => {
  const parts = IST_CLOCK.formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value) % 24
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)
  return hour * 60 + minute
}

/** 'YYYY-MM-DD' ± days → 'YYYY-MM-DD' (calendar math in UTC, so no DST drift). */
const addDays = (iso, delta) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
}

const formatLongDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

/** 'h:mm AM/PM' → minutes since midnight; null when unparsable. */
const toMinutes = (clock) => {
  const match = /^\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*$/i.exec(String(clock || ''))
  if (!match) return null
  const hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  return hours * 60 + Number(match[2])
}

const MINUTES_PER_DAY = 24 * 60

/**
 * Index of the slot containing `minutes` (IST minutes since midnight). The list
 * runs from its first start (sunrise for day, sunset for night); any start
 * earlier than that is past midnight and belongs to tomorrow, so it's shifted
 * by a day and never matches the current clock.
 */
const currentSlotIndex = (slots, minutes) => {
  const first = toMinutes(slots[0]?.start)
  if (first === null) return -1
  return slots.findIndex((slot) => {
    let start = toMinutes(slot.start)
    let end = toMinutes(slot.end)
    if (start === null || end === null) return false
    if (start < first) start += MINUTES_PER_DAY
    if (end <= start) end += MINUTES_PER_DAY
    return minutes >= start && minutes < end
  })
}

const parseIsoDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const shortDate = (iso) =>
  parseIsoDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const daysText = (days) => (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`)

const FESTIVALS_SHOWN = 6

/* ------------------------------------------------------- response mapping */

const DASH = '—'

const endsText = (part) => {
  if (!part?.endsAt) return DASH
  return `Ends ${part.endsAt}${part.endsNextDay ? ' (Next day)' : ''}`
}

const rangeText = (range) => (range?.start && range?.end ? `${range.start} – ${range.end}` : DASH)

const sunTiles = (data) => [
  { label: 'Sunrise', value: data?.sun?.sunrise || DASH, tone: 'sunrise' },
  { label: 'Sunset', value: data?.sun?.sunset || DASH, tone: 'sunset' },
  { label: 'Rahu Kaal', value: rangeText(data?.rahuKaal), tone: 'rahu' },
]

const panchangTiles = (data) => [
  { key: 'tithi', label: 'Tithi', value: data?.tithi?.name || DASH, sub: endsText(data?.tithi) },
  { key: 'nakshatra', label: 'Nakshatra', value: data?.nakshatra?.name || DASH, sub: endsText(data?.nakshatra) },
  { key: 'yoga', label: 'Yoga', value: data?.yoga?.name || DASH, sub: endsText(data?.yoga) },
  { key: 'karana', label: 'Karana', value: data?.karana?.name || DASH, sub: endsText(data?.karana) },
  { key: 'vaar', label: 'Var', value: data?.vaar || DASH, sub: data?.weekday || DASH },
]

/* -------------------------------------------------------------- skeletons */

function SunSkeleton() {
  return SUN_TONES.map((tone) => (
    <div key={tone} className={`panchang-page__sun-tile panchang-page__sun-tile--${tone}`} aria-hidden="true">
      <Bone style={{ width: 52, height: 11 }} />
      <Bone style={{ width: 68, height: 16, marginTop: 6 }} />
    </div>
  ))
}

function TilesSkeleton() {
  return Object.keys(TILE_ICONS).map((key) => (
    <article key={key} className="panchang-page__tile" aria-hidden="true">
      <Bone style={{ width: 36, height: 36, borderRadius: 10 }} />
      <Bone style={{ width: '45%', height: 11, marginTop: 14 }} />
      <Bone style={{ width: '70%', height: 18, marginTop: 8 }} />
      <Bone style={{ width: '55%', height: 11, marginTop: 6 }} />
    </article>
  ))
}

function SlotsSkeleton() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => (
    <li key={index} className="panchang-page__slot" aria-hidden="true">
      <span className="panchang-page__slot-time">
        <Bone style={{ width: 112, height: 12 }} />
      </span>
      <span className="panchang-page__slot-body">
        <Bone style={{ width: '38%', height: 13 }} />
        <Bone style={{ width: '60%', height: 11, marginTop: 6 }} />
      </span>
      <Bone style={{ width: 56, height: 22, borderRadius: 100 }} />
    </li>
  ))
}

/* ------------------------------------------------------------------ page */

export default function Panchang() {
  const [now, setNow] = useState(() => new Date())
  const [date, setDate] = useState(() => istToday())
  const [cache, setCache] = useState({})
  const [failure, setFailure] = useState({ key: '', message: '' })
  const [tick, setTick] = useState(0)
  const [period, setPeriod] = useState('day')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const requestKey = `${date}|${tick}`
  const data = cache[date]
  const error = failure.key === requestKey ? failure.message : ''
  const loading = !data && !error

  useEffect(() => {
    if (cache[date]) return undefined
    let cancelled = false
    fetchPanchang(date)
      .then((result) => {
        if (cancelled) return
        setCache((prev) => ({ ...prev, [date]: result }))
      })
      .catch((err) => {
        if (!cancelled) setFailure({ key: requestKey, message: messageOf(err, 'Could not load the panchang.') })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, requestKey])

  const today = istToday(now)
  const minDate = addDays(today, MIN_OFFSET_DAYS)
  const maxDate = addDays(today, MAX_OFFSET_DAYS)
  const isToday = date === today

  const slots = useMemo(() => {
    const list = data?.choghadiya?.[period]
    return Array.isArray(list) ? list : []
  }, [data, period])

  const nowIndex = useMemo(() => (isToday ? currentSlotIndex(slots, istMinutes(now)) : -1), [isToday, slots, now])

  /* Sacred days, muhurats and festivals are computed locally from today's date (IST). */
  const calendar = useMemo(() => {
    const festivals = upcomingFestivals(today)
    return {
      sacredDays: upcomingSacredDays(today, 4),
      muhurats: upcomingMuhurats(today, 4, festivals),
      festivals: festivals.slice(0, FESTIVALS_SHOWN).map((festival) => ({
        ...festival,
        image: festivalImage(festival.key),
        dateLabel: shortDate(festival.date),
        daysLeft: isoDaysBetween(today, festival.date),
      })),
    }
  }, [today])

  const shiftDate = (delta) => {
    setDate((prev) => {
      const next = addDays(prev, delta)
      return next < minDate || next > maxDate ? prev : next
    })
  }

  const retry = () => setTick((value) => value + 1)

  return (
    <section className="panchang-page">
      <div className="panchang-page__hero">
        <div className="container">
          <div className="panchang-page__inner panchang-page__hero-inner">
            <div className="panchang-page__hero-text">
              <span className="panchang-page__pill">
                <img src={iconCalendar} alt="" className="panchang-page__pill-icon" />
                Today&apos;s Panchang
              </span>
              <h1 className="panchang-page__title">
                Panchang —{' '}
                <span className="panchang-page__date-nav">
                  <button
                    type="button"
                    className="panchang-page__date-btn"
                    onClick={() => shiftDate(-1)}
                    disabled={date <= minDate}
                    aria-label="Previous day"
                  >
                    ‹
                  </button>
                  <span className="panchang-page__title-accent">{formatLongDate(date)}</span>
                  <button
                    type="button"
                    className="panchang-page__date-btn"
                    onClick={() => shiftDate(1)}
                    disabled={date >= maxDate}
                    aria-label="Next day"
                  >
                    ›
                  </button>
                </span>
              </h1>
              {loading ? (
                <Bone style={{ width: 300, maxWidth: '100%', height: 15, marginTop: 12 }} />
              ) : (
                <p className="panchang-page__subline">{data?.subline || (error ? 'Panchang unavailable' : DASH)}</p>
              )}
            </div>

            <div className="panchang-page__sun">
              {loading ? (
                <SunSkeleton />
              ) : (
                sunTiles(data).map((item) => (
                  <div key={item.label} className={`panchang-page__sun-tile panchang-page__sun-tile--${item.tone}`}>
                    <span className="panchang-page__sun-label">{item.label}</span>
                    <span className="panchang-page__sun-value">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="panchang-page__inner">
          {error ? (
            <div className="panchang-page__error">
              <PageError message={error} onRetry={retry} />
            </div>
          ) : (
            <div className="panchang-page__tiles">
              {loading ? (
                <TilesSkeleton />
              ) : (
                panchangTiles(data).map((tile) => (
                  <article key={tile.key} className="panchang-page__tile">
                    <span className="panchang-page__tile-icon" aria-hidden="true">
                      {TILE_ICONS[tile.key]}
                    </span>
                    <span className="panchang-page__tile-label">{tile.label}</span>
                    <span className="panchang-page__tile-value">{tile.value}</span>
                    <span className="panchang-page__tile-sub">{tile.sub}</span>
                  </article>
                ))
              )}
            </div>
          )}

          <div className="panchang-page__columns">
            <section className="panchang-page__card panchang-page__card--choghadiya">
              <div className="panchang-page__choghadiya-head">
                <h3 className="panchang-page__card-title">Today&apos;s Choghadiya</h3>
                <div className="panchang-page__toggle" role="tablist" aria-label="Choghadiya period">
                  {['day', 'night'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={period === key}
                      className={`panchang-page__toggle-btn${period === key ? ' panchang-page__toggle-btn--active' : ''}`}
                      onClick={() => setPeriod(key)}
                    >
                      {key === 'day' ? 'Day' : 'Night'}
                    </button>
                  ))}
                </div>
              </div>
              {error ? (
                <p className="panchang-page__slots-empty">Choghadiya unavailable for this day.</p>
              ) : (
                <ul className="panchang-page__slots">
                  {loading ? (
                    <SlotsSkeleton />
                  ) : (
                    slots.map((slot, index) => {
                      const active = index === nowIndex
                      const quality = slot.quality || 'Neutral'
                      return (
                        <li
                          key={`${slot.start}-${slot.end}-${index}`}
                          className={`panchang-page__slot${active ? ' panchang-page__slot--active' : ''}`}
                        >
                          <span className="panchang-page__slot-time">{rangeText(slot)}</span>
                          <span className="panchang-page__slot-body">
                            <span className="panchang-page__slot-name">{slot.name || DASH}</span>
                            <span className="panchang-page__slot-desc">{slot.desc || ''}</span>
                          </span>
                          <span
                            className={`panchang-page__badge panchang-page__badge--${RATING_CLASS[quality] || 'neutral'}`}
                          >
                            {quality}
                          </span>
                          {active && <span className="panchang-page__now">NOW</span>}
                        </li>
                      )
                    })
                  )}
                  {!loading && slots.length === 0 && (
                    <li className="panchang-page__slots-empty">No {period} choghadiya available.</li>
                  )}
                </ul>
              )}
            </section>

            <div className="panchang-page__side">
              <section className="panchang-page__card panchang-page__card--side">
                <h3 className="panchang-page__card-title">
                  Auspicious Muhurats
                </h3>
                <ul className="panchang-page__list">
                  {calendar.muhurats.map((item) => (
                    <li key={item.key} className="panchang-page__muhurat">
                      <span className="panchang-page__muhurat-dot" aria-hidden="true" />
                      <span className="panchang-page__muhurat-body">
                        <span className="panchang-page__muhurat-name">{item.name}</span>
                        <span className="panchang-page__muhurat-date">{shortDate(item.date)}</span>
                        <span className="panchang-page__muhurat-desc">{item.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panchang-page__card panchang-page__card--side">
                <h3 className="panchang-page__card-title">
                  Upcoming Sacred Days
                </h3>
                <ul className="panchang-page__list">
                  {calendar.sacredDays.map((item) => (
                    <li key={item.date} className="panchang-page__sacred">
                      <span className="panchang-page__sacred-date">
                        <span className="panchang-page__sacred-day">{Number(item.date.slice(8))},</span>
                        <span className="panchang-page__sacred-month">
                          {parseIsoDate(item.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </span>
                      <span className="panchang-page__sacred-body">
                        <span className="panchang-page__sacred-name">
                          {item.name} <span className="panchang-page__sacred-weekday">({item.weekday})</span>
                        </span>
                        <span className="panchang-page__sacred-desc">{item.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <section className="panchang-page__card panchang-page__card--festivals">
            <div className="panchang-page__festivals-head">
              <h3 className="panchang-page__card-title">
                Upcoming Hindu Festivals
              </h3>
              <Link to="/panchang#festivals" className="panchang-page__festivals-link">
                View Full Calendar →
              </Link>
            </div>
            <div className="panchang-page__festivals" id="festivals">
              {calendar.festivals.map((festival) => (
                <article key={`${festival.key}-${festival.date}`} className="panchang-page__festival">
                  <div className="panchang-page__festival-media">
                    <img src={festival.image} alt={festival.name} />
                  </div>
                  <div className="panchang-page__festival-body">
                    <span className="panchang-page__festival-tag">{festival.tag}</span>
                    <span className="panchang-page__festival-name">{festival.name}</span>
                    <span className="panchang-page__festival-date">{festival.dateLabel}</span>
                    <span className="panchang-page__festival-days">{daysText(festival.daysLeft)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {data?.place?.label && <p className="panchang-page__place">Panchang for {data.place.label}</p>}
        </div>
      </div>
    </section>
  )
}
