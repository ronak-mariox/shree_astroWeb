import { Link } from 'react-router-dom'
import './MatchingTab.css'

export default function MatchingTab() {
  return (
    <div className="matching-tab">
      <h2 className="matching-tab__heading">Kundli Matching</h2>
      <div className="matching-tab__body">
        <div className="matching-tab__info">
          <p className="matching-tab__info-text">
            Enter a partner&apos;s details to generate detailed Kundli Matching report with Ashtkoot Gun Milan score and
            compatibility analysis.
          </p>
        </div>
        <Link to="/astrologers" className="matching-tab__cta">
          Consult Astrologer for Matching
        </Link>
      </div>
    </div>
  )
}
