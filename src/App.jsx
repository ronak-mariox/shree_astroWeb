import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import ScrollToTop from './components/layout/ScrollToTop.jsx'
import { useAuth } from './context/useAuth.js'
import Home from './pages/Home/Home.jsx'
import Astrologers from './pages/Astrologers/Astrologers.jsx'
import AstrologerProfile from './pages/AstrologerProfile/AstrologerProfile.jsx'
import Intake from './pages/Intake/Intake.jsx'
import Call from './pages/Call/Call.jsx'
import Chat from './pages/Chat/Chat.jsx'
import Kundli from './pages/Kundli/Kundli.jsx'
import KundliReport from './pages/KundliReport/KundliReport.jsx'
import Panchang from './pages/Panchang/Panchang.jsx'
import Horoscope from './pages/Horoscope/Horoscope.jsx'
import AiAstrology from './pages/AiAstrology/AiAstrology.jsx'
import Puja from './pages/Puja/Puja.jsx'
import PujaDetail from './pages/PujaDetail/PujaDetail.jsx'
import Store from './pages/Store/Store.jsx'
import ProductDetail from './pages/ProductDetail/ProductDetail.jsx'
import Checkout from './pages/Checkout/Checkout.jsx'
import Blog from './pages/Blog/Blog.jsx'
import BlogArticle from './pages/BlogArticle/BlogArticle.jsx'
import Login from './pages/Login/Login.jsx'
import AccountLayout from './pages/Account/AccountLayout.jsx'
import Overview from './pages/Account/Overview.jsx'
import Wallet from './pages/Account/Wallet.jsx'
import Rewards from './pages/Account/Rewards.jsx'
import Notifications from './pages/Account/Notifications.jsx'
import Pujas from './pages/Account/Pujas.jsx'
import PujaBooking from './pages/Account/PujaBooking.jsx'
import Appointments from './pages/Account/Appointments.jsx'
import AppointmentDetail from './pages/Account/AppointmentDetail.jsx'
import Orders from './pages/Account/Orders.jsx'
import OrderDetail from './pages/Account/OrderDetail.jsx'
import Profile from './pages/Account/Profile.jsx'
import About from './pages/About/About.jsx'
import Careers from './pages/Careers/Careers.jsx'
import Reviews from './pages/Reviews/Reviews.jsx'
import Offers from './pages/Offers/Offers.jsx'
import Premium from './pages/Premium/Premium.jsx'
import Support from './pages/Support/Support.jsx'
import Contact from './pages/Contact/Contact.jsx'
import Privacy from './pages/Legal/Privacy.jsx'
import Terms from './pages/Legal/Terms.jsx'
import Refund from './pages/Legal/Refund.jsx'
import ComingSoon from './pages/ComingSoon/ComingSoon.jsx'

function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/astrologers" element={<Astrologers />} />
          <Route path="/astrologers/:id" element={<AstrologerProfile />} />
          <Route path="/intake/:id" element={<Intake />} />
          <Route path="/call/:chatId" element={<Call />} />
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="/kundli" element={<Kundli />} />
          <Route path="/kundli/report" element={<KundliReport />} />
          <Route path="/panchang" element={<Panchang />} />
          <Route path="/horoscope" element={<Horoscope />} />
          <Route path="/ai-astrology" element={<AiAstrology />} />
          <Route path="/puja" element={<Puja />} />
          <Route path="/puja/:slug" element={<PujaDetail />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/:slug" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="pujas" element={<Pujas />} />
            <Route path="pujas/:id" element={<PujaBooking />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/support" element={<Support />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </>
  )
}
