import { fetchKundliAnalysis } from '../../../api/index.js'
import AnalysisPanel from './AnalysisPanel.jsx'
import SectionStatus from './SectionStatus.jsx'
import { useSection } from './useSection.js'
import './MarriageTab.css'

const TITLE = 'Marriage Prediction'

/** Rule-engine marriage reading — `GET /kundli/:id/analysis/marriage`, cached per profile by the report shell. */
export default function MarriageTab({ report = {} }) {
  const section = useSection(report, 'analysis:marriage', () => fetchKundliAnalysis(report.profileId, 'marriage'))

  return (
    <div className="marriage-tab">
      <AnalysisPanel title={TITLE} analysis={section.status === 'ready' ? section.data : null}>
        <SectionStatus section={section} label="Reading your 7th house…" />
      </AnalysisPanel>
    </div>
  )
}
