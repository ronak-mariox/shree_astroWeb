import { Link } from 'react-router-dom'
import verifiedIcon from '../../assets/pages/astrologers/verified-icon.svg'
import ratingStar from '../../assets/pages/astrologers/rating-star.svg'
import phoneIcon from '../../assets/pages/astrologers/phone-icon.svg'
import chatIcon from '../../assets/pages/astrologers/chat-icon.svg'
import calendarIcon from '../../assets/pages/astrologers/calendar-icon.svg'
import { toCardView } from './astrologerView.js'
import './DirectoryCard.css'

export default function DirectoryCard({ astrologer }) {
  const card = toCardView(astrologer)
  const { id, name, photo, status, price } = card

  const profile = `/astrologers/${id}`

  return (
    <article className="directory-card">
      <Link to={profile} className="directory-card__media" aria-label={name}>
        <img src={photo} alt={name} className="directory-card__photo" loading="lazy" />
        <span className="directory-card__shade" />
        <span className={`directory-card__status directory-card__status--${status.key}`}>
          <span className="directory-card__status-dot" />
          {status.label}
        </span>
        <span className="directory-card__rating">
          <img src={ratingStar} alt="" className="directory-card__rating-icon" />
          {card.rating}
        </span>
        <span className="directory-card__consultations">{card.consultations}</span>
      </Link>

      <div className="directory-card__body">
        <div className="directory-card__name-row">
          <Link to={profile} className="directory-card__name">
            {name}
          </Link>
          <img src={verifiedIcon} alt="Verified" className="directory-card__verified" />
        </div>

        <p className="directory-card__meta">
          <span>{card.experienceYears} Years</span>
          {card.languages && (
            <>
              <span className="directory-card__meta-dot">·</span>
              <span className="directory-card__meta-languages">{card.languages}</span>
            </>
          )}
        </p>

        <div className="directory-card__skills">
          {card.skills.map((skill) => (
            <span key={skill} className="directory-card__skill">
              {skill}
            </span>
          ))}
          {card.extraSkills > 0 && <span className="directory-card__skill directory-card__skill--more">+{card.extraSkills}</span>}
        </div>

        <div className="directory-card__price-row">
          <p className="directory-card__price">
            {price ? (
              <>
                {price.was && <s className="directory-card__price-was">₹{price.was}</s>}₹{price.now}
                <span className="directory-card__price-unit">/min</span>
              </>
            ) : (
              <span className="directory-card__price-unit">Rate on request</span>
            )}
          </p>
          <span className="directory-card__reviews">({card.reviews} reviews)</span>
        </div>

        <div className="directory-card__divider" />

        <div className="directory-card__actions">
          {card.hasCall && (
            <Link to={`/intake/${id}?mode=call`} className="directory-card__btn directory-card__btn--call">
              <img src={phoneIcon} alt="" className="directory-card__btn-icon" />
              Call
            </Link>
          )}
          {card.hasChat && (
            <Link to={`/intake/${id}?mode=chat`} className="directory-card__btn">
              <img src={chatIcon} alt="" className="directory-card__btn-icon icon-ink" />
              Chat
            </Link>
          )}
          <Link to={profile} className="directory-card__btn">
            <img src={calendarIcon} alt="" className="directory-card__btn-icon icon-ink" />
            {card.hasCall || card.hasChat ? 'Book' : 'View'}
          </Link>
        </div>
      </div>
    </article>
  )
}

/** The grey placeholder shown while the directory loads. */
export function DirectoryCardSkeleton() {
  return (
    <article className="directory-card directory-card--skeleton" aria-hidden="true">
      <div className="directory-card__media directory-card__bone" />
      <div className="directory-card__body">
        <div className="directory-card__bone directory-card__bone--title" />
        <div className="directory-card__bone directory-card__bone--line" />
        <div className="directory-card__skills">
          <span className="directory-card__bone directory-card__bone--chip" />
          <span className="directory-card__bone directory-card__bone--chip" />
        </div>
        <div className="directory-card__price-row">
          <div className="directory-card__bone directory-card__bone--price" />
        </div>
        <div className="directory-card__divider" />
        <div className="directory-card__actions">
          <span className="directory-card__bone directory-card__bone--btn" />
          <span className="directory-card__bone directory-card__bone--btn" />
          <span className="directory-card__bone directory-card__bone--btn" />
        </div>
      </div>
    </article>
  )
}
