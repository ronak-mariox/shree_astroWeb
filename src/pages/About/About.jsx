import { Link } from 'react-router-dom'
import heroTexture from '../../assets/pages/about/hero-texture.jpg'
import iconStory from '../../assets/pages/about/icon-story.svg'
import iconBeginning from '../../assets/pages/about/icon-beginning.svg'
import iconMission from '../../assets/pages/about/icon-mission.svg'
import iconVision from '../../assets/pages/about/icon-vision.svg'
import teamPhoto from '../../assets/pages/about/team.jpg'
import valueAuthentic from '../../assets/pages/about/value-authentic.svg'
import valueTransparency from '../../assets/pages/about/value-transparency.svg'
import valueCommunity from '../../assets/pages/about/value-community.svg'
import valueTechnology from '../../assets/pages/about/value-technology.svg'
import valueWellbeing from '../../assets/pages/about/value-wellbeing.svg'
import valueReach from '../../assets/pages/about/value-reach.svg'
import leaderArjun from '../../assets/pages/about/leader-arjun.jpg'
import leaderSunita from '../../assets/pages/about/leader-sunita.jpg'
import leaderVikram from '../../assets/pages/about/leader-vikram.jpg'
import leaderPooja from '../../assets/pages/about/leader-pooja.jpg'
import './About.css'

const STATS = [
  { value: '5L+', label: 'Happy Users' },
  { value: '2,000+', label: 'Verified Astrologers' },
  { value: '50K+', label: 'Daily Consultations' },
  { value: '12', label: 'Languages' },
]

const STORY_PARAGRAPHS = [
  'In 2019, our founder Arjun Mehta was navigating a career crossroads. A trusted family astrologer provided clarity that changed his life. But when a friend in Tier-2 India needed the same guidance, she had no access to a genuine practitioner.',
  "That inequity became Shree Astro's founding purpose: democratise access to India's 5,000-year-old wisdom tradition through technology, without diluting its depth or authenticity.",
  'Today, we are the largest verified astrology platform in India — but we are still solving the same original problem, one consultation at a time.',
]

const VALUES = [
  {
    icon: valueAuthentic,
    title: 'Authentic Practice',
    text: 'Every astrologer is rigorously vetted. We accept only the top 15% of applicants.',
  },
  {
    icon: valueTransparency,
    title: 'Radical Transparency',
    text: 'Clear per-minute pricing, no hidden charges, and visible astrologer ratings.',
  },
  {
    icon: valueCommunity,
    title: 'Community First',
    text: '5 lakh+ users form a vibrant community of seekers, believers, and growth-minded individuals.',
  },
  {
    icon: valueTechnology,
    title: 'Technology + Tradition',
    text: 'Ancient Vedic wisdom meets modern AI to deliver insights that are both accurate and actionable.',
  },
  {
    icon: valueWellbeing,
    title: 'User Wellbeing',
    text: 'We guide, not predict doom. Every interaction is designed to empower, not create dependency.',
  },
  {
    icon: valueReach,
    title: 'Pan-India Reach',
    text: 'Available in 12 languages across all 28 states. Astrology that speaks your language.',
  },
]

const JOURNEY = [
  { year: '2019', text: 'Founded in Bangalore with 12 astrologers and a vision to modernize Jyotish.' },
  { year: '2020', text: 'Reached 1 lakh registered users. Launched the AI Kundli generator.' },
  { year: '2021', text: 'Series A funding of ₹45 Cr. Expanded to 200+ verified astrologers.' },
  { year: '2022', text: 'Crossed 10 lakh consultations. Launched the Puja and Store verticals.' },
  { year: '2023', text: 'Introduced AI-powered horoscope and voice search. 3 lakh active users.' },
  { year: '2026', text: '5 lakh+ users, 2,000+ astrologers, ₹500 Cr+ in GMV. Now building for 10 Cr.' },
]

const LEADERS = [
  {
    photo: leaderArjun,
    name: 'Arjun Mehta',
    role: 'Founder & CEO',
    bio: "Former tech executive who left Silicon Valley to build India's most trusted astrology platform. IIT Bombay alumni, 15 years in product leadership.",
  },
  {
    photo: leaderSunita,
    name: 'Dr. Sunita Rao',
    role: 'Chief Astrology Officer',
    bio: 'PhD in Vedic Astrology from BHU, Varanasi. 22 years of practice. Advisor to 3 national astrology bodies and author of 4 published books.',
  },
  {
    photo: leaderVikram,
    name: 'Vikram Nair',
    role: 'Chief Technology Officer',
    bio: 'Built scalable platforms at Flipkart and Razorpay. Leads the engineering team that powers 50,000+ daily consultations with sub-second reliability.',
  },
  {
    photo: leaderPooja,
    name: 'Pooja Agarwal',
    role: 'VP — Astrologer Relations',
    bio: "Designed the 3-stage astrologer vetting process trusted by 2,000+ practitioners. Ensures every consultation meets Shree Astro's quality bar.",
  },
]

export default function About() {
  return (
    <main className="about-page">
      <section className="about-page__hero">
        <img className="about-page__hero-texture" src={heroTexture} alt="" aria-hidden="true" />
        <span className="about-page__hero-glow" aria-hidden="true" />
        <div className="about-page__hero-inner">
          <span className="about-page__pill about-page__pill--gold">
            <img src={iconStory} alt="" />
            Our Story
          </span>
          <h1 className="about-page__title">
            Bringing Ancient Wisdom <span className="about-page__title-accent">to Modern India</span>
          </h1>
          <p className="about-page__lead">
            Shree Astro was born from one belief: that every Indian deserves access to authentic,
            accurate, and affordable astrological guidance — not just those with connections.
          </p>
          <ul className="about-page__stats">
            {STATS.map((s) => (
              <li key={s.label} className="about-page__stat">
                <span className="about-page__stat-value">{s.value}</span>
                <span className="about-page__stat-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="about-page__body">
        <section className="about-page__story">
          <div className="about-page__story-text">
            <span className="about-page__pill about-page__pill--orange">
              <img src={iconBeginning} alt="" />
              The Beginning
            </span>
            <h2 className="about-page__story-title">
              A Problem Arjun
              <br />
              Couldn&apos;t Ignore
            </h2>
            {STORY_PARAGRAPHS.map((p) => (
              <p key={p} className="about-page__story-para">
                {p}
              </p>
            ))}
          </div>
          <div className="about-page__story-media">
            <div className="about-page__story-photo">
              <img src={teamPhoto} alt="Shree Astro team" />
            </div>
            <div className="about-page__story-badge">
              <span className="about-page__story-badge-value">₹500 Cr+</span>
              <span className="about-page__story-badge-label">Consultations facilitated</span>
            </div>
          </div>
        </section>

        <section className="about-page__mv">
          <article className="about-page__mv-card about-page__mv-card--mission">
            <span className="about-page__mv-icon">
              <img src={iconMission} alt="" />
            </span>
            <span className="about-page__mv-label">Our Mission</span>
            <h3 className="about-page__mv-title">
              Make authentic astrological guidance accessible to every Indian.
            </h3>
            <p className="about-page__mv-text">
              Through rigorous vetting, fair pricing, and cutting-edge technology — we ensure that
              life-changing astrological wisdom is never more than a tap away, regardless of where you
              live.
            </p>
            <span className="about-page__mv-glow" aria-hidden="true" />
          </article>
          <article className="about-page__mv-card about-page__mv-card--vision">
            <span className="about-page__mv-icon">
              <img className="icon-ink" src={iconVision} alt="" />
            </span>
            <span className="about-page__mv-label">Our Vision</span>
            <h3 className="about-page__mv-title">
              To be the world&apos;s most trusted platform for Vedic wisdom by 2030.
            </h3>
            <p className="about-page__mv-text">
              We see a world where 10 crore Indians use Shree Astro as their trusted guide for life
              decisions — from career and relationships to health and spirituality — powered by both
              human expertise and AI.
            </p>
            <span className="about-page__mv-glow" aria-hidden="true" />
          </article>
        </section>

        <section className="about-page__values">
          <h2 className="about-page__section-title">What We Stand For</h2>
          <p className="about-page__section-sub about-page__section-sub--narrow">
            Six values that shape every product decision, every hire, and every consultation on Shree
            Astro.
          </p>
          <ul className="about-page__values-grid">
            {VALUES.map((v) => (
              <li key={v.title} className="about-page__value">
                <span className="about-page__value-icon">
                  <img src={v.icon} alt="" />
                </span>
                <h3 className="about-page__value-title">{v.title}</h3>
                <p className="about-page__value-text">{v.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-page__journey">
          <h2 className="about-page__section-title">Our Journey</h2>
          <ol className="about-page__timeline">
            {JOURNEY.map((item, i) => (
              <li
                key={item.year}
                className={`about-page__milestone${i % 2 ? ' about-page__milestone--right' : ''}`}
              >
                <span className="about-page__milestone-dot" aria-hidden="true" />
                <div className="about-page__milestone-card">
                  <span className="about-page__milestone-year">{item.year}</span>
                  <p className="about-page__milestone-text">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-page__team">
          <h2 className="about-page__section-title">Leadership Team</h2>
          <p className="about-page__section-sub">
            The people building India&apos;s most trusted astrology platform.
          </p>
          <ul className="about-page__team-grid">
            {LEADERS.map((l) => (
              <li key={l.name} className="about-page__leader">
                <div className="about-page__leader-photo">
                  <img src={l.photo} alt={l.name} />
                </div>
                <div className="about-page__leader-body">
                  <h3 className="about-page__leader-name">{l.name}</h3>
                  <span className="about-page__leader-role">{l.role}</span>
                  <p className="about-page__leader-bio">{l.bio}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-page__cta">
          <div className="about-page__cta-text">
            <h3 className="about-page__cta-title">Join the Mission</h3>
            <p className="about-page__cta-sub">
              Build the future of astrology with us — as an astrologer, engineer, or team member.
            </p>
          </div>
          <div className="about-page__cta-actions">
            <Link to="/careers" className="about-page__btn about-page__btn--primary">
              View Careers
            </Link>
            <Link to="/astrologers" className="about-page__btn about-page__btn--ghost">
              Meet Our Astrologers
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
