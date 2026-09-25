import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { useTheme } from '../../context/useTheme.js'
import { fetchConsultations, fetchLoyalty, fetchOrders, fetchPujaBookings, rupees, titleCase } from '../../api/index.js'
import navOverview from '../../assets/account/nav-overview.svg'
import navWallet from '../../assets/account/nav-wallet.svg'
import navRewards from '../../assets/account/stat-points.svg'
import navNotifications from '../../assets/account/nav-notifications.svg'
import navPujas from '../../assets/account/nav-pujas.svg'
import navAppointments from '../../assets/account/nav-appointments.svg'
import navOrders from '../../assets/account/nav-orders.svg'
import navProfile from '../../assets/account/nav-profile.svg'
import chevronRight from '../../assets/account/chevron-right.svg'
import moonIcon from '../../assets/account/moon.svg'
import { Avatar, Skeleton } from './accountUi.jsx'
import './AccountLayout.css'

/** `badge` names which live count to show. */
const NAV_ITEMS = [
  { to: '/account', label: 'Overview', icon: navOverview, end: true },
  { to: '/account/wallet', label: 'Wallet', icon: navWallet },
  { to: '/account/rewards', label: 'Rewards', icon: navRewards },
  { to: '/account/notifications', label: 'Notifications', icon: navNotifications, badge: 'notifications' },
  { to: '/account/pujas', label: 'My Booked Pujas', icon: navPujas, badge: 'pujas' },
  { to: '/account/appointments', label: 'My Appointments', icon: navAppointments, badge: 'appointments' },
  { to: '/account/orders', label: 'My Orders', icon: navOrders, badge: 'orders' },
  { to: '/account/profile', label: 'My Profile', icon: navProfile },
]

const QUICK_LINKS = [
  { to: '/astrologers', label: 'Talk to Astrologer' },
  { to: '/kundli', label: 'Free Kundli' },
  { to: '/horoscope', label: 'Daily Horoscope' },
  { to: '/store', label: 'Store' },
]

function MaskIcon({ src, className }) {
  const mask = `url("${src}")`
  return (
    <span
      className={className}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
      aria-hidden="true"
    />
  )
}

const totalOf = (promise) => promise.then((data) => data?.total || 0).catch(() => 0)

/** Live nav counts — each from 1-row list calls; a failed call just shows no badge. */
async function countBadges() {
  const [active, requested, pujas, orders] = await Promise.all([
    totalOf(fetchConsultations({ status: 'active', limit: 1 })),
    totalOf(fetchConsultations({ status: 'requested', limit: 1 })),
    totalOf(fetchPujaBookings({ status: 'upcoming', limit: 1 })),
    totalOf(fetchOrders({ status: 'active', limit: 1 })),
  ])
  return { appointments: active + requested, pujas, orders }
}

export default function AccountLayout() {
  const { user, loadingUser, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggle: toggleTheme } = useTheme()
  const dark = theme === 'dark'
  const [liveCounts, setLiveCounts] = useState({ appointments: 0, pujas: 0, orders: 0 })
  const [loyalty, setLoyalty] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return undefined
    let cancelled = false
    countBadges()
      .then((counts) => {
        if (!cancelled) setLiveCounts(counts)
      })
      .catch(() => {
        /* the badge is decorative; the page still works without it */
      })
    fetchLoyalty()
      .then((data) => {
        if (!cancelled && data) setLoyalty(data)
      })
      .catch(() => {
        /* the tile is decorative; the page still works without it */
      })
    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  const waiting = loadingUser && !user
  const name = user?.name || (waiting ? '' : 'Guest')
  const badges = {
    notifications: user?.unreadNotifications || 0,
    ...liveCounts,
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      navigate('/')
    }
  }

  return (
    <div className="account-layout">
      <div className="container">
        <div className="account-layout__inner">
          <aside className="account-layout__sidebar">
            <div className="account-layout__profile">
              <div className="account-layout__profile-row">
                <div className="account-layout__avatar">
                  {waiting ? null : <Avatar src={user?.avatarUrl} name={name || 'G'} />}
                </div>
                <div className="account-layout__profile-text">
                  {waiting ? (
                    <>
                      <Skeleton style={{ width: '70%', height: 13 }} />
                      <Skeleton style={{ width: '50%', height: 10, marginTop: 6 }} />
                    </>
                  ) : (
                    <>
                      <p className="account-layout__name">{name}</p>
                      <p className="account-layout__phone">{user?.phone || user?.email || ''}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="account-layout__tiles">
                <Link to="/account/wallet" className="account-layout__tile account-layout__tile--points">
                  {waiting ? (
                    <Skeleton />
                  ) : (
                    <span className="account-layout__tile-value">{rupees(user?.wallet?.balance)}</span>
                  )}
                  <span className="account-layout__tile-label">Wallet</span>
                </Link>
                <Link to="/account/rewards" className="account-layout__tile account-layout__tile--tier">
                  {waiting ? (
                    <Skeleton />
                  ) : (
                    <span className="account-layout__tile-value">
                      {loyalty ? Number(loyalty.points || 0).toLocaleString('en-IN') : '—'}
                    </span>
                  )}
                  <span className="account-layout__tile-label">
                    {loyalty?.tier ? `${titleCase(loyalty.tier)} · pts` : 'Points'}
                  </span>
                </Link>
                <Link to="/account/appointments" className="account-layout__tile">
                  {waiting ? (
                    <Skeleton />
                  ) : (
                    <span className="account-layout__tile-value">{user?.stats?.consultations ?? 0}</span>
                  )}
                  <span className="account-layout__tile-label">Consultations</span>
                </Link>
              </div>
            </div>

            <nav className="account-layout__nav" aria-label="Account">
              <ul className="account-layout__nav-list">
                {NAV_ITEMS.map((item) => {
                  const count = item.badge ? badges[item.badge] : 0
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `account-layout__nav-item${isActive ? ' account-layout__nav-item--active' : ''}`
                        }
                      >
                        <MaskIcon src={item.icon} className="account-layout__nav-icon" />
                        <span className="account-layout__nav-label">{item.label}</span>
                        {count > 0 ? (
                          <span className="account-layout__badge" aria-label={`${count} new`}>
                            {count > 99 ? '99+' : count}
                          </span>
                        ) : null}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="account-layout__divider" />

            <ul className="account-layout__quick">
              {QUICK_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="account-layout__quick-link">
                    <span>{item.label}</span>
                    <MaskIcon src={chevronRight} className="account-layout__chevron" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="account-layout__bottom">
              <button
                type="button"
                className="account-layout__theme"
                onClick={toggleTheme}
                aria-pressed={dark}
                title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                <span className="account-layout__theme-left">
                  <MaskIcon src={moonIcon} className="account-layout__theme-icon" />
                  <span className="account-layout__theme-label">Dark Mode</span>
                </span>
                <span className={`account-layout__switch${dark ? ' account-layout__switch--on' : ''}`}>
                  <span className="account-layout__knob" />
                </span>
              </button>
              <button
                type="button"
                className="account-layout__logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Logging out…' : 'Log out'}
              </button>
            </div>
          </aside>

          <section className="account-layout__content">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  )
}
