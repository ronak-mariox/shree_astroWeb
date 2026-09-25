import { useState } from 'react'
import { Link } from 'react-router-dom'
import heroBadgeStar from '../../assets/pages/premium/hero-badge-star.svg'
import demoStar from '../../assets/pages/premium/demo-star.svg'
import demoMoon from '../../assets/pages/premium/demo-moon.svg'
import exploreArrow from '../../assets/pages/premium/explore-arrow.svg'
import iconAiHoroscope from '../../assets/pages/premium/feature-ai-horoscope.svg'
import iconBirthChart from '../../assets/pages/premium/feature-birth-chart.svg'
import iconVoice from '../../assets/pages/premium/feature-voice.svg'
import iconLanguage from '../../assets/pages/premium/feature-language.svg'
import iconDarkMode from '../../assets/pages/premium/feature-dark-mode.svg'
import iconGoogle from '../../assets/pages/premium/feature-google.svg'
import iconApple from '../../assets/pages/premium/feature-apple.svg'
import iconOtp from '../../assets/pages/premium/feature-otp.svg'
import iconWallet from '../../assets/pages/premium/feature-wallet.svg'
import iconLoyalty from '../../assets/pages/premium/feature-loyalty.svg'
import iconGift from '../../assets/pages/premium/feature-gift.svg'
import iconLive from '../../assets/pages/premium/feature-live.svg'
import iconDashboard from '../../assets/pages/premium/feature-dashboard.svg'
import iconPush from '../../assets/pages/premium/feature-push.svg'
import iconPwa from '../../assets/pages/premium/feature-pwa.svg'
import modeDarkTile from '../../assets/pages/premium/mode-dark-tile.svg'
import modeDarkBtn from '../../assets/pages/premium/mode-dark-btn.svg'
import modeLightTile from '../../assets/pages/premium/mode-light-tile.svg'
import modeLightBtn from '../../assets/pages/premium/mode-light-btn.svg'
import './Premium.css'

const CATEGORIES = ['All', 'AI', 'Auth', 'Finance', 'Rewards', 'UI', 'Live', 'Social', 'Utility', 'PWA']

const FEATURES = [
  {
    id: 'ai-horoscope',
    category: 'AI',
    tag: 'AI',
    color: '139, 92, 246',
    icon: iconAiHoroscope,
    title: 'AI Personal Horoscope',
    desc: 'Daily personalised horoscope generated from your exact birth chart using our proprietary Vedic AI model — not generic sun-sign content.',
    to: '/ai-astrology',
  },
  {
    id: 'birth-chart',
    category: 'AI',
    tag: 'AI',
    color: '139, 92, 246',
    icon: iconBirthChart,
    title: 'AI Birth Chart Summary',
    desc: 'Instant plain-language interpretation of your Kundli. Understand your Lagna, planetary houses, and key yogas without prior knowledge.',
    to: '/kundli',
  },
  {
    id: 'voice-search',
    category: 'AI',
    tag: 'New',
    color: '34, 197, 94',
    icon: iconVoice,
    title: 'Voice Search',
    desc: "Ask any astrological question by voice. 'Find a Tarot reader available now' or 'What does Saturn in my 7th house mean?' — answered instantly.",
    to: '/ai-astrology',
  },
  {
    id: 'multi-language',
    category: 'UI',
    tag: '12 Languages',
    color: '59, 130, 246',
    icon: iconLanguage,
    title: 'Multi-language Support',
    desc: 'Full platform experience in 12 languages including Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, and more.',
  },
  {
    id: 'dark-mode',
    category: 'UI',
    tag: 'UI',
    color: '0, 0, 0',
    plain: true,
    icon: iconDarkMode,
    title: 'Dark Mode',
    desc: 'Reduce eye strain during late-night readings. Dark mode preserves the brand identity while creating a calm, focused consultation environment.',
    href: '#premium-modes',
  },
  {
    id: 'google-login',
    category: 'Auth',
    tag: 'Auth',
    color: '66, 133, 244',
    icon: iconGoogle,
    title: 'Google Login',
    desc: 'One-tap sign-in with your existing Google account. No passwords to remember — your Google identity secures your Shree Astro account.',
    to: '/login',
  },
  {
    id: 'apple-login',
    category: 'Auth',
    tag: 'Auth',
    color: '0, 0, 0',
    plain: true,
    icon: iconApple,
    title: 'Apple Login',
    desc: "Sign in with Apple ID for the highest standard of authentication security. Hide your email — Apple's private relay protects your identity.",
    to: '/login',
  },
  {
    id: 'otp-login',
    category: 'Auth',
    tag: 'Auth',
    color: '245, 81, 2',
    icon: iconOtp,
    title: 'OTP Login',
    desc: 'Phone-based authentication with a 6-digit OTP. No passwords required — your mobile number is your secure identity on Shree Astro.',
    to: '/login',
  },
  {
    id: 'wallet',
    category: 'Finance',
    tag: 'Finance',
    color: '5, 150, 105',
    icon: iconWallet,
    title: 'Secure Wallet',
    desc: 'PCI-DSS compliant Astro Wallet. Prepaid balance auto-applied to consultations, 10% cashback on every session, instant refunds on disputes.',
    to: '/account/wallet',
  },
  {
    id: 'loyalty',
    category: 'Rewards',
    tag: 'Rewards',
    color: '245, 158, 11',
    icon: iconLoyalty,
    title: 'Loyalty Points',
    desc: 'Earn 10–12 points per ₹10 on every consultation. Progress through Silver, Gold, Platinum, and Diamond tiers unlocking exclusive benefits.',
    to: '/offers',
  },
  {
    id: 'gift',
    category: 'Social',
    tag: 'Social',
    color: '236, 72, 153',
    icon: iconGift,
    title: 'Gift a Consultation',
    desc: 'Send a consultation session as a gift to anyone. Perfect for birthdays, weddings, and festive occasions. Redeemable with any verified astrologer.',
    to: '/offers',
  },
  {
    id: 'live',
    category: 'Live',
    tag: 'Live',
    color: '34, 197, 94',
    icon: iconLive,
    title: 'Live Astrologer Availability',
    desc: 'Real-time online status for every astrologer. Green badge = available now for instant consultation. Queue position shown for busy astrologers.',
    to: '/astrologers',
  },
  {
    id: 'dashboard',
    category: 'UI',
    tag: 'Premium',
    color: '245, 81, 2',
    icon: iconDashboard,
    title: 'Personalised Dashboard',
    desc: 'Your cosmic command center. View consultation history, wallet balance, loyalty tier, daily tips, and personalised recommendations in one place.',
    to: '/account',
  },
  {
    id: 'push',
    category: 'Utility',
    tag: 'Utility',
    color: '99, 102, 241',
    icon: iconPush,
    title: 'Push Notifications',
    desc: 'Never miss a cosmic event. Get alerts for auspicious Muhurats, planetary transits, consultation reminders, and wallet cashback credits.',
    to: '/account/notifications',
  },
  {
    id: 'pwa',
    category: 'PWA',
    tag: 'PWA',
    color: '14, 165, 233',
    icon: iconPwa,
    title: 'Progressive Web App',
    desc: 'Install Shree Astro on your homescreen without an app store. Works offline for reading your saved Kundli and cached horoscopes.',
  },
]

const STARS = [0, 1, 2, 3, 4]

function ExploreLink({ feature }) {
  const inner = (
    <>
      Explore
      <img src={exploreArrow} alt="" className="premium-card__explore-icon" />
    </>
  )
  if (feature.to) {
    return (
      <Link to={feature.to} className="premium-card__explore">
        {inner}
      </Link>
    )
  }
  if (feature.href) {
    return (
      <a href={feature.href} className="premium-card__explore">
        {inner}
      </a>
    )
  }
  return null
}

export default function Premium() {
  const [category, setCategory] = useState('All')
  const [theme, setTheme] = useState('light')

  const visible = category === 'All' ? FEATURES : FEATURES.filter((f) => f.category === category)
  const isDark = theme === 'dark'

  return (
    <div className="premium-page" data-theme={theme}>
      <section className="premium-page__hero">
        <div className="premium-page__hero-glow" />
        <div className="premium-page__inner premium-page__hero-grid">
          <div className="premium-page__hero-copy">
            <span className="premium-page__badge">
              <img src={heroBadgeStar} alt="" className="premium-page__badge-icon" />
              Premium Features
            </span>
            <h1 className="premium-page__title">
              Built for the
              <br />
              Modern Seeker
            </h1>
            <p className="premium-page__lead">
              16 premium capabilities — from AI-powered birth chart summaries to military-grade wallet
              security — designed to make your cosmic journey seamless.
            </p>
            <div className="premium-page__hero-actions">
              <Link to="/login" className="premium-page__btn premium-page__btn--gradient">
                Get Started Free
              </Link>
              <Link to="/account" className="premium-page__btn premium-page__btn--ghost">
                Open Dashboard
              </Link>
            </div>
          </div>

          <div className="premium-demo">
            <div className="premium-demo__bar">
              <div className="premium-demo__dots">
                <span />
                <span />
                <span />
              </div>
              <div className="premium-demo__brand">
                <img src={demoStar} alt="" className="premium-demo__brand-icon" />
                Shree Astro
              </div>
              <div className="premium-demo__spacer" />
            </div>
            <div className="premium-demo__body">
              <div className="premium-demo__astro">
                <p className="premium-demo__astro-name">Pandit Ramesh Sharma</p>
                <div className="premium-demo__stars">
                  {STARS.map((i) => (
                    <span key={i} />
                  ))}
                </div>
                <div className="premium-demo__astro-actions">
                  <span className="premium-demo__chip premium-demo__chip--primary">Chat Now</span>
                  <span className="premium-demo__chip">Call</span>
                </div>
              </div>
              <div className="premium-demo__stats">
                <div className="premium-demo__stat">
                  <p className="premium-demo__stat-value">₹480</p>
                  <p className="premium-demo__stat-label">Wallet</p>
                </div>
                <div className="premium-demo__stat">
                  <p className="premium-demo__stat-value">430 pts</p>
                  <p className="premium-demo__stat-label">Points</p>
                </div>
              </div>
            </div>
            <div className="premium-demo__footer">
              <button
                type="button"
                className="premium-demo__toggle"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
              >
                <img src={demoMoon} alt="" className="premium-demo__toggle-icon" />
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-page__body">
        <div className="premium-page__inner">
          <div className="premium-page__chips" role="tablist" aria-label="Filter features">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                className={`premium-page__chip${category === c ? ' premium-page__chip--active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="premium-page__grid">
            {visible.map((f) => (
              <article key={f.id} className="premium-card">
                <div className="premium-card__top">
                  <div
                    className={`premium-card__tile${f.plain ? ' premium-card__tile--plain' : ''}`}
                    style={f.plain ? undefined : { background: `rgba(${f.color}, 0.08)` }}
                  >
                    <img src={f.icon} alt="" className="premium-card__icon" />
                  </div>
                  <span
                    className="premium-card__tag"
                    style={{ background: `rgba(${f.color}, ${f.plain ? 0.06 : 0.08})`, color: f.plain ? '#111' : `rgb(${f.color})` }}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="premium-card__title">{f.title}</h3>
                <p className="premium-card__desc">{f.desc}</p>
                <ExploreLink feature={f} />
              </article>
            ))}
          </div>

          <div className="premium-page__modes" id="premium-modes">
            <div className="premium-mode premium-mode--dark">
              <div className="premium-mode__glow" />
              <div className="premium-mode__tile">
                <img src={modeDarkTile} alt="" className="premium-mode__tile-icon" />
              </div>
              <h3 className="premium-mode__title">Dark Mode</h3>
              <p className="premium-mode__desc">
                Ideal for late-night readings and extended sessions. Dark ground preserves all brand
                identity — CTA gradient, header yellow, green status indicators remain unchanged.
              </p>
              <button type="button" className="premium-mode__btn" onClick={() => setTheme('dark')}>
                <img src={modeDarkBtn} alt="" className="premium-mode__btn-icon" />
                Activate Dark Mode
              </button>
            </div>
            <div className="premium-mode premium-mode--light">
              <div className="premium-mode__glow" />
              <div className="premium-mode__tile">
                <img src={modeLightTile} alt="" className="premium-mode__tile-icon" />
              </div>
              <h3 className="premium-mode__title">Light Mode</h3>
              <p className="premium-mode__desc">
                Warm cream background (#FFFDF7) reduces harsh white glare while maintaining
                readability. Sunlight-readable with strong contrast ratios across all UI elements.
              </p>
              <button type="button" className="premium-mode__btn" onClick={() => setTheme('light')}>
                <img src={modeLightBtn} alt="" className="premium-mode__btn-icon" />
                Activate Light Mode
              </button>
            </div>
          </div>

          <div className="premium-cta">
            <div className="premium-cta__glow" />
            <div className="premium-cta__copy">
              <h3 className="premium-cta__title">All features. One platform.</h3>
              <p className="premium-cta__desc">
                Create your free account and access every premium feature instantly.
              </p>
            </div>
            <div className="premium-cta__actions">
              <Link to="/login" className="premium-page__btn premium-page__btn--gradient premium-page__btn--lg">
                Get Started Free
              </Link>
              <Link to="/astrologers" className="premium-page__btn premium-page__btn--ghost premium-page__btn--lg">
                Explore Astrologers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
