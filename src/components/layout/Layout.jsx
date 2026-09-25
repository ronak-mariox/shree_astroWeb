import { Outlet } from 'react-router-dom'
import Header from './Header/Header.jsx'
import Footer from './Footer/Footer.jsx'
import CartDrawer from '../cart/CartDrawer.jsx'

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
