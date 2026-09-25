import checkIcon from '../../assets/consult/check-icon.svg'
import './consult-shared.css'
import './CompletedScreen.css'

export default function CompletedScreen({
  astrologer,
  title = 'Consultation Completed',
  message,
  duration,
  charge,
  deductedFrom = 'Wallet',
  rateLabel = 'Rate & Review',
  backLabel = 'Back to Home',
  rows,
  onRate,
  onBack,
}) {
  const text = message ?? `Your consultation with ${astrologer.name} has ended.`
  const summaryRows = rows ?? [
    { label: 'Duration', value: duration },
    { label: 'Total Charge', value: `₹${charge}` },
    { label: 'Deducted From', value: deductedFrom },
  ]
  return (
    <div className="consult-card completed">
      <div className="completed__check">
        <img className="completed__check-icon" src={checkIcon} alt="" />
      </div>
      <h2 className="completed__title">{title}</h2>
      <p className="completed__text">{text}</p>

      <div className="completed__summary">
        <div className="completed__astro">
          <img className="completed__avatar" src={astrologer.avatar} alt={astrologer.name} />
          <div className="completed__astro-text">
            <p className="completed__astro-name">{astrologer.name}</p>
            {astrologer.specialty && <p className="completed__astro-spec">{astrologer.specialty}</p>}
          </div>
        </div>
        <div className="completed__rows">
          {summaryRows.map((row) => (
            <div key={row.label} className="completed__row">
              <span className="completed__label">{row.label}</span>
              <span className="completed__value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {onRate ? (
        <button type="button" className="consult-btn consult-btn--primary" onClick={onRate}>
          {rateLabel}
        </button>
      ) : (
        <p className="completed__rated">Thanks for rating this consultation.</p>
      )}
      <button type="button" className="consult-btn consult-btn--outline completed__back" onClick={onBack}>
        {backLabel}
      </button>
    </div>
  )
}
