import './AnalysisPanel.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2027-03" → "Mar 2027" — parsed by hand so the month never shifts with the viewer's timezone. */
const monthOf = (ym) => {
  const match = /^(\d{4})-(\d{1,2})/.exec(String(ym ?? ''))
  if (!match) return ym ? String(ym) : '—'
  const month = MONTHS[Number(match[2]) - 1]
  return month ? `${month} ${match[1]}` : String(ym)
}

/** `tone` values from the rule engine → BEM modifier + pill text (unknown tones read as mixed). */
const TONES = {
  positive: { mod: 'positive', text: 'Favourable' },
  favourable: { mod: 'positive', text: 'Favourable' },
  favorable: { mod: 'positive', text: 'Favourable' },
  caution: { mod: 'caution', text: 'Caution' },
  neutral: { mod: 'neutral', text: 'Mixed' },
  mixed: { mod: 'neutral', text: 'Mixed' },
}
const toneOf = (tone) => TONES[String(tone ?? '').toLowerCase()] ?? TONES.neutral

const CONFIDENCE = {
  high: 'High confidence — every chart section this reading depends on was available.',
  medium: 'Medium confidence — some optional chart sections (planet strength or dosha reports) were unavailable, so a few factors are estimated.',
}

/**
 * One life-area reading (career / finance / health / marriage). `analysis` is the
 * `GET /kundli/:id/analysis/:domain` response; while it is not ready the tab
 * passes `null` and renders its `SectionStatus` as `children` under the title.
 */
export default function AnalysisPanel({ title, analysis, children }) {
  const data = analysis ?? {}
  const tiles = data.tiles ?? []
  const summary = data.summary ?? ''
  const factors = data.factors ?? []
  const periods = data.periods ?? []
  const basedOn = (data.basedOn ?? []).filter(Boolean)
  const confidence = CONFIDENCE[String(data.confidence ?? '').toLowerCase()] ?? ''
  const disclaimer = data.disclaimer ?? ''

  return (
    <div className="analysis-panel">
      <h2 className="analysis-panel__title">{title}</h2>
      {children}

      {tiles.length > 0 && (
        <div className="analysis-panel__grid">
          {tiles.map((tile, index) => (
            <div className="analysis-panel__tile" key={`${tile.label ?? ''}-${index}`}>
              <p className="analysis-panel__label">{tile.label ?? ''}</p>
              <p className="analysis-panel__value">{tile.value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="analysis-panel__note">
          <p className="analysis-panel__note-text">{summary}</p>
        </div>
      )}

      {factors.length > 0 && (
        <section className="analysis-panel__section">
          <h3 className="analysis-panel__section-title">What your chart shows</h3>
          <ul className="analysis-panel__factors">
            {factors.map((factor, index) => {
              const tone = toneOf(factor.tone)
              return (
                <li className={`analysis-panel__factor analysis-panel__factor--${tone.mod}`} key={`${factor.title ?? ''}-${index}`}>
                  <span className="analysis-panel__dot" aria-hidden="true" />
                  <div className="analysis-panel__factor-body">
                    {factor.title && <p className="analysis-panel__factor-title">{factor.title}</p>}
                    {factor.text && <p className="analysis-panel__factor-text">{factor.text}</p>}
                    {factor.basis && <p className="analysis-panel__factor-basis">{factor.basis}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {periods.length > 0 && (
        <section className="analysis-panel__section">
          <h3 className="analysis-panel__section-title">Periods</h3>
          <div className="analysis-panel__periods">
            {periods.map((period, index) => {
              const tone = toneOf(period.tone)
              return (
                <div className={`analysis-panel__period analysis-panel__period--${tone.mod}`} key={`${period.label ?? ''}-${period.from ?? ''}-${index}`}>
                  <div className="analysis-panel__period-head">
                    <p className="analysis-panel__period-label">{period.label ?? ''}</p>
                    <span className={`analysis-panel__pill analysis-panel__pill--${tone.mod}`}>{tone.text}</span>
                  </div>
                  <p className="analysis-panel__period-range">
                    {monthOf(period.from)} – {monthOf(period.to)}
                  </p>
                  {period.reason && <p className="analysis-panel__period-reason">{period.reason}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {(basedOn.length > 0 || confidence || disclaimer) && (
        <footer className="analysis-panel__footer">
          {basedOn.length > 0 && (
            <p className="analysis-panel__based-on">
              <span className="analysis-panel__based-on-label">Based on:</span> {basedOn.join(', ')}
            </p>
          )}
          {confidence && <p className="analysis-panel__confidence">{confidence}</p>}
          {disclaimer && <p className="analysis-panel__disclaimer">{disclaimer}</p>}
        </footer>
      )}
    </div>
  )
}
