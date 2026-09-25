import shieldBadge from '../../../assets/home/trust-section/shield-badge.svg'
import verifiedIcon from '../../../assets/home/trust-section/verified.svg'
import privacyIcon from '../../../assets/home/trust-section/privacy.svg'
import supportIcon from '../../../assets/home/trust-section/support.svg'
import trustedIcon from '../../../assets/home/trust-section/trusted.svg'
import './TrustSection.css'

const POINTS = [
  {
    icon: verifiedIcon,
    title: '500+ Verified Astrologers',
    description:
      'Every astrologer on our platform is background-verified, credential-checked, and reviewed by our expert panel.',
  },
  {
    icon: privacyIcon,
    title: '100% Privacy Protected',
    description:
      'Your consultations are completely private and confidential. We never share your personal data with anyone.',
  },
  {
    icon: supportIcon,
    title: '24/7 Support Available',
    description:
      'Our customer support team is available around the clock to help you with any queries or concerns.',
  },
  {
    icon: trustedIcon,
    title: "India's Most Trusted",
    description:
      "Rated 4.9★ by over 5 lakh satisfied users across India. India's fastest-growing astrology platform.",
  },
]

export default function TrustSection() {
  return (
    <section className="trust">
      <div className="trust__inner">
        <div className="trust__head">
          <span className="trust__badge">
            <img src={shieldBadge} alt="" className="trust__badge-icon" />
            <span>Why Shree Astro</span>
          </span>
          <h2 className="trust__title">Built on Trust &amp; Expertise</h2>
        </div>

        <ul className="trust__grid">
          {POINTS.map((point) => (
            <li key={point.title} className="trust__card">
              <div className="trust__tile">
                <img src={point.icon} alt="" className="trust__tile-icon" />
              </div>
              <h4 className="trust__card-title">{point.title}</h4>
              <p className="trust__card-desc">{point.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
