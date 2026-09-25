import { rupees } from '../../api/index.js'
import { canAfford, isDiscounted, shortfallFor } from '../../data/consultPackages.js'
import './ConsultationTypePicker.css'

/**
 * "Choose consultation type": per-minute (the default) or a fixed-length
 * package, each priced at the astrologer's own rate, with the selected total
 * spelled out underneath. Used by the intake form and again by the
 * "package time is over" modal — the same component as user_app's
 * ConsultationTypePicker.
 */
export default function ConsultationTypePicker({
  channel = 'chat',
  ratePerMinute,
  quotes,
  walletBalance,
  value,
  onChange,
  heading = 'Choose consultation type',
  packageNote = 'Charged once when the astrologer accepts. Nothing is charged per minute.',
  perMinuteNote,
}) {
  const noun = channel === 'call' ? 'call' : 'chat'
  const selectedQuote = value?.mode === 'package' ? quotes.find((q) => q.minutes === value.minutes) : undefined
  const perMinuteSelected = !selectedQuote

  return (
    <fieldset className="ctype">
      <legend className="ctype__heading">{heading}</legend>

      <label className={`ctype__per-minute${perMinuteSelected ? ' ctype__option--selected' : ''}`}>
        <input
          type="radio"
          name="consultation-type"
          className="ctype__radio"
          checked={perMinuteSelected}
          onChange={() => onChange({ mode: 'per_minute' })}
        />
        <span className="ctype__radio-dot" aria-hidden="true" />
        <span className="ctype__option-text">
          <span className="ctype__option-title">Per-minute</span>
          <span className="ctype__option-meta">Pay as you go · {rupees(ratePerMinute)}/min</span>
        </span>
      </label>

      <p className="ctype__subheading">Packages</p>
      <div className="ctype__grid">
        {quotes.map((quote) => {
          const selected = value?.mode === 'package' && value.minutes === quote.minutes
          const affordable = quote.affordable ?? canAfford(quote.price, walletBalance)
          const discounted = isDiscounted(quote)
          return (
            <label key={quote.minutes} className={`ctype__tile${selected ? ' ctype__option--selected' : ''}`}>
              <input
                type="radio"
                name="consultation-type"
                className="ctype__radio"
                checked={selected}
                onChange={() => onChange({ mode: 'package', minutes: quote.minutes, price: quote.price })}
              />
              {discounted && <span className="ctype__off">{quote.discountPercent}% OFF</span>}
              <span className="ctype__tile-minutes">{quote.minutes} min</span>
              <span className="ctype__tile-price-row">
                {discounted && <s className="ctype__tile-original">{rupees(quote.originalPrice)}</s>}
                <span className="ctype__tile-price">{rupees(quote.price)}</span>
              </span>
              {!affordable && <span className="ctype__tile-short">Low balance</span>}
            </label>
          )
        })}
      </div>

      <div className="ctype__summary">
        {selectedQuote ? (
          <>
            <p className="ctype__summary-line">
              {selectedQuote.minutes}-minute {noun} package: {selectedQuote.minutes} × {rupees(ratePerMinute)}
              {isDiscounted(selectedQuote) ? ` = ${rupees(selectedQuote.originalPrice)}` : ''}
            </p>
            {isDiscounted(selectedQuote) && (
              <p className="ctype__summary-saving">
                {selectedQuote.discountPercent}% package discount: −{rupees(selectedQuote.originalPrice - selectedQuote.price)}
              </p>
            )}
            <p className="ctype__summary-total">Total {rupees(selectedQuote.price)}</p>
            <p className="ctype__summary-note">{packageNote}</p>
            {walletBalance != null && !canAfford(selectedQuote.price, walletBalance) && (
              <p className="ctype__summary-short">You need {rupees(shortfallFor(selectedQuote.price, walletBalance))} more in your wallet.</p>
            )}
          </>
        ) : (
          <p className="ctype__summary-line">{perMinuteNote ?? `${rupees(ratePerMinute)}/min, charged each minute while you ${noun}.`}</p>
        )}
      </div>
    </fieldset>
  )
}
