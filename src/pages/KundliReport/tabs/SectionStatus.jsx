import './SectionStatus.css'

/** Loading / error placeholder for a lazily fetched report section. Renders nothing once the section is ready. */
export default function SectionStatus({ section, label = 'Loading…' }) {
  if (section.status === 'ready') return null

  if (section.status === 'error') {
    return (
      <div className="section-status section-status--error" role="alert">
        <p className="section-status__text">{section.error || 'Could not load this section.'}</p>
        <button type="button" className="section-status__retry" onClick={section.retry}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="section-status" role="status">
      <span className="section-status__spinner" aria-hidden="true" />
      <p className="section-status__text">{label}</p>
    </div>
  )
}
