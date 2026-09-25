import { fetchKundliDoshas } from '../../../api/index.js'
import SectionStatus from './SectionStatus.jsx'
import { useSection } from './useSection.js'
import './SadeSatiTab.css'

const TITLE = 'Sade Sati Report'

/** Reference description of Saturn's three transit phases; the provider reports which one (if any) is running. */
const PHASES = [
  { name: 'Rising Phase', match: /ris|first|1/i, intensity: 'Intensity: Moderate' },
  { name: 'Peak Phase', match: /peak|middle|second|2/i, intensity: 'Intensity: High' },
  { name: 'Setting Phase', match: /set|last|third|3/i, intensity: 'Intensity: Reducing' },
]

const isSadeSati = (dosha) => /sade\s*sati|sadhesati|sadesati/i.test(dosha?.name || '')

export default function SadeSatiTab({ report = {} }) {
  const section = useSection(report, 'doshas', () => fetchKundliDoshas(report.profileId))
  const doshas = section.data?.doshas ?? []
  const sadeSati = doshas.find(isSadeSati)
  const phase = sadeSati?.present ? String(sadeSati.severity || '') : ''

  return (
    <div className="sade-sati-tab">
      <h2 className="sade-sati-tab__title">{TITLE}</h2>
      <SectionStatus section={section} label="Checking Saturn's transit…" />

      {section.status === 'ready' && sadeSati && (
        <>
          <div className={`sade-sati-tab__status${sadeSati.present ? ' sade-sati-tab__status--present' : ''}`}>
            {sadeSati.present ? 'Currently in Sade Sati' : 'Not Currently in Sade Sati'}
            {phase ? ` · ${phase}` : ''}
          </div>
          <p className="sade-sati-tab__summary">{sadeSati.description || 'No further details were reported.'}</p>
          <div className="sade-sati-tab__phases">
            {PHASES.map((p) => {
              const active = Boolean(phase) && p.match.test(phase)
              return (
                <div className={`sade-sati-tab__phase${active ? ' sade-sati-tab__phase--active' : ''}`} key={p.name}>
                  <div className="sade-sati-tab__phase-name">{p.name}</div>
                  <div className="sade-sati-tab__phase-period">{active ? 'Running now' : sadeSati.present ? '—' : 'Not active'}</div>
                  <div className="sade-sati-tab__phase-intensity">{p.intensity}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {section.status === 'ready' && !sadeSati && (
        <div className="sade-sati-tab__note">
          <p>Sade Sati status was not reported for this chart. Consult an astrologer for a Saturn transit reading.</p>
        </div>
      )}
    </div>
  )
}
