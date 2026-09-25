import { useEffect, useState } from 'react'
import './ConnectingScreen.css'

export default function ConnectingScreen({
  astrologer,
  statusText = 'Connecting',
  hintText = 'Establishing secure connection',
  cancelLabel = 'Cancel Call',
  onCancel,
}) {
  const [dots, setDots] = useState(1)

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="connecting">
      <div className="connecting__inner">
        <div className="connecting__avatar-area">
          <span className="connecting__ring connecting__ring--inner" />
          <span className="connecting__ring connecting__ring--outer" />
          <div className="connecting__avatar-frame">
            <img className="connecting__avatar" src={astrologer.avatar} alt={astrologer.name} />
          </div>
        </div>
        <h2 className="connecting__name">{astrologer.name}</h2>
        <p className="connecting__status">
          {statusText}
          <span className="connecting__dots">{'.'.repeat(dots)}</span>
        </p>
        <div className="connecting__pill">
          <span className="connecting__pill-dot" />
          <span className="connecting__pill-text">{hintText}</span>
        </div>
        {onCancel && (
          <button type="button" className="connecting__cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  )
}
