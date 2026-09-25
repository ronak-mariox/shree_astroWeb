import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './cart-context.js'

const STORAGE_KEY = 'shreeastro-cart'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable */
    }
  }, [items])

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          oldPrice: product.oldPrice ?? null,
          image: product.image,
          qty,
        },
      ]
    })
  }, [])

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), [])

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0)
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0)
    return { items, count, subtotal, add, remove, setQty, clear, isOpen, open, close }
  }, [items, add, remove, setQty, clear, isOpen, open, close])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
