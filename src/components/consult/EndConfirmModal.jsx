import phoneOffIcon from '../../assets/consult/phone-off-dark-icon.svg'
import './consult-shared.css'
import './EndConfirmModal.css'

export default function EndConfirmModal({
  duration,
  charge,
  title = 'End Consultation?',
  endLabel = 'End Call',
  continueLabel = 'Continue Call',
  icon = phoneOffIcon,
  onEnd,
  onContinue,
}) {
  return (
    <div className="consult-overlay">
      <div className="consult-card end-confirm" role="dialog" aria-modal="true" aria-label={title}>
        <div className="end-confirm__icon-box">
          <img className="end-confirm__icon" src={icon} alt="" />
        </div>
        <h3 className="end-confirm__title">{title}</h3>
        <p className="end-confirm__meta">
          Duration: <strong>{duration}</strong> · Charge: <strong>₹{charge}</strong>
        </p>
        <button type="button" className="consult-btn end-confirm__end" onClick={onEnd}>
          {endLabel}
        </button>
        <button type="button" className="consult-btn consult-btn--outline end-confirm__continue" onClick={onContinue}>
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
