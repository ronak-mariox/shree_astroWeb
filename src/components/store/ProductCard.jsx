import { Link } from 'react-router-dom'
import { rupees } from '../../api/index.js'
import { useCart } from '../../context/useCart.js'
import { mediaUrl } from '../../pages/Account/accountUtils.js'
import { Bone } from '../ui/PageState.jsx'
import { cartItemOf, formatCount } from './productUtils.js'
import starIcon from '../../assets/pages/store/star.svg'
import cartIcon from '../../assets/pages/store/cart-sm.svg'
import './ProductCard.css'

export function ProductCardSkeleton() {
  return (
    <article className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__media">
        <Bone style={{ height: '100%', borderRadius: 0 }} />
      </div>
      <div className="product-card__body">
        <Bone style={{ width: '80%', height: 16 }} />
        <Bone style={{ width: '40%', height: 12, marginTop: 10 }} />
        <Bone style={{ width: '55%', height: 18, marginTop: 12 }} />
        <Bone style={{ width: '100%', height: 40, marginTop: 14, borderRadius: 10 }} />
      </div>
    </article>
  )
}

export default function ProductCard({ product }) {
  const { add, open } = useCart()
  const href = `/store/${product.slug}`
  const inStock = product.inStock ?? Number(product.stock) > 0
  const rated = Number(product.ratingCount) > 0
  const discount = Number(product.discountPercent) || 0

  const handleAdd = () => {
    if (!inStock) return
    add(cartItemOf(product), 1)
    open()
  }

  return (
    <article className={`product-card${inStock ? '' : ' product-card--out'}`}>
      <Link to={href} className="product-card__media" aria-label={product.name}>
        {product.imageUrl && <img src={mediaUrl(product.imageUrl)} alt={product.name} className="product-card__image" />}
        {product.badge && <span className="product-card__badge">{product.badge}</span>}
        {discount > 0 && <span className="product-card__discount">{discount}% OFF</span>}
        {!inStock && <span className="product-card__soldout">Out of stock</span>}
      </Link>

      <div className="product-card__body">
        <h3 className="product-card__name">
          <Link to={href}>{product.name}</Link>
        </h3>

        <div className="product-card__rating">
          <img src={starIcon} alt="" className="product-card__star" />
          {rated ? (
            <>
              <span className="product-card__rating-value">{Number(product.rating).toFixed(1)}</span>
              <span className="product-card__reviews">({formatCount(product.ratingCount)})</span>
            </>
          ) : (
            <span className="product-card__reviews">New</span>
          )}
        </div>

        <div className="product-card__price-row">
          <span className="product-card__price">{rupees(product.price)}</span>
          {product.oldPrice ? <s className="product-card__old-price">{rupees(product.oldPrice)}</s> : null}
        </div>

        <button type="button" className="product-card__add" onClick={handleAdd} disabled={!inStock}>
          <img src={cartIcon} alt="" className="product-card__add-icon" />
          <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>
      </div>
    </article>
  )
}
