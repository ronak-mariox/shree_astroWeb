import { useState } from 'react'
import { fetchKundliAntardasha, fetchKundliDasha } from '../../../api/index.js'
import SectionStatus from './SectionStatus.jsx'
import { monthYear, useSection } from './useSection.js'
import './MahadashaTab.css'

const TITLE = 'Mahadasha & Antardasha'

/** General significations of each dasha lord — reference text, not chart-specific. */
const LORD_NOTES = {
  Sun: 'Authority, vitality, recognition and the father. A period for leadership and public standing.',
  Moon: 'Emotions, mind, home and the mother. Sensitivity, travel and public dealings come to the fore.',
  Mars: 'Energy, courage, property and conflict. Action-oriented, favours initiative and discipline.',
  Mercury: 'Communication, intellect, business acumen. Good for commerce, learning and analytical work.',
  Jupiter: 'Expansion, wisdom, education, spiritual growth. Favorable for career advancement and long-term investments.',
  Venus: 'Relationships, comfort, arts and luxury. Marriage, creativity and material pleasures are highlighted.',
  Saturn: 'Discipline, hard work, delays but eventual rewards. Focus on building strong foundations.',
  Rahu: 'Ambition, unconventional paths, foreign connections. Sudden gains and illusions both possible.',
  Ketu: 'Detachment, spirituality, past-life karma. Introspection and letting go define this period.',
}

const period = (row) => `${monthYear(row.start)} – ${monthYear(row.end)}`

function AntardashaList({ report, lord }) {
  const section = useSection(report, `antardasha:${lord}`, () => fetchKundliAntardasha(report.profileId, lord))
  const rows = section.data?.antardasha ?? []

  return (
    <div className="mahadasha-tab__sub">
      <p className="mahadasha-tab__sub-title">Antardasha periods in {lord} Mahadasha</p>
      <SectionStatus section={section} label="Loading antardasha periods…" />
      {section.status === 'ready' && (
        <ul className="mahadasha-tab__sub-list">
          {rows.map((row) => (
            <li key={`${row.lord}-${row.start}`} className={`mahadasha-tab__sub-row${row.current ? ' mahadasha-tab__sub-row--current' : ''}`}>
              <span className="mahadasha-tab__sub-lord">
                {row.lord}
                {row.current && <span className="mahadasha-tab__badge">Now</span>}
              </span>
              <span className="mahadasha-tab__sub-period">{period(row)}</span>
            </li>
          ))}
          {rows.length === 0 && <li className="mahadasha-tab__sub-empty">No antardasha periods reported.</li>}
        </ul>
      )}
    </div>
  )
}

export default function MahadashaTab({ report = {} }) {
  const section = useSection(report, 'dasha', () => fetchKundliDasha(report.profileId))
  const [openLord, setOpenLord] = useState(null)

  const mahadasha = section.data?.mahadasha ?? []
  const currentAntardasha = section.data?.currentAntardasha ?? []
  const runningAntardasha = currentAntardasha.find((row) => row.current)

  return (
    <div className="mahadasha-tab">
      <h2 className="mahadasha-tab__title">{TITLE}</h2>
      <SectionStatus section={section} label="Loading your dasha periods…" />

      {section.status === 'ready' && (
        <>
          <p className="mahadasha-tab__hint">Tap a mahadasha to see its antardasha breakdown.</p>
          <div className="mahadasha-tab__list">
            {mahadasha.map((dasha) => {
              const isOpen = openLord === dasha.lord
              return (
                <div
                  className={`mahadasha-tab__card mahadasha-tab__card--clickable${dasha.current ? ' mahadasha-tab__card--active' : ''}${isOpen ? ' mahadasha-tab__card--open' : ''}`}
                  key={`${dasha.lord}-${dasha.start}`}
                >
                  <button
                    type="button"
                    className="mahadasha-tab__toggle"
                    aria-expanded={isOpen}
                    onClick={() => setOpenLord(isOpen ? null : dasha.lord)}
                  >
                    <div className="mahadasha-tab__card-head">
                      <div className="mahadasha-tab__card-main">
                        <div className="mahadasha-tab__name-row">
                          <span className="mahadasha-tab__name">{dasha.lord} Mahadasha</span>
                          {dasha.current && <span className="mahadasha-tab__badge">Active</span>}
                        </div>
                        {dasha.current && runningAntardasha && (
                          <div className="mahadasha-tab__antardasha">
                            {runningAntardasha.lord} Antardasha ({period(runningAntardasha)})
                          </div>
                        )}
                      </div>
                      <div className="mahadasha-tab__period">
                        {period(dasha)}
                        <span className="mahadasha-tab__chevron" aria-hidden="true">
                          {isOpen ? '▴' : '▾'}
                        </span>
                      </div>
                    </div>
                    {LORD_NOTES[dasha.lord] && <p className="mahadasha-tab__description">{LORD_NOTES[dasha.lord]}</p>}
                  </button>
                  {isOpen && <AntardashaList report={report} lord={dasha.lord} />}
                </div>
              )
            })}
            {mahadasha.length === 0 && <p className="mahadasha-tab__empty">No dasha periods were reported for this chart.</p>}
          </div>
        </>
      )}
    </div>
  )
}
