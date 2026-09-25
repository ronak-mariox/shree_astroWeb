import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { rupees } from '../../api/index.js'
import { useCart } from '../../context/useCart.js'
import { mediaUrl } from '../../pages/Account/accountUtils.js'
import './CartDrawer.css'

const FREE_SHIPPING_FROM = 999
const SHIPPING_FEE = 49

export default function CartDrawer() {
  const { items, count, subtotal, remove, setQty, isOpen, close } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE

  const goCheckout = () => {
    close()
    navigate('/checkout')
  }

  return (
    <div className={`cart-drawer${isOpen ? ' cart-drawer--open' : ''}`} aria-hidden={!isOpen} inert={!isOpen}>
      <button type="button" className="cart-drawer__overlay" aria-label="Close cart" onClick={close} tabIndex={-1} />
      <aside className="cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Your cart">
        <header className="cart-drawer__head">
          <h2 className="cart-drawer__title">Your Cart ({count})</h2>
          <button type="button" className="cart-drawer__close" aria-label="Close cart" onClick={close}>
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <p className="cart-drawer__empty-title">Your cart is empty</p>
            <p className="cart-drawer__empty-text">Add products from the store to see them here.</p>
            <button type="button" className="btn-gradient cart-drawer__continue" onClick={close}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-drawer__list">
              {items.map((item) => (
                <li key={item.id} className="cart-drawer__item">
                  <img className="cart-drawer__thumb" src={mediaUrl(item.image)} alt={item.name} />
                  <div className="cart-drawer__info">
                    <p className="cart-drawer__name">{item.name}</p>
                    <p className="cart-drawer__price">{rupees(item.price)}</p>
                  </div>
                  <div className="cart-drawer__actions">
                    <button
                      type="button"
                      className="cart-drawer__remove"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => remove(item.id)}
                    >
                      ×
                    </button>
                    <div className="cart-drawer__stepper">
                      <button
                        type="button"
                        className="cart-drawer__step"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(item.id, item.qty - 1)}
                      >
                        −
                      </button>
                      <span className="cart-drawer__qty">{item.qty}</span>
                      <button
                        type="button"
                        className="cart-drawer__step"
                        aria-label="Increase quantity"
                        onClick={() => setQty(item.id, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="cart-drawer__foot">
              <div className="cart-drawer__row">
                <span className="cart-drawer__label">Subtotal</span>
                <span className="cart-drawer__value">{rupees(subtotal)}</span>
              </div>
              <div className="cart-drawer__row cart-drawer__row--delivery">
                <span className="cart-drawer__label">Delivery</span>
                <span className="cart-drawer__value">{shipping === 0 ? 'FREE' : rupees(shipping)}</span>
              </div>
              <div className="cart-drawer__divider" />
              <div className="cart-drawer__row cart-drawer__row--total">
                <span className="cart-drawer__label">Total</span>
                <span className="cart-drawer__value">{rupees(subtotal + shipping)}</span>
              </div>
              <p className="cart-drawer__note">GST (18%) is added at checkout.</p>
              <button type="button" className="cart-drawer__checkout" onClick={goCheckout}>
                Proceed to Checkout →
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
