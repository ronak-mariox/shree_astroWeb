import { fetchKundliRemedies, fetchKundliStrength } from '../../../api/index.js'
import SectionStatus from './SectionStatus.jsx'
import { useSection } from './useSection.js'
import './LuckyTab.css'

const TITLE = 'Lucky Gemstones, Remedies & Planetary Strength'

const GEM_COLORS = ['#fef08a', '#bfdbfe', '#fecaca', '#bbf7d0', '#e9d5ff', '#fed7aa', '#e5e7eb']

export default function LuckyTab({ report = {} }) {
  const remedies = useSection(report, 'remedies', () => fetchKundliRemedies(report.profileId))
  const strength = useSection(report, 'strength', () => fetchKundliStrength(report.profileId))

  const list = remedies.data?.remedies ?? []
  const gems = list.filter((r) => r.type === 'gemstone')
  const pujas = list.filter((r) => r.type === 'puja')
  const bars = strength.data?.strength ?? []

  return (
    <div className="lucky-tab">
      <h2 className="lucky-tab__title">{TITLE}</h2>
      <div className="lucky-tab__grid">
        <div className="lucky-tab__column">
          <h4 className="lucky-tab__heading">Lucky Gemstones</h4>
          <SectionStatus section={remedies} label="Loading gemstone suggestions…" />
          {remedies.status === 'ready' && (
            <ul className="lucky-tab__list">
              {gems.map((gem, i) => (
                <li className="lucky-tab__item lucky-tab__item--stacked" key={gem.title}>
                  <div className="lucky-tab__item-head">
                    <span className="lucky-tab__dot" style={{ background: GEM_COLORS[i % GEM_COLORS.length] }} />
                    <span className="lucky-tab__label">{gem.title}</span>
                    {gem.planet && <span className="lucky-tab__tag">{gem.planet}</span>}
                  </div>
                  {gem.description && <p className="lucky-tab__text">{gem.description}</p>}
                  {gem.frequency && <p className="lucky-tab__meta">Wear on {gem.frequency}</p>}
                </li>
              ))}
              {gems.length === 0 && <li className="lucky-tab__text">No gemstone suggestions were reported.</li>}
            </ul>
          )}
        </div>

        <div className="lucky-tab__column">
          <h4 className="lucky-tab__heading">Suggested Pujas</h4>
          <SectionStatus section={remedies} label="Loading puja suggestions…" />
          {remedies.status === 'ready' && (
            <ul className="lucky-tab__list">
              {pujas.map((puja) => (
                <li className="lucky-tab__item lucky-tab__item--stacked" key={puja.title}>
                  <div className="lucky-tab__item-head">
                    <span className="lucky-tab__dot" style={{ background: '#f55102' }} />
                    <span className="lucky-tab__label">{puja.title}</span>
                  </div>
                  {puja.description && <p className="lucky-tab__text">{puja.description}</p>}
                </li>
              ))}
              {pujas.length === 0 && <li className="lucky-tab__text">No specific puja is suggested for your chart.</li>}
            </ul>
          )}
        </div>

        <div className="lucky-tab__column">
          <h4 className="lucky-tab__heading">Planetary Strength (Shadbala)</h4>
          <SectionStatus section={strength} label="Calculating planetary strength…" />
          {strength.status === 'ready' && (
            <ul className="lucky-tab__bars">
              {bars.map((row) => (
                <li className="lucky-tab__bar" key={row.planet}>
                  <div className="lucky-tab__bar-head">
                    <span className="lucky-tab__label">
                      {row.symbol ? `${row.symbol} ` : ''}
                      {row.planet}
                    </span>
                    <span className="lucky-tab__bar-value">{row.percentage}%</span>
                  </div>
                  <div className="lucky-tab__bar-track">
                    <span
                      className={`lucky-tab__bar-fill${row.percentage >= 100 ? ' lucky-tab__bar-fill--strong' : ''}`}
                      style={{ width: `${Math.max(0, Math.min(100, Number(row.percentage) || 0))}%` }}
                    />
                  </div>
                </li>
              ))}
              {bars.length === 0 && <li className="lucky-tab__text">Planetary strength was not reported.</li>}
            </ul>
          )}
          {strength.status === 'ready' && bars.length > 0 && (
            <p className="lucky-tab__meta">Percent of the classical minimum each planet needs to give full results.</p>
          )}
        </div>
      </div>
    </div>
  )
}
