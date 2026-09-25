import { Link } from 'react-router-dom'
import logo from '../../../assets/header/logo.png'
import instagramIcon from '../../../assets/footer/instagram.svg'
import youtubeIcon from '../../../assets/footer/youtube.svg'
import facebookIcon from '../../../assets/footer/facebook.svg'
import xIcon from '../../../assets/footer/x.svg'
import linkedinIcon from '../../../assets/footer/linkedin.svg'
import shieldIcon from '../../../assets/footer/shield.svg'
import mailIcon from '../../../assets/footer/mail.svg'
import phoneIcon from '../../../assets/footer/phone.svg'
import appleIcon from '../../../assets/footer/apple.svg'
import playIcon from '../../../assets/footer/play.svg'
import pwaIcon from '../../../assets/footer/pwa.svg'
import heartIcon from '../../../assets/footer/heart.svg'
import './Footer.css'

const SOCIALS = [
  { label: 'Instagram', icon: instagramIcon, href: 'https://instagram.com' },
  { label: 'YouTube', icon: youtubeIcon, href: 'https://youtube.com' },
  { label: 'Facebook', icon: facebookIcon, href: 'https://facebook.com' },
  { label: 'X', icon: xIcon, href: 'https://x.com' },
  { label: 'LinkedIn', icon: linkedinIcon, href: 'https://linkedin.com' },
]

const SERVICES = [
  { label: 'Home', to: '/' },
  { label: 'Astrologers', to: '/astrologers' },
  { label: 'Free Kundli', to: '/kundli' },
  { label: 'Horoscope', to: '/horoscope' },
  { label: 'Panchang', to: '/panchang' },
  { label: 'AI Astrology', to: '/ai-astrology' },
  { label: 'Online Puja', to: '/puja' },
  { label: 'Store', to: '/store' },
  { label: 'Blog', to: '/blog' },
]

const COMPANY = [
  { label: 'About Us', to: '/about' },
  { label: 'Careers', to: '/careers' },
  { label: 'Reviews', to: '/reviews' },
  { label: 'Offers & Rewards', to: '/offers' },
  { label: 'Premium Features', to: '/premium' },
  { label: 'Support Center', to: '/support' },
]

const LEGAL = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Refund Policy', to: '/refund' },
  { label: 'Contact Us', to: '/contact' },
]

function LinkList({ items }) {
  return (
    <ul className="footer__list">
      {items.map((item) => (
        <li key={item.to}>
          <Link to={item.to} className="footer__link">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__col footer__col--brand">
            <Link to="/" className="footer__logo" aria-label="Shree Astro home">
              <img src={logo} alt="Shree Astro – Your life, our guidance" />
            </Link>
            <p className="footer__about">
              India&apos;s most trusted platform for authentic Vedic astrology. 5 lakh+ users. 2,000+
              verified astrologers.
            </p>
            <div className="footer__follow">
              <p className="footer__follow-label">Follow Us</p>
              <div className="footer__socials">
                {SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__social"
                    aria-label={social.label}
                  >
                    <img src={social.icon} alt="" />
                  </a>
                ))}
              </div>
            </div>
            <div className="footer__secure">
              <img src={shieldIcon} alt="" className="footer__secure-icon" />
              <span>ISO 27001 · SSL Secured</span>
            </div>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Services</h4>
            <LinkList items={SERVICES} />
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Company</h4>
            <LinkList items={COMPANY} />
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Legal &amp; Help</h4>
            <LinkList items={LEGAL} />
            <div className="footer__contact">
              <a href="mailto:support@shreeastro.com" className="footer__contact-row">
                <img src={mailIcon} alt="" className="footer__contact-icon" />
                <span>support@shreeastro.com</span>
              </a>
              <a href="tel:1800XXXXXXX" className="footer__contact-row">
                <img src={phoneIcon} alt="" className="footer__contact-icon" />
                <span>1800-XXX-XXXX (Toll Free)</span>
              </a>
            </div>
          </div>

          <div className="footer__col footer__col--app">
            <h4 className="footer__heading">Download App</h4>
            <p className="footer__app-text">Get instant consultations and daily horoscopes on the go.</p>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noreferrer"
              className="footer__store footer__store--apple"
              aria-label="Download on the App Store"
            >
              <img src={appleIcon} alt="" className="footer__store-icon" />
              <span className="footer__store-text">
                <span className="footer__store-eyebrow">Download on the</span>
                <span className="footer__store-name">App Store</span>
              </span>
            </a>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noreferrer"
              className="footer__store"
              aria-label="Get it on Google Play"
            >
              <img src={playIcon} alt="" className="footer__store-icon" />
              <span className="footer__store-text">
                <span className="footer__store-eyebrow">Get it on</span>
                <span className="footer__store-name">Google Play</span>
              </span>
            </a>
            <div className="footer__pwa">
              <img src={pwaIcon} alt="" className="footer__pwa-icon" />
              <span>Also available as PWA — Install from browser</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer__inner">
        <div className="footer__divider" />
      </div>

      <div className="footer__inner">
        <div className="footer__bottom">
          <p className="footer__copy">© 2026 Shree Astro Technologies Pvt. Ltd. All rights reserved.</p>
          <nav className="footer__bottom-links" aria-label="Legal">
            {LEGAL.map((item) => (
              <Link key={item.to} to={item.to} className="footer__bottom-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="footer__made">
            <span>Made with</span>
            <img src={heartIcon} alt="love" className="footer__made-icon" />
            <span>in India</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
