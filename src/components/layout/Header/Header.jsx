import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import logo from '../../../assets/header/logo.png'
import callIcon from '../../../assets/header/call-icon.gif'
import chatIcon from '../../../assets/header/chat-icon.gif'
import chevron from '../../../assets/header/chevron.svg'
import userIcon from '../../../assets/header/user-icon.svg'
import { useAuth } from '../../../context/useAuth.js'
import ThemeToggle from './ThemeToggle.jsx'
import './Header.css'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Astrologers', to: '/astrologers' },
  { label: 'Free Kundli', to: '/kundli' },
  { label: 'Horoscope', to: '/horoscope' },
  { label: 'Panchang', to: '/panchang' },
  { label: 'AI Astrology', to: '/ai-astrology' },
  { label: 'Puja', to: '/puja' },
  { label: 'Store', to: '/store' },
  { label: 'Blog', to: '/blog' },
]

export default function Header() {
  const { isLoggedIn, authUser } = useAuth()
  const [menu, setMenu] = useState({ open: false, path: '' })
  const { pathname } = useLocation()
  const open = menu.open && menu.path === pathname
  const setOpen = (next) =>
    setMenu((prev) => ({ open: typeof next === 'function' ? next(prev.open && prev.path === pathname) : next, path: pathname }))

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setMenu({ open: false, path: '' })
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const accountTo = isLoggedIn ? '/account' : '/login'
  const accountLabel = isLoggedIn ? 'My account' : 'Sign in'
  const accountTitle = isLoggedIn && authUser?.name ? `My account · ${authUser.name}` : accountLabel

  const navLinks = NAV_LINKS.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => 'header__nav-link' + (isActive ? ' header__nav-link--active' : '')}
    >
      {item.label}
    </NavLink>
  ))

  return (
    <header className={'header' + (open ? ' header--open' : '')}>
      <div className="container header__inner">
        <Link to="/" className="header__logo" aria-label="Shree Astro home">
          <img src={logo} alt="Shree Astro – Your life, our guidance" />
        </Link>

        <div className="header__right">
          <div className="header__actions">
            <Link to="/astrologers?mode=call" className="header__cta">
              <img src={callIcon} alt="" className="header__cta-icon" />
              <span>Call with Astrologer</span>
            </Link>
            <Link to="/astrologers?mode=chat" className="header__cta header__cta--chat">
              <img src={chatIcon} alt="" className="header__cta-icon" />
              <span>Chat with Astrologer</span>
            </Link>
            <button type="button" className="header__lang">
              <span>English</span>
              <img src={chevron} alt="" className="header__lang-chevron" />
            </button>
            <ThemeToggle />
            <Link to={accountTo} className="header__user" aria-label={accountTitle} title={accountTitle}>
              <img src={userIcon} alt="" className="icon-ink" />
            </Link>
          </div>

          <nav className="header__nav" aria-label="Primary">
            {navLinks}
          </nav>
        </div>

        <div className="header__mobile-actions">
          <Link to={accountTo} className="header__user header__user--mobile" aria-label={accountTitle} title={accountTitle}>
            <img src={userIcon} alt="" className="icon-ink" />
          </Link>
          <button
            type="button"
            className="header__burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className="header__backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      <div id="mobile-menu" className="header__menu" aria-hidden={!open}>
        <nav className="header__menu-nav" aria-label="Mobile">
          {navLinks}
        </nav>
        <div className="header__menu-actions">
          <Link to="/astrologers?mode=call" className="header__cta">
            <img src={callIcon} alt="" className="header__cta-icon" />
            <span>Call with Astrologer</span>
          </Link>
          <Link to="/astrologers?mode=chat" className="header__cta header__cta--chat">
            <img src={chatIcon} alt="" className="header__cta-icon" />
            <span>Chat with Astrologer</span>
          </Link>
          <div className="header__menu-row">
            <button type="button" className="header__lang">
              <span>English</span>
              <img src={chevron} alt="" className="header__lang-chevron" />
            </button>
            <ThemeToggle className="header__theme--menu" />
            <Link to={accountTo} className="header__menu-account">
              <img src={userIcon} alt="" className="icon-ink" />
              <span>{accountLabel}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
