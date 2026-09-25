import { fetchKundliAnalysis } from '../../../api/index.js'
import AnalysisPanel from './AnalysisPanel.jsx'
import SectionStatus from './SectionStatus.jsx'
import { useSection } from './useSection.js'
import './HealthTab.css'

const TITLE = 'Health Analysis'

/** Rule-engine health reading — `GET /kundli/:id/analysis/health`, cached per profile by the report shell. */
export default function HealthTab({ report = {} }) {
  const section = useSection(report, 'analysis:health', () => fetchKundliAnalysis(report.profileId, 'health'))

  return (
    <div className="health-tab">
      <AnalysisPanel title={TITLE} analysis={section.status === 'ready' ? section.data : null}>
        <SectionStatus section={section} label="Reading your lagna and 6th house…" />
      </AnalysisPanel>
    </div>
  )
}
