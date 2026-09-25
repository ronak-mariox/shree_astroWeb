import { useState } from 'react'
import starEmpty from '../../assets/consult/star-empty.svg'
import starFilled from '../../assets/consult/star-filled.svg'
import './consult-shared.css'
import './ReviewModal.css'

export default function ReviewModal({
  astrologer,
  title = 'How was your consultation?',
  busy = false,
  onSubmit,
  onSkip,
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  const shown = hover || rating

  const submit = (e) => {
    e.preventDefault()
    if (rating > 0 && !busy) onSubmit?.({ rating, comment: comment.trim() })
  }

  return (
    <div className="consult-overlay consult-overlay--light">
      <form className="consult-card review" onSubmit={submit} role="dialog" aria-modal="true" aria-label={title}>
        <img className="review__avatar" src={astrologer.avatar} alt={astrologer.name} />
        <h3 className="review__title">{title}</h3>
        <p className="review__with">with {astrologer.name}</p>

        <div className="review__stars" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="review__star-btn"
              aria-label={`${value} star${value > 1 ? 's' : ''}`}
              aria-pressed={rating >= value}
              onMouseEnter={() => setHover(value)}
              onClick={() => setRating(value)}
            >
              <img className="review__star" src={shown >= value ? starFilled : starEmpty} alt="" />
            </button>
          ))}
        </div>

        <textarea
          className="review__textarea"
          placeholder="Share your experience (optional)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button type="submit" className="consult-btn consult-btn--primary review__submit" disabled={rating === 0 || busy}>
          {busy ? 'Submitting…' : 'Submit Review'}
        </button>
        <button type="button" className="review__skip" onClick={onSkip}>
          Skip
        </button>
      </form>
    </div>
  )
}
