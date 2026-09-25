import { Link } from 'react-router-dom'
import { fetchProducts, rupees, titleCase } from '../../../api/index.js'
import { useCart } from '../../../context/useCart.js'
import { mediaUrl, useAsync } from '../../../pages/Account/accountUtils.js'
import { cartItemOf } from '../../store/productUtils.js'
import { Bone } from '../../ui/PageState.jsx'
import bagIcon from '../../../assets/home/product-section/bag-icon.svg'
import arrowIcon from '../../../assets/home/product-section/arrow-icon.svg'
import arrowIconLg from '../../../assets/home/product-section/arrow-icon-lg.svg'
import starIcon from '../../../assets/home/product-section/star-icon.svg'
import cartIcon from '../../../assets/home/product-section/cart-icon.svg'
import chevronIcon from '../../../assets/home/product-section/chevron-icon.svg'
import './ProductSection.css'

const LIMIT = 5

/** Featured products first; the newest fill in when there are not enough. Also returns category labels. */
async function loadProducts() {
  const first = await fetchProducts({ featured: true, limit: LIMIT })
  let items = first?.items ?? []
  let categories = first?.categories ?? []
  if (items.length < LIMIT) {
    const more = await fetchProducts({ limit: LIMIT })
    const seen = new Set(items.map((p) => p.id))
    items = [...items, ...(more?.items ?? []).filter((p) => !seen.has(p.id))].slice(0, LIMIT)
    if (categories.length === 0) categories = more?.categories ?? []
  }
  const labels = Object.fromEntries(categories.map((c) => [c.key, c.label || titleCase(c.key)]))
  return { items, labels }
}

function CardSkeleton() {
  return (
    <article className="product-section__card" aria-hidden="true">
      <div className="product-section__media">
        <Bone style={{ height: '100%', borderRadius: 0 }} />
      </div>
      <div className="product-section__body">
        <Bone style={{ width: '40%', height: 11 }} />
        <Bone style={{ width: '80%', height: 15, marginTop: 10 }} />
        <Bone style={{ width: '60%', height: 15, marginTop: 12 }} />
        <Bone style={{ width: '100%', height: 36, marginTop: 14, borderRadius: 10 }} />
      </div>
    </article>
  )
}

export default function ProductSection() {
  const { add, open } = useCart()
  const { data, loading, error } = useAsync(loadProducts)
  const products = data?.items ?? []
  const labels = data?.labels ?? {}

  // A failed or empty load hides the section rather than showing a broken row.
  if (!loading && (error || products.length === 0)) return null

  const addToCart = (product) => {
    add(cartItemOf(product), 1)
    open()
  }

  return (
    <section className="product-section">
      <div className="product-section__inner">
        <div className="product-section__header">
          <div className="product-section__heading">
            <span className="product-section__badge">
              <img src={bagIcon} alt="" className="product-section__badge-icon" />
              <span>SPIRITUAL STORE</span>
            </span>
            <h2 className="product-section__title">Shop Spiritual Products</h2>
            <p className="product-section__subtitle">
              Authentic, handpicked products for your spiritual journey
            </p>
          </div>
          <Link to="/store" className="product-section__view-all">
            <span>View All Products</span>
            <img src={arrowIcon} alt="" className="product-section__view-all-icon icon-ink" />
          </Link>
        </div>

        <div className="product-section__row">
          {loading && !data
            ? Array.from({ length: LIMIT }, (_, i) => <CardSkeleton key={i} />)
            : products.map((product) => {
                const href = `/store/${product.slug}`
                const inStock = product.inStock ?? Number(product.stock) > 0
                const rated = Number(product.ratingCount) > 0
                const off = Number(product.discountPercent) || 0
                return (
                  <article key={product.id || product.slug} className="product-section__card">
                    <Link to={href} className="product-section__media" aria-label={product.name}>
                      {product.imageUrl && (
                        <img src={mediaUrl(product.imageUrl)} alt={product.name} className="product-section__image" />
                      )}
                      {product.badge && <span className="product-section__tag">{product.badge}</span>}
                      <span className="product-section__rating">
                        <img src={starIcon} alt="" className="product-section__rating-icon" />
                        <span>{rated ? Number(product.rating).toFixed(1) : 'New'}</span>
                      </span>
                    </Link>
                    <div className="product-section__body">
                      <p className="product-section__category">
                        {labels[product.category] || titleCase(product.category)}
                      </p>
                      <h3 className="product-section__name">
                        <Link to={href}>{product.name}</Link>
                      </h3>
                      <div className="product-section__price-row">
                        <span className="product-section__price">{rupees(product.price)}</span>
                        {product.oldPrice ? <s className="product-section__old-price">{rupees(product.oldPrice)}</s> : null}
                        {off > 0 && <span className="product-section__off">{off}% off</span>}
                      </div>
                      <div className="product-section__actions">
                        <button
                          type="button"
                          className="product-section__cart"
                          onClick={() => addToCart(product)}
                          disabled={!inStock}
                          title={inStock ? undefined : 'Out of stock'}
                        >
                          <img src={cartIcon} alt="" className="product-section__cart-icon icon-ink" />
                          <span>{inStock ? 'Cart' : 'Sold out'}</span>
                        </button>
                        <Link to={href} className="product-section__buy">
                          <img src={chevronIcon} alt="" className="product-section__buy-icon" />
                          <span>Buy Now</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
        </div>

        <div className="product-section__footer">
          <Link to="/store" className="product-section__explore">
            <span>Explore Full Store</span>
            <img src={arrowIconLg} alt="" className="product-section__explore-icon icon-ink" />
          </Link>
        </div>
      </div>
    </section>
  )
}
