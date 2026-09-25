import verifiedTick from '../../assets/consult/verified-tick.svg'
import starSmall from '../../assets/consult/star-small.svg'
import walletIcon from '../../assets/consult/wallet-icon.svg'
import phoneIcon from '../../assets/consult/phone-icon.svg'
import './consult-shared.css'
import './PreConsultCard.css'

export default function PreConsultCard({
  astrologer,
  walletBalance = 0,
  primaryLabel = 'Start Call',
  primaryIcon = phoneIcon,
  cancelLabel = 'Cancel',
  rateLabel = 'Rate',
  onPrimary,
  onCancel,
}) {
  const {
    name,
    specialty,
    avatar,
    rating = 4.9,
    reviews = '1,247',
    rate = 15,
    languages = 'Hindi, English',
    experience = '12 yrs',
    online = true,
  } = astrologer

  return (
    <div className="consult-card pre-card">
      <div className="pre-card__head">
        <div className="pre-card__avatar-wrap">
          <div className="pre-card__avatar-ring">
            <img className="pre-card__avatar" src={avatar} alt={name} />
          </div>
          {online && <span className="pre-card__online" />}
        </div>
        <div className="pre-card__info">
          <div className="pre-card__name-row">
            <h2 className="pre-card__name">{name}</h2>
            <img className="pre-card__tick" src={verifiedTick} alt="" />
          </div>
          <p className="pre-card__specialty">{specialty}</p>
          <div className="pre-card__rating">
            <div className="pre-card__stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <img key={i} className="pre-card__star" src={starSmall} alt="" />
              ))}
            </div>
            <span className="pre-card__reviews">
              {rating} ({reviews} reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="pre-card__table">
        <div className="pre-card__row">
          <span className="pre-card__label">{rateLabel}</span>
          <span className="pre-card__value">₹{rate}/min</span>
        </div>
        <div className="pre-card__row">
          <span className="pre-card__label">Languages</span>
          <span className="pre-card__value">{languages}</span>
        </div>
        <div className="pre-card__row">
          <span className="pre-card__label">Experience</span>
          <span className="pre-card__value">{experience}</span>
        </div>
      </div>

      <div className="pre-card__wallet">
        <div className="pre-card__wallet-left">
          <img className="pre-card__wallet-icon icon-ink" src={walletIcon} alt="" />
          <span className="pre-card__wallet-label">Wallet Balance</span>
        </div>
        <span className="pre-card__wallet-amount">₹{walletBalance}</span>
      </div>

      <button type="button" className="consult-btn consult-btn--primary pre-card__primary" onClick={onPrimary}>
        {primaryIcon && <img className="pre-card__primary-icon" src={primaryIcon} alt="" />}
        {primaryLabel}
      </button>
      <button type="button" className="consult-btn consult-btn--outline pre-card__cancel" onClick={onCancel}>
        {cancelLabel}
      </button>
    </div>
  )
}
