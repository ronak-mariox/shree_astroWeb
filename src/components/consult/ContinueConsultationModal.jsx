import { useState } from 'react'
import { rupees } from '../../api/index.js'
import { PER_MINUTE, canAfford } from '../../data/consultPackages.js'
import ConsultationTypePicker from './ConsultationTypePicker.jsx'
import './consult-shared.css'
import './ContinueConsultationModal.css'

/**
 * Shown when a package's time is over and the session is paused: the seeker
 * approves how to go on — per-minute, or another package — with the same
 * picker as the intake form. Nothing is charged until they press Continue;
 * they can also end the consultation. Not dismissable by clicking outside.
 * Mirrors user_app's ContinueConsultationSheet.
 */
export default function ContinueConsultationModal({
  channel = 'chat',
  ratePerMinute,
  quotes,
  balance,
  busy = false,
  onContinue,
  onRecharge,
  onEnd,
}) {
  const [picked, setChoice] = useState(PER_MINUTE)
  const noun = channel === 'call' ? 'call' : 'chat'

  /** Re-priced options (a recharge, a discount change) replace a stale selected price — derived, never stored. */
  const pickedQuote = picked.mode === 'package' ? quotes.find((entry) => entry.minutes === picked.minutes) : undefined
  const choice = pickedQuote ? { mode: 'package', minutes: pickedQuote.minutes, price: pickedQuote.price } : PER_MINUTE

  const price = choice.mode === 'package' ? choice.price : ratePerMinute
  const affordable = canAfford(price, balance)
  const shortfall = Math.max(0, price - (balance ?? 0))
  const label = affordable
    ? choice.mode === 'package'
      ? `Continue · Pay ${rupees(choice.price)}`
      : `Continue per-minute · ${rupees(ratePerMinute)}/min`
    : `Recharge to continue (${rupees(shortfall)} more)`

  return (
    <div className="consult-overlay">
      <div className="consult-card continue-modal" role="dialog" aria-modal="true" aria-label="Package time is over">
        <h2 className="continue-modal__title">Your package time is over</h2>
        <p className="continue-modal__text">The {noun} is paused. How would you like to continue?</p>
        {balance != null && <p className="continue-modal__balance">Wallet balance: {rupees(balance)}</p>}

        <ConsultationTypePicker
          channel={channel}
          heading="Continue with"
          ratePerMinute={ratePerMinute}
          quotes={quotes}
          walletBalance={balance}
          value={choice}
          onChange={setChoice}
          packageNote="Charged now. Nothing is charged per minute during the package."
          perMinuteNote={`${rupees(ratePerMinute)}/min — the first minute is charged now, then each minute.`}
        />

        <button
          type="button"
          className="consult-btn consult-btn--primary continue-modal__btn"
          disabled={busy}
          onClick={() => (affordable ? onContinue(choice) : onRecharge(shortfall))}
        >
          {busy ? 'Continuing…' : label}
        </button>
        <button type="button" className="consult-btn consult-btn--outline continue-modal__btn" disabled={busy} onClick={onEnd}>
          End {noun}
        </button>
      </div>
    </div>
  )
}
