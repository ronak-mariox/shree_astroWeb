import './PageState.css'

/** Shimmering placeholder block for public-page skeletons. */
export function Bone({ className = '', style }) {
  return <span className={`ui-bone ${className}`.trim()} style={style} aria-hidden="true" />
}

export function PageError({ message, onRetry, compact = false }) {
  return (
    <div className={`ui-state ui-state--error${compact ? ' ui-state--compact' : ''}`} role="alert">
      <p className="ui-state__title">{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button type="button" className="ui-state__btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function PageEmpty({ title, text, action, compact = false }) {
  return (
    <div className={`ui-state${compact ? ' ui-state--compact' : ''}`}>
      {title && <p className="ui-state__title">{title}</p>}
      {text && <p className="ui-state__text">{text}</p>}
      {action}
    </div>
  )
}
