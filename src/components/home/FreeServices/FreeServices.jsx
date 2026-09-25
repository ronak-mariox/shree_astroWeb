import { useRef } from 'react'
import { Link } from 'react-router-dom'
import titleTab from '../../../assets/home/free-services/title-tab.svg'
import arrows from '../../../assets/home/free-services/arrows.svg'
import waveLeft from '../../../assets/home/free-services/wave-left.svg'
import waveRight from '../../../assets/home/free-services/wave-right.svg'
import circleRing from '../../../assets/home/free-services/icon-circle-kundli.svg'
import circleGlow from '../../../assets/home/free-services/icon-circle.png'
import './FreeServices.css'

const SERVICES = [
  {
    key: 'kundli',
    to: '/kundli',
    title: 'Kundli Making',
    lines: ['Get your free best astrological', 'chart today.'],
    icon: 'kundli',
    ring: true,
  },
  {
    key: 'puja',
    to: '/puja',
    title: 'E-Puja',
    lines: ['Dummy text free best astrological', 'chart today.'],
    icon: 'kundli',
  },
  {
    key: 'horoscope',
    to: '/horoscope',
    title: 'Horoscope',
    lines: ['Get your free best astrological', 'chart today.'],
    icon: 'horoscope',
  },
  {
    key: 'panchang',
    to: '/panchang',
    title: 'Panchang',
    lines: ['Get your free best astrological', 'chart today.'],
    icon: 'panchang',
  },
]

const SCROLL_STEP = 357

export default function FreeServices() {
  const trackRef = useRef(null)

  const scroll = (dir) => {
    trackRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' })
  }

  return (
    <section className="free-services" aria-labelledby="free-services-title">
      <div className="free-services__card">
        <div className="free-services__head">
          <img src={titleTab} alt="" className="free-services__tab" />
          <h2 id="free-services-title" className="free-services__title">
            Our Free Services
          </h2>
          <div className="free-services__nav">
            <img src={arrows} alt="" className="free-services__nav-img icon-ink" />
            <button
              type="button"
              className="free-services__nav-btn free-services__nav-btn--prev"
              aria-label="Previous services"
              onClick={() => scroll(-1)}
            />
            <button
              type="button"
              className="free-services__nav-btn free-services__nav-btn--next"
              aria-label="Next services"
              onClick={() => scroll(1)}
            />
          </div>
        </div>

        <div className="free-services__track" ref={trackRef}>
          {SERVICES.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={`free-services__item free-services__item--${item.key}`}
            >
              <div className="free-services__item-body">
                <div className="free-services__item-head">
                  <span className="free-services__wave free-services__wave--left">
                    <img src={waveLeft} alt="" />
                  </span>
                  <span className="free-services__wave free-services__wave--right">
                    <img src={waveRight} alt="" />
                  </span>
                </div>
                <div className="free-services__badge">
                  {item.ring && <img src={circleRing} alt="" className="free-services__ring" />}
                  <img src={circleGlow} alt="" className="free-services__glow" />
                  <span className={`free-services__icon free-services__icon--${item.icon}`} />
                </div>
                <h3 className="free-services__item-title">{item.title}</h3>
                <p className="free-services__item-desc">
                  {item.lines[0]}
                  <br />
                  {item.lines[1]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
