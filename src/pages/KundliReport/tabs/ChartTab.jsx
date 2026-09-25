import { PLANET_SYMBOLS, ordinal } from './useSection.js'
import './ChartTab.css'

/** North Indian layout: which house each cell of the 4×4 fallback grid shows. */
const HOUSE_GRID = [
  { num: 12 },
  { num: 1 },
  { num: 2 },
  { num: 3 },
  { num: 11 },
  { centre: true },
  { fill: true },
  { num: 4 },
  { num: 10 },
  { fill: true },
  { fill: true },
  { num: 5 },
  { num: 9 },
  { num: 8 },
  { num: 7 },
  { num: 6 },
]

const SUMMARY_ICONS = { Lagna: '♈', Rashi: '☽', Nakshatra: '✦', Sun: '☉', Mars: '♂', Mercury: '☿', Jupiter: '♃' }

function summaryOf(overview) {
  const cards = []
  const keyPositions = overview?.keyPositions ?? []
  keyPositions.forEach((kp) => {
    if (kp.label === 'Lagna') {
      cards.push({ icon: SUMMARY_ICONS.Lagna, label: 'Lagna', value: kp.sign || overview?.lagna })
      cards.push({ icon: SUMMARY_ICONS.Nakshatra, label: 'Nakshatra', value: overview?.nakshatra })
    } else if (kp.label === 'Moon') {
      cards.push({ icon: SUMMARY_ICONS.Rashi, label: 'Rashi (Moon Sign)', value: kp.sign })
    } else {
      cards.push({ icon: SUMMARY_ICONS[kp.label] || '✦', label: `${kp.label} Sign`, value: kp.sign })
    }
  })
  if (!keyPositions.length) {
    cards.push({ icon: SUMMARY_ICONS.Lagna, label: 'Lagna', value: overview?.lagna })
    cards.push({ icon: SUMMARY_ICONS.Nakshatra, label: 'Nakshatra', value: overview?.nakshatra })
  }
  return cards.filter((c) => c.value)
}

export default function ChartTab({ report = {} }) {
  const { overview, birth } = report
  const positions = overview?.planetaryPositions ?? []
  const chartUrl = overview?.chart?.url || ''

  const planetsInHouse = (num) => positions.filter((p) => Number(p.house) === num).map((p) => p.planet)

  return (
    <div className="chart-tab">
      <div className="chart-tab__row">
        <div className="chart-tab__card chart-tab__card--chart">
          <h3 className="chart-tab__heading">Birth Chart (Lagna Kundli)</h3>

          {chartUrl ? (
            <img src={chartUrl} alt="North Indian birth chart with 12 houses" className="chart-tab__image" />
          ) : (
            <div className="chart-tab__kundli" role="img" aria-label="North Indian birth chart with 12 houses">
              {HOUSE_GRID.map((h, i) => {
                if (h.centre) {
                  return (
                    <div key={i} className="chart-tab__house chart-tab__house--centre">
                      <span className="chart-tab__wheel" aria-hidden="true">
                        ☸
                      </span>
                      <span className="chart-tab__centre-label">KUNDLI</span>
                    </div>
                  )
                }
                if (h.fill) {
                  return <div key={i} className="chart-tab__house chart-tab__house--fill" />
                }
                const planets = h.num === 1 ? ['Lagna', ...planetsInHouse(1)] : planetsInHouse(h.num)
                return (
                  <div key={i} className="chart-tab__house">
                    <span className="chart-tab__house-num">{h.num}</span>
                    {planets.map((p) => (
                      <span key={p} className="chart-tab__planet">
                        {p}
                      </span>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {birth && (birth.dob || birth.tob || birth.place) && (
            <p className="chart-tab__birth">
              <strong>DOB:</strong> {birth.dob || '—'} | <strong>TOB:</strong> {birth.tob || '—'} | <strong>POB:</strong>{' '}
              {birth.place || '—'}
            </p>
          )}
        </div>

        <div className="chart-tab__card chart-tab__card--positions">
          <h3 className="chart-tab__heading">Planetary Positions</h3>
          {positions.length === 0 ? (
            <p className="chart-tab__empty">Planetary positions are not available for this chart yet.</p>
          ) : (
            <table className="chart-tab__table">
              <thead className="chart-tab__sr-only">
                <tr>
                  <th scope="col">Planet</th>
                  <th scope="col">Sign</th>
                  <th scope="col">Nakshatra</th>
                  <th scope="col">House</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((row) => (
                  <tr key={row.planet} className="chart-tab__tr">
                    <td className="chart-tab__td chart-tab__td--planet">
                      {row.planet} {PLANET_SYMBOLS[row.planet] || ''}
                      {row.isRetrograde && (
                        <span className="chart-tab__retro" title="Retrograde" aria-label="Retrograde">
                          R
                        </span>
                      )}
                    </td>
                    <td className="chart-tab__td chart-tab__td--sign">{row.sign || '—'}</td>
                    <td className="chart-tab__td chart-tab__td--degree">{row.nakshatra || '—'}</td>
                    <td className="chart-tab__td chart-tab__td--house">{ordinal(row.house)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ul className="chart-tab__summary">
        {summaryOf(overview).map((s) => (
          <li key={s.label} className="chart-tab__summary-card">
            <span className="chart-tab__summary-icon" aria-hidden="true">
              {s.icon}
            </span>
            <div className="chart-tab__summary-body">
              <p className="chart-tab__summary-label">{s.label}</p>
              <p className="chart-tab__summary-value">{s.value}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
