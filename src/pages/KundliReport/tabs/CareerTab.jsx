import { fetchKundliAnalysis } from '../../../api/index.js'
import AnalysisPanel from './AnalysisPanel.jsx'
import SectionStatus from './SectionStatus.jsx'
import { useSection } from './useSection.js'
import './CareerTab.css'

const TITLE = 'Career Analysis'

/** Rule-engine career reading — `GET /kundli/:id/analysis/career`, cached per profile by the report shell. */
export default function CareerTab({ report = {} }) {
  const section = useSection(report, 'analysis:career', () => fetchKundliAnalysis(report.profileId, 'career'))

  return (
    <div className="career-tab">
      <AnalysisPanel title={TITLE} analysis={section.status === 'ready' ? section.data : null}>
        <SectionStatus section={section} label="Reading your 10th house…" />
      </AnalysisPanel>
    </div>
  )
}
