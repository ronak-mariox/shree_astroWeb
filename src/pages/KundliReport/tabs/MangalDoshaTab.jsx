import { fetchKundliDoshas } from '../../../api/index.js'
import checkIcon from '../../../assets/pages/kundli-report/tabs/check-circle.svg'
import SectionStatus from './SectionStatus.jsx'
import { useSection } from './useSection.js'
import './MangalDoshaTab.css'

const TITLE = 'Mangal Dosha Analysis'

const isMangal = (dosha) => /mangal|manglik/i.test(dosha?.name || '')

function StatusPill({ present, label }) {
  return (
    <div className={`mangal-dosha-tab__status${present ? ' mangal-dosha-tab__status--present' : ''}`}>
      {!present && (
        <span className="mangal-dosha-tab__status-icon">
          <img className="icon-ink" src={checkIcon} alt="" />
        </span>
      )}
      {present && <span aria-hidden="true">!</span>}
      <span>{label}</span>
    </div>
  )
}

export default function MangalDoshaTab({ report = {} }) {
  const section = useSection(report, 'doshas', () => fetchKundliDoshas(report.profileId))
  const doshas = section.data?.doshas ?? []
  const mangal = doshas.find(isMangal)

  return (
    <div className="mangal-dosha-tab">
      <h2 className="mangal-dosha-tab__title">{TITLE}</h2>
      <SectionStatus section={section} label="Checking your chart for doshas…" />

      {section.status === 'ready' && mangal && (
        <>
          <StatusPill present={mangal.present} label={mangal.present ? 'Mangal Dosha Detected' : 'No Mangal Dosha Detected'} />
          {mangal.severity && (
            <p className="mangal-dosha-tab__severity">
              Severity: <strong>{mangal.severity}</strong>
            </p>
          )}
          <p className="mangal-dosha-tab__summary">{mangal.description || 'No further details were reported for this dosha.'}</p>
        </>
      )}

      {section.status === 'ready' && !mangal && (
        <>
          <div className="mangal-dosha-tab__note">
            <p>
              A dedicated Mangal Dosha check is not part of this report yet. Here are the doshas that were analysed in your
              chart — consult an astrologer for a detailed Manglik assessment.
            </p>
          </div>
          <ul className="mangal-dosha-tab__list">
            {doshas.map((dosha) => (
              <li key={dosha.name} className="mangal-dosha-tab__row">
                <div className="mangal-dosha-tab__row-head">
                  <span className="mangal-dosha-tab__row-name">{dosha.name}</span>
                  <StatusPill present={dosha.present} label={dosha.present ? 'Present' : 'Not present'} />
                </div>
                {dosha.severity && (
                  <p className="mangal-dosha-tab__severity">
                    Phase: <strong>{dosha.severity}</strong>
                  </p>
                )}
                {dosha.description && <p className="mangal-dosha-tab__row-text">{dosha.description}</p>}
              </li>
            ))}
            {doshas.length === 0 && <li className="mangal-dosha-tab__row-text">No doshas were reported for this chart.</li>}
          </ul>
        </>
      )}
    </div>
  )
}
