import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { fetchOffers, rupees, shortDate, titleCase } from '../../api/index.js'
import { mediaUrl, useAsync } from '../Account/accountUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import zapIcon from '../../assets/pages/offers/zap-icon.svg'
import walletIcon from '../../assets/pages/offers/wallet-icon.svg'
import shieldIcon from '../../assets/pages/offers/shield-icon.svg'
import usersIcon from '../../assets/pages/offers/users-icon.svg'
import shareIcon from '../../assets/pages/offers/share-icon.svg'
import checkIcon from '../../assets/pages/offers/check-icon.svg'
import tagOrange from '../../assets/pages/offers/tag-orange.svg'
import tagPurple from '../../assets/pages/offers/tag-purple.svg'
import tagGreen from '../../assets/pages/offers/tag-green.svg'
import tagBlue from '../../assets/pages/offers/tag-blue.svg'
import copyOrange from '../../assets/pages/offers/copy-orange.svg'
import copyPurple from '../../assets/pages/offers/copy-purple.svg'
import copyGreen from '../../assets/pages/offers/copy-green.svg'
import copyBlue from '../../assets/pages/offers/copy-blue.svg'
import calendarIcon from '../../assets/pages/offers/calendar-icon.svg'
import tierSilver from '../../assets/pages/offers/tier-silver.svg'
import tierGold from '../../assets/pages/offers/tier-gold.svg'
import tierPlatinum from '../../assets/pages/offers/tier-platinum.svg'
import tierDiamond from '../../assets/pages/offers/tier-diamond.svg'
import checkSilver from '../../assets/pages/offers/check-silver.svg'
import checkGold from '../../assets/pages/offers/check-gold.svg'
import checkPlatinum from '../../assets/pages/offers/check-platinum.svg'
import checkDiamond from '../../assets/pages/offers/check-diamond.svg'
import earnChat from '../../assets/pages/offers/earn-chat.svg'
import earnCall from '../../assets/pages/offers/earn-call.svg'
import earnStore from '../../assets/pages/offers/earn-store.svg'
import earnReferral from '../../assets/pages/offers/earn-referral.svg'
import './Offers.css'


/** The invite link on this very site — whatever host it is running on — so it always opens here. */
const shareLinkFor = (code, fallback) =>
  code && typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${encodeURIComponent(code)}` : fallback || ''

const STEPS = ['Share your link', 'Friend signs up', 'Both get rewarded']

const TONES = ['orange', 'purple', 'green', 'blue']
const TONE_ICONS = {
  orange: { tag: tagOrange, copy: copyOrange },
  purple: { tag: tagPurple, copy: copyPurple },
  green: { tag: tagGreen, copy: copyGreen },
  blue: { tag: tagBlue, copy: copyBlue },
}

const TIER_ICONS = {
  silver: { icon: tierSilver, check: checkSilver },
  gold: { icon: tierGold, check: checkGold },
  platinum: { icon: tierPlatinum, check: checkPlatinum },
  diamond: { icon: tierDiamond, check: checkDiamond },
}

const EARN_ICONS = { chat: earnChat, call: earnCall, order: earnStore, store: earnStore, puja: earnStore, referral: earnReferral }

const toneOf = (coupon, index) => (TONES.includes(coupon.tone) ? coupon.tone : TONES[index % TONES.length])

const APPLIES_LABEL = { order: 'Store orders', puja: 'Puja bookings', topup: 'Wallet top-ups' }
const appliesText = (coupon) =>
  coupon.description || (coupon.appliesTo ?? []).map((k) => APPLIES_LABEL[k] || titleCase(k)).join(', ') || 'All services'

function pointsRange(tier) {
  const from = Number(tier.minPoints) || 0
  if (tier.maxPoints == null) return `${from.toLocaleString('en-IN')}+ pts`
  return `${from.toLocaleString('en-IN')} – ${Number(tier.maxPoints).toLocaleString('en-IN')} pts`
}

function festivalDates(f) {
  if (f.startsAt && f.endsAt && shortDate(f.startsAt) !== shortDate(f.endsAt)) {
    return `${shortDate(f.startsAt)} – ${shortDate(f.endsAt)}`
  }
  return shortDate(f.endsAt || f.startsAt)
}

const linkOf = (to) => (typeof to === 'string' && to.startsWith('/') ? to : '/astrologers')

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  } catch {
    return false
  }
}

function CouponSkeleton() {
  return (
    <article className="offers-page__coupon offers-page__coupon--orange" aria-hidden="true">
      <div className="offers-page__coupon-top">
        <Bone style={{ width: '40%', height: 12 }} />
        <Bone style={{ width: '55%', height: 28, marginTop: 12 }} />
        <Bone style={{ width: '70%', height: 12, marginTop: 10 }} />
      </div>
      <div className="offers-page__coupon-bottom">
        <Bone style={{ height: 40 }} />
      </div>
    </article>
  )
}

function FestivalSkeleton() {
  return (
    <article className="offers-page__festival" aria-hidden="true">
      <div className="offers-page__festival-media" />
      <div className="offers-page__festival-body">
        <Bone style={{ width: '70%', height: 16 }} />
        <Bone style={{ width: '90%', height: 12, marginTop: 10 }} />
        <Bone style={{ width: '40%', height: 12, marginTop: 10 }} />
      </div>
    </article>
  )
}

export default function Offers() {
  const { user, isLoggedIn } = useAuth()
  const { data, loading, error, reload } = useAsync(fetchOffers, [isLoggedIn])
  const [copied, setCopied] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = async (key, text) => {
    await copyText(text)
    setCopied(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1800)
  }

  const busy = loading && !data
  const coupons = data?.coupons ?? []
  const festivals = data?.festivals ?? []
  const tiers = data?.loyalty?.tiers ?? []
  const earn = data?.loyalty?.earn ?? []
  const me = data?.loyalty?.me ?? null
  const referral = data?.referral ?? null
  const referralStats = referral?.stats ?? referral ?? {}
  const rewardAmount = Number(referral?.rewardAmount) || 0
  const myTier = me ? tiers.find((t) => t.key === me.tier) : null
  const cashbackPercent = Number(myTier?.cashbackPercent) || 0
  const balance = user?.wallet?.balance

  return (
    <div className="offers-page">
      <section className="offers-page__hero">
        <span className="offers-page__glow offers-page__glow--gold" aria-hidden="true" />
        <span className="offers-page__glow offers-page__glow--orange" aria-hidden="true" />
        <div className="offers-page__inner offers-page__hero-inner">
          <span className="offers-page__pill">
            <img src={zapIcon} alt="" className="offers-page__pill-icon" />
            Exclusive Offers
          </span>
          <h1 className="offers-page__title">
            Offers, Rewards &amp; <span className="offers-page__title-accent">Cashback</span>
          </h1>
          <p className="offers-page__subtitle">
            Save on every consultation. Earn loyalty points. Refer friends. Get rewarded.
          </p>
        </div>
      </section>

      <div className="offers-page__inner offers-page__body">
        {error && !data && (
          <div style={{ paddingBottom: 28 }}>
            <PageError message={error} onRetry={reload} />
          </div>
        )}

        <section className="offers-page__top">
          <div className="offers-page__wallet">
            <span className="offers-page__wallet-glow" aria-hidden="true" />
            <p className="offers-page__wallet-eyebrow">
              <img src={walletIcon} alt="" className="offers-page__wallet-icon" />
              Astro Wallet
            </p>
            {isLoggedIn ? (
              <p className="offers-page__wallet-amount">{balance == null ? '…' : rupees(balance)}</p>
            ) : (
              <p className="offers-page__wallet-amount offers-page__wallet-amount--guest">Sign in to see your balance</p>
            )}
            <p className="offers-page__wallet-note">
              {me
                ? `${titleCase(me.tier)} member · ${Number(me.points || 0).toLocaleString('en-IN')} points`
                : 'Auto-applied on your next consultation'}
            </p>
            <div className="offers-page__wallet-actions">
              <Link to="/astrologers" className="offers-page__wallet-btn offers-page__wallet-btn--primary">
                Use Now
              </Link>
              <Link
                to={isLoggedIn ? '/account/wallet' : '/login'}
                state={isLoggedIn ? undefined : { from: '/account/wallet' }}
                className="offers-page__wallet-btn offers-page__wallet-btn--ghost"
              >
                {isLoggedIn ? 'Add Money' : 'Sign in'}
              </Link>
            </div>
            <p className="offers-page__wallet-tip">
              <img src={shieldIcon} alt="" />
              {cashbackPercent > 0
                ? `Earn ${cashbackPercent}% cashback on every consultation · Auto-credited to your wallet`
                : 'Earn loyalty points on every consultation · Unlock cashback as you level up'}
            </p>
          </div>

          <div className="offers-page__referral">
            <div className="offers-page__referral-head">
              <span className="offers-page__referral-icon">
                <img src={usersIcon} alt="" />
              </span>
              <div>
                <h3 className="offers-page__referral-title">Referral Program</h3>
                <p className="offers-page__referral-text">
                  Refer a friend and {rewardAmount > 0 ? `you both earn ${rupees(rewardAmount)}` : 'earn a wallet reward'}{' '}
                  when they complete their first consultation.
                </p>
              </div>
            </div>
            <ol className="offers-page__steps">
              {STEPS.map((label, i) => (
                <li key={label} className="offers-page__step">
                  <span className="offers-page__step-num">{i + 1}</span>
                  <span className="offers-page__step-label">
                    {i === 2 && rewardAmount > 0 ? `Both get ${rupees(rewardAmount)}` : label}
                  </span>
                </li>
              ))}
            </ol>
            {!isLoggedIn ? (
              <div className="offers-page__link-row">
                <span className="offers-page__link-box offers-page__link-box--muted">Sign in to get your referral link</span>
                <Link to="/login" state={{ from: '/offers' }} className="offers-page__link-btn">
                  Sign in
                </Link>
              </div>
            ) : busy ? (
              <div className="offers-page__link-row">
                <Bone style={{ height: 44 }} />
              </div>
            ) : shareLinkFor(referral?.code, referral?.link) ? (
              <>
                <div className="offers-page__link-row">
                  <span className="offers-page__link-box" title={shareLinkFor(referral.code, referral.link)}>
                    {shareLinkFor(referral.code, referral.link).replace(/^https?:\/\//, '')}
                  </span>
                  <button
                    type="button"
                    className="offers-page__link-btn"
                    onClick={() => handleCopy('link', shareLinkFor(referral.code, referral.link))}
                  >
                    <img src={shareIcon} alt="" />
                    {copied === 'link' ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
                <ul className="offers-page__ref-stats">
                  <li>
                    <strong>{referral.code}</strong>
                    <span>Your code</span>
                  </li>
                  <li>
                    <strong>{Number(referralStats.invited) || 0}</strong>
                    <span>Invited</span>
                  </li>
                  <li>
                    <strong>{Number(referralStats.completed) || 0}</strong>
                    <span>Completed</span>
                  </li>
                  <li>
                    <strong>{rupees(referralStats.earned)}</strong>
                    <span>Earned</span>
                  </li>
                </ul>
              </>
            ) : (
              <div className="offers-page__link-row">
                <span className="offers-page__link-box offers-page__link-box--muted">
                  {error ? 'Referral link unavailable right now' : 'Referral rewards are paused right now'}
                </span>
              </div>
            )}
          </div>
        </section>

        {(busy || coupons.length > 0) && (
          <section className="offers-page__section">
            <div className="offers-page__section-head">
              <h2 className="offers-page__heading">Active Coupon Codes</h2>
              <span className="offers-page__verified">
                <img src={checkIcon} alt="" />
                All codes verified
              </span>
            </div>
            <div className="offers-page__coupons">
              {busy
                ? [0, 1, 2, 3].map((i) => <CouponSkeleton key={i} />)
                : coupons.map((c, i) => {
                    const tone = toneOf(c, i)
                    const icons = TONE_ICONS[tone]
                    return (
                      <article key={c.id || c.code} className={`offers-page__coupon offers-page__coupon--${tone}`}>
                        <div className="offers-page__coupon-top">
                          <p className="offers-page__coupon-label">
                            <img src={icons.tag} alt="" />
                            {c.tag || titleCase(c.kind)}
                          </p>
                          <p className="offers-page__coupon-discount">{c.label || c.title}</p>
                          <p className="offers-page__coupon-desc">{c.title && c.label ? c.title : appliesText(c)}</p>
                        </div>
                        <div className="offers-page__coupon-bottom">
                          <div className="offers-page__code-box">
                            <span className="offers-page__code">{c.code}</span>
                            <button
                              type="button"
                              className="offers-page__copy"
                              onClick={() => handleCopy(c.code, c.code)}
                              aria-label={`Copy code ${c.code}`}
                            >
                              <img src={icons.copy} alt="" />
                              {copied === c.code ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="offers-page__coupon-foot">
                            <span>{Number(c.minAmount) > 0 ? `Min ${rupees(c.minAmount)}` : 'No minimum'}</span>
                            <span>{c.validTo ? `Expires ${shortDate(c.validTo)}` : 'No expiry'}</span>
                          </div>
                        </div>
                      </article>
                    )
                  })}
            </div>
          </section>
        )}

        {(busy || festivals.length > 0) && (
          <section className="offers-page__section">
            <h2 className="offers-page__heading">Festival Discounts</h2>
            <div className="offers-page__festivals">
              {busy
                ? [0, 1, 2, 3].map((i) => <FestivalSkeleton key={i} />)
                : festivals.map((f) => (
                    <article key={f.id} className="offers-page__festival">
                      <div className="offers-page__festival-media">
                        {f.imageUrl && <img src={mediaUrl(f.imageUrl)} alt="" className="offers-page__festival-img" />}
                        {f.badge && <span className="offers-page__festival-badge">{f.badge}</span>}
                      </div>
                      <div className="offers-page__festival-body">
                        <h3 className="offers-page__festival-title">{f.title}</h3>
                        <p className="offers-page__festival-desc">{f.subtitle}</p>
                        <p className="offers-page__festival-date">
                          <img src={calendarIcon} alt="" />
                          {festivalDates(f)}
                          {f.couponCode ? ` · Code ${f.couponCode}` : ''}
                        </p>
                        <Link to={linkOf(f.linkTo)} className="offers-page__festival-btn">
                          Grab Offer
                        </Link>
                      </div>
                    </article>
                  ))}
            </div>
          </section>
        )}

        {!busy && !error && coupons.length === 0 && festivals.length === 0 && (
          <section className="offers-page__section">
            <PageEmpty title="No live offers right now" text="Check back soon — festival deals and coupon codes land here first." />
          </section>
        )}

        {(busy || tiers.length > 0) && (
          <section className="offers-page__section offers-page__loyalty">
            <h2 className="offers-page__heading offers-page__heading--center">Loyalty Rewards Program</h2>
            <p className="offers-page__loyalty-sub">
              Earn points with every consultation and unlock exclusive member benefits.
              {me && me.nextTier && Number(me.pointsToNext) > 0
                ? ` You are ${Number(me.pointsToNext).toLocaleString('en-IN')} points from ${titleCase(
                    me.nextTier.name || me.nextTier.key || me.nextTier,
                  )}.`
                : ''}
            </p>
            <div className="offers-page__tiers">
              {busy
                ? [0, 1, 2, 3].map((i) => (
                    <article key={i} className="offers-page__tier" aria-hidden="true">
                      <Bone style={{ width: 48, height: 48, borderRadius: 14 }} />
                      <Bone style={{ width: '50%', height: 18, marginTop: 16 }} />
                      <Bone style={{ width: '40%', height: 12, marginTop: 8 }} />
                      <Bone style={{ width: '90%', height: 12, marginTop: 18 }} />
                      <Bone style={{ width: '80%', height: 12, marginTop: 10 }} />
                    </article>
                  ))
                : tiers.map((t) => {
                    const icons = TIER_ICONS[t.key] || TIER_ICONS.silver
                    const mine = me?.tier === t.key
                    const perks = Array.isArray(t.perks) && t.perks.length > 0 ? t.perks : []
                    return (
                      <article
                        key={t.key}
                        className={`offers-page__tier offers-page__tier--${t.key}${mine ? ' offers-page__tier--mine' : ''}`}
                      >
                        {mine && <span className="offers-page__tier-badge">Your tier</span>}
                        <span className="offers-page__tier-icon">
                          <img src={icons.icon} alt="" />
                        </span>
                        <p className="offers-page__tier-name">{t.name || titleCase(t.key)}</p>
                        <p className="offers-page__tier-range">{pointsRange(t)}</p>
                        <ul className="offers-page__perks">
                          {Number(t.cashbackPercent) > 0 && (
                            <li className="offers-page__perk">
                              <span className="offers-page__perk-check">
                                <img src={icons.check} alt="" />
                              </span>
                              {t.cashbackPercent}% cashback on consultations
                            </li>
                          )}
                          {perks.map((p) => (
                            <li key={p} className="offers-page__perk">
                              <span className="offers-page__perk-check">
                                <img src={icons.check} alt="" />
                              </span>
                              {p}
                            </li>
                          ))}
                          {perks.length === 0 && !(Number(t.cashbackPercent) > 0) && (
                            <li className="offers-page__perk">
                              <span className="offers-page__perk-check">
                                <img src={icons.check} alt="" />
                              </span>
                              Earn points on every consultation
                            </li>
                          )}
                        </ul>
                      </article>
                    )
                  })}
            </div>

            {earn.length > 0 && (
              <div className="offers-page__earn">
                <div className="offers-page__earn-text">
                  <p className="offers-page__earn-title">How to earn points</p>
                  <ul className="offers-page__earn-list">
                    {earn.map((e) => (
                      <li key={e.key} className="offers-page__earn-item">
                        <img src={EARN_ICONS[e.key] || earnStore} alt="" />
                        <span>{e.label || titleCase(e.key)}</span>
                        <strong>
                          {e.points != null
                            ? `— ${e.points} pts`
                            : `— ${Number(e.pointsPer100) || 0} pts / ₹100`}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to={isLoggedIn ? '/account/rewards' : '/astrologers'} className="offers-page__earn-btn">
                  {isLoggedIn ? 'View My Rewards' : 'Start Earning'}
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
