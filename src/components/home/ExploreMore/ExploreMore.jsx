import { Link } from 'react-router-dom'
import onlinePuja from '../../../assets/home/explore-more/online-puja.jpg'
import spiritualStore from '../../../assets/home/explore-more/spiritual-store.jpg'
import astrologyBlog from '../../../assets/home/explore-more/astrology-blog.jpg'
import panchang from '../../../assets/home/explore-more/panchang.jpg'
import arrowIcon from '../../../assets/home/explore-more/arrow-icon.svg'
import './ExploreMore.css'

const CARDS = [
  {
    image: onlinePuja,
    eyebrow: 'ONLINE PUJA',
    title: 'Sacred Rituals at Your Doorstep',
    text: 'Book authentic Vedic pujas performed by certified pandits. Starting from ₹1,499.',
    cta: 'Explore Online Puja',
    to: '/puja',
  },
  {
    image: spiritualStore,
    eyebrow: 'SPIRITUAL STORE',
    title: 'Curated Spiritual Products',
    text: 'Authentic gemstones, rudraksha, yantras, and sacred items — energised and certified.',
    cta: 'Explore Store',
    to: '/store',
  },
  {
    image: astrologyBlog,
    eyebrow: 'ASTROLOGY BLOG',
    title: 'Expert Astrology Articles',
    text: 'Deepen your astrological knowledge with in-depth articles from our expert team.',
    cta: 'Read Astrology Blog',
    to: '/blog',
  },
  {
    image: panchang,
    eyebrow: 'PANCHANG',
    title: 'Daily Vedic Calendar',
    text: 'Muhurta, tithi, nakshatra and auspicious timings for every important decision.',
    cta: 'View Panchang',
    to: '/panchang',
  },
]

export default function ExploreMore() {
  return (
    <section className="explore-more">
      <div className="explore-more__inner">
        <div className="explore-more__head">
          <span className="explore-more__badge">
            <span className="explore-more__badge-dot" />
            EXPLORE MORE
          </span>
          <h2 className="explore-more__title">Everything You Need for Spiritual Wellness</h2>
          <p className="explore-more__subtitle">From sacred rituals to cosmic knowledge — all in one place.</p>
        </div>

        <div className="explore-more__grid">
          {CARDS.map((card) => (
            <article key={card.to} className="explore-more__card">
              <img src={card.image} alt="" className="explore-more__card-img" />
              <div className="explore-more__card-body">
                <p className="explore-more__eyebrow">{card.eyebrow}</p>
                <h3 className="explore-more__card-title">{card.title}</h3>
                <p className="explore-more__card-text">{card.text}</p>
                <Link to={card.to} className="explore-more__btn">
                  <span>{card.cta}</span>
                  <img src={arrowIcon} alt="" className="explore-more__btn-icon" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
