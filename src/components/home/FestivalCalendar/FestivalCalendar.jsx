import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import rakshaBandhan from '../../../assets/home/festival-calendar/raksha-bandhan.jpg'
import janmashtami from '../../../assets/home/festival-calendar/janmashtami.jpg'
import ganeshChaturthi from '../../../assets/home/festival-calendar/ganesh-chaturthi.jpg'
import navratri from '../../../assets/home/festival-calendar/navratri.jpg'
import dussehra from '../../../assets/home/festival-calendar/dussehra.jpg'
import diwali from '../../../assets/home/festival-calendar/diwali.jpg'
import arrowDark from '../../../assets/home/festival-calendar/arrow-dark.svg'
import arrowWhite from '../../../assets/home/festival-calendar/arrow-white.svg'
import { upcomingFestivals } from '../../../utils/hinduCalendar.js'
import './FestivalCalendar.css'

const IMAGES = {
  'raksha-bandhan': rakshaBandhan,
  janmashtami,
  'ganesh-chaturthi': ganeshChaturthi,
  navratri,
  'chaitra-navratri': navratri,
  'durga-ashtami': navratri,
  dussehra,
  diwali,
  dhanteras: diwali,
  'dev-deepawali': diwali,
  'govardhan-puja': diwali,
  'bhai-dooj': diwali,
}

const DESCRIPTIONS = {
  'raksha-bandhan': 'Celebrates the sacred bond of brothers and sisters with the tying of the rakhi thread.',
  janmashtami: 'The birth anniversary of Lord Krishna, celebrated with devotion, fasting, and midnight prayers.',
  'ganesh-chaturthi': 'Ten-day festival celebrating the birth of Lord Ganesha, the remover of all obstacles.',
  navratri: 'Nine nights of worship dedicated to the nine forms of Goddess Durga with fasting and dance.',
  'chaitra-navratri': 'Nine nights of Goddess Durga worship that open the Hindu new year in Chaitra.',
  'durga-ashtami': 'The eighth day of Navratri — Kanya Puja and Sandhi Puja in honour of Goddess Durga.',
  dussehra: 'Celebrates the victory of Lord Rama over Ravana — the triumph of good over evil.',
  diwali: "Festival of lights celebrating Lord Rama's return and the victory of light over darkness.",
  dhanteras: 'First day of Diwali — worship of Lord Dhanvantari and buying gold, silver and utensils.',
  'govardhan-puja': 'Annakut offerings honouring Lord Krishna lifting Govardhan hill to shelter Vrindavan.',
  'bhai-dooj': 'Sisters pray for their brothers’ long life and brothers pledge protection in return.',
  chhath: 'Four days of arghya to the Sun God at riverbanks, with rigorous fasting and folk songs.',
  'dev-deepawali': 'Kartika Purnima — the gods’ Diwali, with thousands of lamps lit on the ghats.',
  'tulsi-vivah': 'Devutthana Ekadashi — Lord Vishnu awakens and the wedding season begins with Tulsi Vivah.',
  'gita-jayanti': 'Marks the day Lord Krishna spoke the Bhagavad Gita to Arjuna at Kurukshetra.',
  'makar-sankranti': 'The Sun enters Makara — kite flying, til-gud sweets and holy dips mark the harvest.',
  'vasant-panchami': 'Saraswati Puja welcomes spring; an abujha muhurat for new learning and homes.',
  'maha-shivratri': 'The great night of Lord Shiva, observed with fasting, abhishek and all-night vigil.',
  'holika-dahan': 'The bonfire on the eve of Holi, celebrating Prahlad’s devotion over Holika’s pride.',
  holi: 'Festival of colours celebrating spring, love and the victory of good over evil.',
  'ram-navami': 'Birth anniversary of Lord Rama, marked with Ramayana recitals and processions.',
  'hanuman-jayanti': 'Birth of Lord Hanuman, celebrated with Sundarkand path and sindoor offerings.',
  'akshaya-tritiya': 'A day of unending prosperity — auspicious for gold, weddings and new ventures.',
  'buddha-purnima': 'Birth, enlightenment and nirvana of Gautama Buddha, all on Vaishakha Purnima.',
  'guru-purnima': 'Honouring gurus and teachers on the full moon of sage Vyasa.',
  'nag-panchami': 'Worship of serpent deities with milk offerings for protection and prosperity.',
  'hartalika-teej': 'Married women fast for marital bliss, honouring Goddess Parvati’s devotion to Shiva.',
  'anant-chaturdashi': 'Lord Vishnu as Ananta is worshipped and Ganesh idols are immersed in water.',
  'pitru-paksha': 'A fortnight of shraddha and tarpan offerings to ancestors.',
  mahalaya: 'Sarva Pitru Amavasya — shraddha for all ancestors, the eve of Navratri.',
  'sharad-purnima': 'Kojagari night — kheer left under the full moon and Goddess Lakshmi worshipped.',
  'karwa-chauth': 'Married women fast from sunrise to moonrise for the well-being of their husbands.',
}

const CARDS = 6

const longDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

export default function FestivalCalendar() {
  const today = istToday()
  /* Major festivals from today onwards, computed from the lunar calendar (no API). */
  const festivals = useMemo(
    () =>
      upcomingFestivals(today)
        .filter((festival) => IMAGES[festival.key])
        .slice(0, CARDS)
        .map((festival) => ({
          ...festival,
          image: IMAGES[festival.key],
          dateLabel: longDate(festival.date),
          description: DESCRIPTIONS[festival.key],
        })),
    [today],
  )

  return (
    <section className="festival-calendar">
      <div className="festival-calendar__inner">
        <div className="festival-calendar__head">
          <div className="festival-calendar__intro">
            <span className="festival-calendar__badge">
              <span className="festival-calendar__badge-dot" />
              UPCOMING
            </span>
            <h2 className="festival-calendar__title">Hindu Festival Calendar</h2>
            <p className="festival-calendar__subtitle">
              Never miss an auspicious occasion. Upcoming festivals with dates and significance.
            </p>
          </div>
          <Link to="/panchang" className="festival-calendar__link">
            <span>View Full Calendar</span>
            <img src={arrowDark} alt="" className="festival-calendar__link-icon icon-ink" />
          </Link>
        </div>

        <div className="festival-calendar__track">
          {festivals.map((festival) => (
            <article key={`${festival.key}-${festival.date}`} className="festival-calendar__card">
              <div className="festival-calendar__media">
                <img src={festival.image} alt={festival.name} />
                <span className="festival-calendar__date">{festival.dateLabel}</span>
              </div>
              <div className="festival-calendar__body">
                <h3 className="festival-calendar__name">{festival.name}</h3>
                <p className="festival-calendar__desc">{festival.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="festival-calendar__footer">
          <Link to="/panchang" className="festival-calendar__cta">
            <span>View Full Hindu Festival Calendar</span>
            <img src={arrowWhite} alt="" className="festival-calendar__cta-icon" />
          </Link>
        </div>
      </div>
    </section>
  )
}
