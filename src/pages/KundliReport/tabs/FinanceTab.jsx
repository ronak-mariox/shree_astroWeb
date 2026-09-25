import { fetchKundliAnalysis } from '../../../api/index.js'
import AnalysisPanel from './AnalysisPanel.jsx'
import SectionStatus from './SectionStatus.jsx'
import { useSection } from './useSection.js'
import './FinanceTab.css'

const TITLE = 'Finance Analysis'

/** Rule-engine finance reading — `GET /kundli/:id/analysis/finance`, cached per profile by the report shell. */
export default function FinanceTab({ report = {} }) {
  const section = useSection(report, 'analysis:finance', () => fetchKundliAnalysis(report.profileId, 'finance'))

  return (
    <div className="finance-tab">
      <AnalysisPanel title={TITLE} analysis={section.status === 'ready' ? section.data : null}>
        <SectionStatus section={section} label="Reading your 2nd and 11th houses…" />
      </AnalysisPanel>
    </div>
  )
}
