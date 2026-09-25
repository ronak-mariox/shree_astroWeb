import { mediaUrl } from '../../pages/Account/accountUtils.js'

/** 1800 → "1.8k", 340 → "340". */
export const formatCount = (n) => {
  const value = Number(n) || 0
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(value)
}

/** The shape `CartContext.add()` expects, from an API product. */
export const cartItemOf = (product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  price: Number(product.price) || 0,
  oldPrice: product.oldPrice ?? null,
  image: mediaUrl(product.imageUrl),
})
