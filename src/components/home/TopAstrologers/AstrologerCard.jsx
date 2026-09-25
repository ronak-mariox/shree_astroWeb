import { Link } from 'react-router-dom'
import verifiedIcon from '../../../assets/home/top-astrologers/verified-icon.svg'
import ratingStar from '../../../assets/home/top-astrologers/rating-star.svg'
import starFull from '../../../assets/home/top-astrologers/star-full.svg'
import starEmpty from '../../../assets/home/top-astrologers/star-empty.svg'
import phoneIcon from '../../../assets/home/top-astrologers/phone-icon.svg'
import chatIcon from '../../../assets/home/top-astrologers/chat-icon.svg'
import calendarIcon from '../../../assets/home/top-astrologers/calendar-icon.svg'
import { toCardView } from '../../astrologers/astrologerView.js'
import './TopAstrologers.css'

export default function AstrologerCard({ astrologer }) {
  const card = toCardView(astrologer)
  const { id, name, photo, status, price, stars } = card
  /** The homepage card shows two chips; the rest fold into "+N". */
  const skills = card.skills.slice(0, 2)
  const extraSkills = card.extraSkills + (card.skills.length - skills.length)

  const profile = `/astrologers/${id}`

  return (
    <article className="astrologer-card">
      <Link to={profile} className="astrologer-card__media" aria-label={name}>
        <img src={photo} alt={name} className="astrologer-card__photo" loading="lazy" />
        <span className={`astrologer-card__status astrologer-card__status--${status.key}`}>
          <span className="astrologer-card__status-dot" />
          {status.label}
        </span>
        <span className="astrologer-card__rating">
          <img src={ratingStar} alt="" className="astrologer-card__rating-icon" />
          {card.rating}
        </span>
      </Link>

      <div className="astrologer-card__body">
        <div className="astrologer-card__name-row">
          <Link to={profile} className="astrologer-card__name">
            {name}
          </Link>
          <img src={verifiedIcon} alt="Verified" className="astrologer-card__verified" />
        </div>
        <p className="astrologer-card__experience">{card.experienceYears} Years Experience</p>

        <div className="astrologer-card__skills">
          {skills.map((skill) => (
            <span key={skill} className="astrologer-card__skill">
              {skill}
            </span>
          ))}
          {extraSkills > 0 && <span className="astrologer-card__skill-more">+{extraSkills}</span>}
        </div>

        <div className="astrologer-card__meta">
          <span className="astrologer-card__languages">{card.languagesList.join(' · ')}</span>
          <span className="astrologer-card__reviews">{card.reviews} reviews</span>
        </div>

        <div className="astrologer-card__price-row">
          <p className="astrologer-card__price">
            {price ? (
              <>
                {price.was && <s className="astrologer-card__price-was">₹{price.was}</s>}₹{price.now}
                <span className="astrologer-card__price-unit">/min</span>
              </>
            ) : (
              <span className="astrologer-card__price-unit">Rate on request</span>
            )}
          </p>
          <div className="astrologer-card__stars" aria-label={`${stars} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <img
                key={n}
                src={n <= stars ? starFull : starEmpty}
                alt=""
                className="astrologer-card__star"
              />
            ))}
          </div>
        </div>

        <div className="astrologer-card__divider" />

        <div className="astrologer-card__actions">
          {card.hasCall && (
            <Link
              to={`/intake/${id}?mode=call`}
              className="astrologer-card__btn astrologer-card__btn--call"
            >
              <img src={phoneIcon} alt="" className="astrologer-card__btn-icon" />
              Call
            </Link>
          )}
          {card.hasChat && (
            <Link to={`/intake/${id}?mode=chat`} className="astrologer-card__btn">
              <img src={chatIcon} alt="" className="astrologer-card__btn-icon icon-ink" />
              Chat
            </Link>
          )}
          <Link to={profile} className="astrologer-card__btn">
            <img src={calendarIcon} alt="" className="astrologer-card__btn-icon icon-ink" />
            {card.hasCall || card.hasChat ? 'Book' : 'View'}
          </Link>
        </div>
      </div>
    </article>
  )
}

/** The grey placeholder shown while the section loads. */
export function AstrologerCardSkeleton() {
  return (
    <article className="astrologer-card astrologer-card--skeleton" aria-hidden="true">
      <div className="astrologer-card__media astrologer-card__bone" />
      <div className="astrologer-card__body">
        <div className="astrologer-card__bone astrologer-card__bone--title" />
        <div className="astrologer-card__bone astrologer-card__bone--line" />
        <div className="astrologer-card__skills">
          <span className="astrologer-card__bone astrologer-card__bone--chip" />
          <span className="astrologer-card__bone astrologer-card__bone--chip" />
        </div>
        <div className="astrologer-card__price-row">
          <div className="astrologer-card__bone astrologer-card__bone--price" />
        </div>
        <div className="astrologer-card__divider" />
        <div className="astrologer-card__actions">
          <span className="astrologer-card__bone astrologer-card__bone--btn" />
          <span className="astrologer-card__bone astrologer-card__bone--btn" />
          <span className="astrologer-card__bone astrologer-card__bone--btn" />
        </div>
      </div>
    </article>
  )
}
