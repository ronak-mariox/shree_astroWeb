import { Link } from 'react-router-dom'
import './ComingSoon.css'

export default function ComingSoon() {
  return (
    <section className="coming-soon">
      <div className="container coming-soon__inner">
        <span className="coming-soon__badge">Coming soon</span>
        <h1 className="coming-soon__title">This page is on its way</h1>
        <p className="coming-soon__text">We are working on this section. Check back shortly.</p>
        <Link to="/" className="btn-gradient">
          Back to Home
        </Link>
      </div>
    </section>
  )
}
