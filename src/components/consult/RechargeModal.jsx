import { useState } from 'react'
import backIcon from '../../assets/consult/back-icon.svg'
import './consult-shared.css'
import './RechargeModal.css'

const DEFAULT_AMOUNTS = [49, 99, 199, 299, 499, 999]

export default function RechargeModal({
  balance = 0,
  amounts = DEFAULT_AMOUNTS,
  defaultAmount = 99,
  busy = false,
  onClose,
  onProceed,
}) {
  const [selected, setSelected] = useState(defaultAmount)
  const [custom, setCustom] = useState('')

  const customValue = Number.parseInt(custom, 10)
  const amount = custom !== '' && customValue > 0 ? customValue : selected
  const after = Number(balance) + (amount || 0)

  const pickPreset = (value) => {
    setSelected(value)
    setCustom('')
  }

  const submit = (e) => {
    e.preventDefault()
    if (amount > 0 && !busy) onProceed?.(amount)
  }

  return (
    <div className="consult-overlay consult-overlay--light">
      <form className="consult-card recharge" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Recharge Wallet">
        <div className="recharge__head">
          <button type="button" className="recharge__close" onClick={onClose} aria-label="Close">
            <img className="icon-ink" src={backIcon} alt="" />
          </button>
          <div>
            <h3 className="recharge__title">Recharge Wallet</h3>
            <p className="recharge__balance">
              Current balance: <strong>₹{formatAmount(balance)}</strong>
            </p>
          </div>
        </div>

        <p className="recharge__section">Select Amount</p>
        <div className="recharge__grid">
          {amounts.map((value) => (
            <button
              key={value}
              type="button"
              className={`recharge__tile${amount === value ? ' recharge__tile--active' : ''}`}
              onClick={() => pickPreset(value)}
            >
              ₹{value}
            </button>
          ))}
        </div>

        <input
          className="recharge__input"
          type="number"
          min="1"
          inputMode="numeric"
          placeholder="Or enter custom amount"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />

        <div className="recharge__after">
          <span className="recharge__after-label">Wallet after recharge</span>
          <span className="recharge__after-value">₹{formatAmount(after)}</span>
        </div>

        <button type="submit" className="consult-btn consult-btn--primary" disabled={!(amount > 0) || busy}>
          {busy ? 'Processing…' : `Pay ₹${amount || 0} Now`}
        </button>
      </form>
    </div>
  )
}

function formatAmount(value) {
  const n = Number(value) || 0
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}
