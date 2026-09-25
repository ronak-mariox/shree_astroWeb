import spinnerIcon from '../../assets/consult/spinner-icon.svg'
import './consult-shared.css'
import './ProcessingModal.css'

export default function ProcessingModal({ amount, title = 'Processing Payment', message }) {
  const text = message ?? `Please wait while we process your ₹${amount} payment…`
  return (
    <div className="consult-overlay consult-overlay--light" role="dialog" aria-modal="true" aria-label={title}>
      <div className="processing">
        <div className="processing__icon-box">
          <img className="processing__spinner" src={spinnerIcon} alt="" />
        </div>
        <h3 className="processing__title">{title}</h3>
        <p className="processing__text">{text}</p>
      </div>
    </div>
  )
}
