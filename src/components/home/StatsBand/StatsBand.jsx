import waveLeft from '../../../assets/home/stats-band/wave-left.svg'
import waveRight from '../../../assets/home/stats-band/wave-right.svg'
import './StatsBand.css'

const STATS = [
  { value: '300 +', label: 'Total Astrologers' },
  { value: '2 M +', label: 'Happy Customers' },
  { value: '5M+ Minutes', label: 'Total Chat/Call minutes' },
]

export default function StatsBand() {
  return (
    <section className="stats-band" aria-label="Shree Astro in numbers">
      <span className="stats-band__wave stats-band__wave--left" aria-hidden="true">
        <img src={waveLeft} alt="" />
      </span>
      <span className="stats-band__wave stats-band__wave--right" aria-hidden="true">
        <img src={waveRight} alt="" />
      </span>

      <ul className="stats-band__list">
        {STATS.map((stat) => (
          <li key={stat.label} className="stats-band__item">
            <p className="stats-band__value">{stat.value}</p>
            <p className="stats-band__label">{stat.label}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
