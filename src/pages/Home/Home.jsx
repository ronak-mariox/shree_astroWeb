import Hero from '../../components/home/Hero/Hero.jsx'
import FreeServices from '../../components/home/FreeServices/FreeServices.jsx'
import StatsBand from '../../components/home/StatsBand/StatsBand.jsx'
import TopAstrologers from '../../components/home/TopAstrologers/TopAstrologers.jsx'
import CtaBanner from '../../components/home/CtaBanner/CtaBanner.jsx'
import ExploreMore from '../../components/home/ExploreMore/ExploreMore.jsx'
import FestivalCalendar from '../../components/home/FestivalCalendar/FestivalCalendar.jsx'
import PujaSection from '../../components/home/PujaSection/PujaSection.jsx'
import ProductSection from '../../components/home/ProductSection/ProductSection.jsx'
import Testimonials from '../../components/home/Testimonials/Testimonials.jsx'
import TrustSection from '../../components/home/TrustSection/TrustSection.jsx'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      <Hero />
      <div className="home__body">
        <div className="container home__stack">
          <FreeServices />
          <StatsBand />
          <TopAstrologers />
          <CtaBanner />
        </div>
        <div className="home__stack">
          <ExploreMore />
          <FestivalCalendar />
          <PujaSection />
          <ProductSection />
          <Testimonials />
          <TrustSection />
        </div>
      </div>
    </div>
  )
}
