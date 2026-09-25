import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProduct, rupees } from '../../api/index.js'
import { useCart } from '../../context/useCart.js'
import { mediaUrl, useAsync } from '../Account/accountUtils.js'
import ProductCard from '../../components/store/ProductCard.jsx'
import ProductReviews from './ProductReviews.jsx'
import { cartItemOf, formatCount } from '../../components/store/productUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import arrowIcon from '../../assets/pages/product-detail/arrow-up.svg'
import fireIcon from '../../assets/pages/product-detail/fire.gif'
import starsIcon from '../../assets/pages/product-detail/stars-5.svg'
import truckIcon from '../../assets/pages/product-detail/truck.gif'
import houseIcon from '../../assets/pages/product-detail/house.gif'
import clockIcon from '../../assets/pages/product-detail/clock.gif'
import chevronIcon from '../../assets/pages/product-detail/chevron-right.svg'
import upiGoogle from '../../assets/pages/product-detail/upi-a.svg'
import upiPhonePe from '../../assets/pages/product-detail/upi-b.svg'
import upiPaytmBg from '../../assets/pages/product-detail/upi-c.svg'
import upiPaytmText from '../../assets/pages/product-detail/upi-d.svg'
import './ProductDetail.css'

/** Mirrors the order contract: shipping is waived from this subtotal. */
const FREE_DELIVERY_FROM = 999
const MAX_QTY = 10

function deliveryDate() {
  const d = new Date()
  d.setDate(d.getDate() + 4)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function DetailSkeleton() {
  return (
    <section className="product-detail" aria-busy="true">
      <div className="product-detail__inner">
        <div className="product-detail__top">
          <div className="product-detail__gallery">
            <div className="product-detail__stage">
              <Bone style={{ height: '100%', borderRadius: 0 }} />
            </div>
          </div>
          <div className="product-detail__buy">
            <Bone style={{ width: '70%', height: 30 }} />
            <Bone style={{ width: '40%', height: 14, marginTop: 16 }} />
            <Bone style={{ width: '55%', height: 28, marginTop: 20 }} />
            <Bone style={{ width: '100%', height: 14, marginTop: 24 }} />
            <Bone style={{ width: '90%', height: 14, marginTop: 10 }} />
            <Bone style={{ width: '100%', height: 52, marginTop: 32, borderRadius: 12 }} />
            <Bone style={{ width: '100%', height: 52, marginTop: 12, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { add, open } = useCart()
  const { data, loading, error, reload } = useAsync(() => fetchProduct(slug), [slug])

  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(1)
  const [pincode, setPincode] = useState('')
  const [delivery, setDelivery] = useState(null)
  const [seenSlug, setSeenSlug] = useState(slug)
  const thumbsRef = useRef(null)

  if (slug !== seenSlug) {
    setSeenSlug(slug)
    setActive(0)
    setQty(1)
    setDelivery(null)
    setPincode('')
  }

  useEffect(() => {
    const el = thumbsRef.current?.children[active]
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [active])

  if (loading && !data) return <DetailSkeleton />

  if (!data?.product) {
    const missing = /not found/i.test(error || '')
    return (
      <section className="product-detail">
        <div className="product-detail__inner product-detail__inner--state">
          {missing ? (
            <PageEmpty
              title="Product not found"
              text="This product may have been removed. Browse the rest of the store."
              action={
                <Link to="/store" className="ui-state__btn">
                  Back to Store
                </Link>
              }
            />
          ) : (
            <PageError message={error} onRetry={reload} />
          )}
        </div>
      </section>
    )
  }

  const product = data.product
  const related = (data.related ?? []).filter((item) => item.id !== product.id)
  const gallery = [product.imageUrl, ...(product.images ?? [])].filter(Boolean).map(mediaUrl)
  const current = gallery[Math.min(active, Math.max(0, gallery.length - 1))]
  const stock = Number(product.stock) || 0
  const inStock = product.inStock ?? stock > 0
  const maxQty = Math.max(1, Math.min(MAX_QTY, stock || MAX_QTY))
  const discount = Number(product.discountPercent) || 0
  const rated = Number(product.ratingCount) > 0
  const highlights = product.highlights ?? []

  const prev = () => setActive((i) => (i - 1 + gallery.length) % gallery.length)
  const next = () => setActive((i) => (i + 1) % gallery.length)

  const handleAdd = () => {
    if (!inStock) return
    add(cartItemOf(product), Math.min(qty, maxQty))
    open()
  }

  const handleBuy = () => {
    if (!inStock) return
    add(cartItemOf(product), Math.min(qty, maxQty))
    navigate('/checkout')
  }

  const checkPincode = (e) => {
    e.preventDefault()
    if (/^\d{6}$/.test(pincode)) {
      setDelivery({ ok: true, text: `Estimated delivery by ${deliveryDate()}` })
    } else {
      setDelivery({ ok: false, text: 'Enter a valid 6-digit pincode' })
    }
  }

  return (
    <section className="product-detail">
      <div className="product-detail__inner">
        <div className="product-detail__top">
          <div className="product-detail__gallery">
            <div className="product-detail__stage">
              {current && <img src={current} alt={product.name} className="product-detail__stage-img" />}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="product-detail__arrow product-detail__arrow--prev"
                    onClick={prev}
                    aria-label="Previous image"
                  >
                    <img src={arrowIcon} alt="" className="product-detail__arrow-icon icon-ink" />
                  </button>
                  <button
                    type="button"
                    className="product-detail__arrow product-detail__arrow--next"
                    onClick={next}
                    aria-label="Next image"
                  >
                    <img src={arrowIcon} alt="" className="product-detail__arrow-icon icon-ink" />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="product-detail__thumbs" ref={thumbsRef}>
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className={`product-detail__thumb${i === active ? ' product-detail__thumb--active' : ''}`}
                    onClick={() => setActive(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-pressed={i === active}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail__buy">
            <h1 className="product-detail__title">{product.name}</h1>

            <div className="product-detail__social">
              {product.badge && (
                <span className="product-detail__ordered">
                  <img src={fireIcon} alt="" className="product-detail__ordered-icon" />
                  {product.badge}
                </span>
              )}
              <span className="product-detail__rating-inline">
                {rated ? (
                  <>
                    <img src={starsIcon} alt={`${product.rating} out of 5 stars`} className="product-detail__stars" />
                    {Number(product.rating).toFixed(1)} · {formatCount(product.ratingCount)} Reviews
                  </>
                ) : (
                  'New arrival'
                )}
              </span>
            </div>

            <div className="product-detail__price-row">
              <span className="product-detail__price">{rupees(product.price)}</span>
              {product.oldPrice ? <s className="product-detail__old-price">{rupees(product.oldPrice)}</s> : null}
              {discount > 0 && <span className="product-detail__discount">{discount}% OFF</span>}
            </div>

            <div className="product-detail__free">
              <span className="product-detail__free-text">Free Delivery over {rupees(FREE_DELIVERY_FROM)}</span>
              <span className="product-detail__free-icon">
                <img src={truckIcon} alt="" />
              </span>
            </div>

            <div className="product-detail__eta">
              <img src={houseIcon} alt="" className="product-detail__eta-icon" />
              Estimated Delivery Time
            </div>
            <form className="product-detail__pin" onSubmit={checkPincode}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="product-detail__pin-input"
                placeholder="Enter your pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                aria-label="Pincode"
              />
              <button type="submit" className="product-detail__pin-check">
                Check
              </button>
            </form>
            {delivery && (
              <p
                className={`product-detail__pin-result${delivery.ok ? '' : ' product-detail__pin-result--error'}`}
                role="status"
              >
                {delivery.text}
              </p>
            )}

            {inStock ? (
              stock > 0 && stock <= 10 ? (
                <div className="product-detail__units">
                  <img src={clockIcon} alt="" className="product-detail__units-icon" />
                  <span className="product-detail__units-text">
                    Only {stock} {stock === 1 ? 'unit' : 'units'} left
                  </span>
                  <img src={clockIcon} alt="" className="product-detail__units-icon" />
                </div>
              ) : null
            ) : (
              <div className="product-detail__units product-detail__units--out">
                <span className="product-detail__units-text">Currently out of stock</span>
              </div>
            )}

            <div className="product-detail__cta-row">
              <div className="product-detail__qty">
                <button
                  type="button"
                  className="product-detail__qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={!inStock}
                >
                  -
                </button>
                <span className="product-detail__qty-value" aria-live="polite">
                  {Math.min(qty, maxQty)}
                </span>
                <button
                  type="button"
                  className="product-detail__qty-btn"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  aria-label="Increase quantity"
                  disabled={!inStock || qty >= maxQty}
                >
                  +
                </button>
              </div>
              <button type="button" className="product-detail__add" onClick={handleAdd} disabled={!inStock}>
                {inStock ? 'Add to cart' : 'Out of stock'}
              </button>
            </div>
            <button type="button" className="product-detail__buy-now" onClick={handleBuy} disabled={!inStock}>
              <span>Buy now</span>
              <span className="product-detail__upi" aria-hidden="true">
                <img src={upiGoogle} alt="" className="product-detail__upi-google" />
                <img src={upiPhonePe} alt="" className="product-detail__upi-phonepe" />
                <img src={upiPaytmBg} alt="" className="product-detail__upi-paytm" />
                <img src={upiPaytmText} alt="" className="product-detail__upi-paytm-text" />
              </span>
              <img src={chevronIcon} alt="" className="product-detail__buy-now-icon" />
            </button>
          </div>
        </div>

        {(product.description || highlights.length > 0) && (
          <div className="product-detail__about">
            {product.description && (
              <div className="product-detail__about-col">
                <h2 className="product-detail__section-title">About this product</h2>
                {product.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="product-detail__about-text">
                    {para}
                  </p>
                ))}
              </div>
            )}
            {highlights.length > 0 && (
              <div className="product-detail__about-col">
                <h2 className="product-detail__section-title">Highlights</h2>
                <ul className="product-detail__highlights">
                  {highlights.map((item) => (
                    <li key={item} className="product-detail__highlight">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <ProductReviews key={product.slug || product.id} slug={product.slug || slug} product={product} />

        {related.length > 0 && (
          <div className="product-detail__related-wrap">
            <h2 className="product-detail__section-title">You may also like</h2>
            <div className="product-detail__related">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
