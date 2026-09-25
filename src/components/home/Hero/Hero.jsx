import { useState } from 'react'
import heroPerson from '../../../assets/hero/hero-person.jpg'
import downloadIcon from '../../../assets/hero/download-icon.gif'
import playstore from '../../../assets/hero/playstore.svg'
import googlePlayText from '../../../assets/hero/google-play-text.svg'
import sparkle1 from '../../../assets/hero/sparkle-1.gif'
import sparkle2 from '../../../assets/hero/sparkle-2.gif'
import sparkle3 from '../../../assets/hero/sparkle-3.gif'
import zodiacWheel from '../../../assets/hero/zodiac-wheel.png'
import './Hero.css'

const SLIDES = [
  {
    image: heroPerson,
    title: '1 Million+ Downloads!',
    lines: [
      <>
        India’s Trusted <strong>Shree Astro Astrology</strong> App
      </>,
      'Get answers from expert astrologers.',
      'First Chat FREE – Join now!',
    ],
  },
  {
    image: heroPerson,
    title: 'Talk to Verified Astrologers',
    lines: [
      <>
        300+ <strong>Expert Astrologers</strong> Online
      </>,
      'Chat or call anytime, anywhere.',
      'First Chat FREE – Join now!',
    ],
  },
]

export default function Hero() {
  const [active, setActive] = useState(0)
  const slide = SLIDES[active]

  return (
    <section className="hero">
      <img src={sparkle1} alt="" className="hero__sparkle hero__sparkle--1" />
      <img src={sparkle2} alt="" className="hero__sparkle hero__sparkle--2" />
      <img src={sparkle3} alt="" className="hero__sparkle hero__sparkle--3" />

      <div className="container hero__inner">
        <div className="hero__card">
          <div className="hero__media">
            <img src={slide.image} alt="" />
          </div>
          <div className="hero__content">
            <h1 className="hero__title">{slide.title}</h1>
            {slide.lines.map((line, i) => (
              <p key={i} className="hero__line">
                {line}
              </p>
            ))}
            <div className="hero__actions">
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer"
                className="hero__store"
                aria-label="Get it on Google Play"
              >
                <img src={playstore} alt="" className="hero__store-icon" />
                <span className="hero__store-text">
                  <span className="hero__store-eyebrow">GET IT ON</span>
                  <img src={googlePlayText} alt="Google Play" className="hero__store-wordmark" />
                </span>
              </a>
              <a href="https://play.google.com/store" target="_blank" rel="noreferrer" className="hero__download">
                <img src={downloadIcon} alt="" className="hero__download-icon" />
                <span>Download Now</span>
              </a>
            </div>
          </div>
        </div>

        <div className="hero__wheel">
          <img src={zodiacWheel} alt="Zodiac wheel" />
        </div>

        <div className="hero__dots" role="tablist" aria-label="Hero slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              className={'hero__dot' + (i === active ? ' hero__dot--active' : '')}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
