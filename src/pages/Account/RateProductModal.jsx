import { useEffect, useId, useMemo, useState } from 'react'
import { messageOf, submitProductReview } from '../../api/index.js'
import starFilled from '../../assets/account/star-filled.svg'
import starEmpty from '../../assets/account/star-empty.svg'
import { mediaUrl } from './accountUtils.js'
import './RateProductModal.css'

const RATING_LABEL = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very good', 5: 'Excellent' }
const MIN_COMMENT = 3
/** Photos a review may carry — the backend accepts up to 3 (`images`). */
const MAX_IMAGES = 3

/**
 * "Rate product" for one item of a delivered order. Posts
 * `POST /products/:slug/reviews { orderId, rating, title?, comment }` and hands
 * the created review to `onRated(review, result)`.
 */
export default function RateProductModal({ order, item, onClose, onRated }) {
  const titleId = useId()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  /** Up to MAX_IMAGES photos of the product; previews are object URLs revoked on change/unmount. */
  const [images, setImages] = useState([])
  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  const addImages = (fileList) => {
    const picked = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'))
    if (!picked.length) return
    setImages((current) => {
      const next = [...current, ...picked].slice(0, MAX_IMAGES)
      if (current.length + picked.length > MAX_IMAGES) setError(`You can attach up to ${MAX_IMAGES} photos.`)
      return next
    })
  }
  const removeImage = (index) => setImages((current) => current.filter((_, i) => i !== index))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const slug = item?.product?.slug || item?.product?.id || (typeof item?.product === 'string' ? item.product : '')
  const image = mediaUrl(item?.imageUrl || item?.product?.imageUrl)
  const shown = hover || rating

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) {
      setError('Pick a star rating first.')
      return
    }
    const text = comment.trim()
    if (text.length < MIN_COMMENT) {
      setError('Write a few words about the product.')
      return
    }
    if (!slug) {
      setError('This product can no longer be reviewed.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = { orderId: order.id, rating, comment: text, images }
      if (title.trim()) body.title = title.trim()
      const result = await submitProductReview(slug, body)
      onRated?.(result?.review ?? { rating }, result)
    } catch (err) {
      if (err?.code === 'already_reviewed') {
        onRated?.({ rating }, null)
        return
      }
      setError(messageOf(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rate-product"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <form className="rate-product__card" role="dialog" aria-modal="true" aria-labelledby={titleId} onSubmit={submit}>
        <header className="rate-product__head">
          <div className="rate-product__head-text">
            <h2 id={titleId} className="rate-product__title">
              Rate product
            </h2>
            <p className="rate-product__subtitle">Order {order.reference}</p>
          </div>
          <button type="button" className="rate-product__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="rate-product__product">
          {image ? (
            <img className="rate-product__img" src={image} alt="" />
          ) : (
            <span className="rate-product__img rate-product__img--empty" aria-hidden="true" />
          )}
          <p className="rate-product__name">{item.name}</p>
        </div>

        <div className="rate-product__stars" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className="rate-product__star"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => setRating(n)}
            >
              <img src={n <= shown ? starFilled : starEmpty} alt="" />
            </button>
          ))}
          <span className="rate-product__stars-label" aria-live="polite">
            {RATING_LABEL[shown] || 'Tap a star'}
          </span>
        </div>

        <label className="rate-product__label" htmlFor={`${titleId}-title`}>
          Title <span className="rate-product__optional">(optional)</span>
        </label>
        <input
          id={`${titleId}-title`}
          className="rate-product__input"
          type="text"
          maxLength={80}
          placeholder="Sum it up in a few words"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="rate-product__label" htmlFor={`${titleId}-comment`}>
          Your review
        </label>
        <textarea
          id={`${titleId}-comment`}
          className="rate-product__comment"
          rows={4}
          maxLength={1000}
          placeholder="How was the product? Quality, packaging, delivery…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="rate-product__counter" aria-hidden="true">
          {comment.length}/1000
        </p>

        <p className="rate-product__label">
          Photos <span className="rate-product__optional">(optional · up to {MAX_IMAGES})</span>
        </p>
        <div className="rate-product__photos">
          {previews.map((src, i) => (
            <span key={src} className="rate-product__photo">
              <img src={src} alt={`Photo ${i + 1}`} />
              <button
                type="button"
                className="rate-product__photo-remove"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => removeImage(i)}
                disabled={saving}
              >
                ×
              </button>
            </span>
          ))}
          {images.length < MAX_IMAGES && (
            <label className="rate-product__photo-add">
              <input
                type="file"
                accept="image/*"
                multiple
                className="rate-product__photo-input"
                disabled={saving}
                onChange={(e) => {
                  addImages(e.target.files)
                  e.target.value = ''
                }}
              />
              <span className="rate-product__photo-add-icon" aria-hidden="true">
                +
              </span>
              <span className="rate-product__photo-add-text">Add photo</span>
            </label>
          )}
        </div>

        {error && (
          <p className="rate-product__error" role="alert">
            {error}
          </p>
        )}

        <div className="rate-product__actions">
          <button
            type="button"
            className="account-state__btn account-state__btn--ghost rate-product__cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="account-state__btn rate-product__submit" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      </form>
    </div>
  )
}
