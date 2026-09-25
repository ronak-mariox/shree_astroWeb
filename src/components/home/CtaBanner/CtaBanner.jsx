import { Link } from 'react-router-dom'
import callIcon from '../../../assets/header/call-icon.gif'
import chatIcon from '../../../assets/header/chat-icon.gif'
import wave from '../../../assets/home/cta-banner/wave.svg'
import halo from '../../../assets/home/cta-banner/halo.svg'
import sage from '../../../assets/home/cta-banner/sage.png'
import './CtaBanner.css'

export default function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="cta-banner__wave cta-banner__wave--left" aria-hidden="true">
        <img src={wave} alt="" />
      </div>
      <div className="cta-banner__wave cta-banner__wave--right" aria-hidden="true">
        <img src={wave} alt="" />
      </div>

      <div className="cta-banner__content">
        <p className="cta-banner__line">
          Get <strong>all Astrological Questions</strong> Answered by <strong>Our Expert Astrologers.</strong>
        </p>
        <p className="cta-banner__line">
          Connect with our <strong>Best Astrologers</strong>
          <b className="cta-banner__bar">{'  |  '}</b>
          First Chat <strong>FREE</strong>
        </p>
        <div className="cta-banner__actions">
          <Link to="/astrologers?mode=call" className="cta-banner__btn">
            <img src={callIcon} alt="" className="cta-banner__btn-icon" />
            <span>Call With Astrologer</span>
          </Link>
          <Link to="/astrologers?mode=chat" className="cta-banner__btn cta-banner__btn--chat">
            <img src={chatIcon} alt="" className="cta-banner__btn-icon" />
            <span>Chat With Astrologer</span>
          </Link>
        </div>
      </div>

      <div className="cta-banner__figure" aria-hidden="true">
        <img src={halo} alt="" className="cta-banner__halo" />
        <div className="cta-banner__sage">
          <img src={sage} alt="" />
        </div>
      </div>
    </section>
  )
}
