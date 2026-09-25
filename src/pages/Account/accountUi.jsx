import { useState } from 'react'
import { messageOf, rateChat } from '../../api/index.js'
import starFilled from '../../assets/account/star-filled.svg'
import starEmpty from '../../assets/account/star-empty.svg'
import { initialOf, mediaUrl } from './accountUtils.js'

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="account-state account-state--busy" role="status" aria-live="polite">
      <span className="account-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function Skeleton({ className = '', style }) {
  return <span className={`account-skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}

export function ErrorState({ message, onRetry, compact = false }) {
  return (
    <div className={`account-state account-state--error${compact ? ' account-state--compact' : ''}`} role="alert">
      <p className="account-state__text">{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button type="button" className="account-state__btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, text, action, compact = false }) {
  return (
    <div className={`account-state account-state--empty${compact ? ' account-state--compact' : ''}`}>
      {title && <p className="account-state__title">{title}</p>}
      {text && <p className="account-state__text">{text}</p>}
      {action}
    </div>
  )
}

/** A photo when there is one, the first letter of the name otherwise. */
export function Avatar({ src, name, className = '' }) {
  const url = mediaUrl(src)
  const [broken, setBroken] = useState(false)
  if (url && !broken) {
    return <img className={className} src={url} alt={name || ''} onError={() => setBroken(true)} />
  }
  return (
    <span className={`account-avatar-fallback ${className}`.trim()} aria-hidden="true">
      {initialOf(name)}
    </span>
  )
}

export function Stars({ value, size = 13, className = '' }) {
  const rating = Number(value) || 0
  return (
    <span className={`account-stars ${className}`.trim()} aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <img key={n} src={n <= rating ? starFilled : starEmpty} alt="" width={size} height={size} />
      ))}
    </span>
  )
}

/**
 * Inline star + comment form. Posts to `POST /chats/:id/rate` by default;
 * pass `submit(rating, comment)` to rate something else (e.g. a puja booking).
 */
export function RatingForm({ chatId, submit, label = 'How was this consultation?', onRated, onCancel }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) {
      setError('Pick a star rating first.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = submit
        ? await submit(rating, comment.trim() || undefined)
        : await rateChat(chatId, rating, comment.trim() || undefined)
      onRated?.(result?.review?.rating ?? rating, result)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setSaving(false)
    }
  }

  const shown = hover || rating

  return (
    <form className="account-rating" onSubmit={handleSubmit}>
      <p className="account-rating__label">{label}</p>
      <div className="account-rating__stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            className="account-rating__star"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            <img src={n <= shown ? starFilled : starEmpty} alt="" />
          </button>
        ))}
      </div>
      <textarea
        className="account-rating__comment"
        rows={2}
        maxLength={500}
        placeholder="Share a few words (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="account-rating__error">{error}</p>}
      <div className="account-rating__actions">
        <button type="submit" className="account-state__btn" disabled={saving}>
          {saving ? 'Saving…' : 'Submit rating'}
        </button>
        {onCancel && (
          <button type="button" className="account-state__btn account-state__btn--ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
