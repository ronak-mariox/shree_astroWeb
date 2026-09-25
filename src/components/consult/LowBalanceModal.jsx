import lowBalanceIcon from '../../assets/consult/low-balance-icon.svg'
import './consult-shared.css'
import './LowBalanceModal.css'

export default function LowBalanceModal({
  balance = 0,
  title = 'Low Wallet Balance',
  message = 'Your balance is running low. Recharge to continue.',
  rechargeLabel = 'Recharge Now',
  continueLabel = 'Continue',
  onRecharge,
  onContinue,
}) {
  return (
    <div className="low-balance" role="dialog" aria-modal="true" aria-label={title}>
      <div className="low-balance__inner">
        <div className="low-balance__head">
          <div className="low-balance__icon-box">
            <img className="low-balance__icon" src={lowBalanceIcon} alt="" />
          </div>
          <div className="low-balance__text">
            <h3 className="low-balance__title">{title}</h3>
            <p className="low-balance__message">{message}</p>
          </div>
        </div>
        <div className="low-balance__row">
          <span className="low-balance__row-label">Current Balance</span>
          <span className="low-balance__row-value">₹{formatAmount(balance)}</span>
        </div>
        <button type="button" className="consult-btn consult-btn--primary" onClick={onRecharge}>
          {rechargeLabel}
        </button>
        <button type="button" className="consult-btn consult-btn--outline low-balance__continue" onClick={onContinue}>
          {continueLabel}
        </button>
      </div>
    </div>
  )
}

function formatAmount(value) {
  const n = Number(value) || 0
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}
