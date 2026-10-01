/**
 * Razorpay Standard Checkout for the browser: the script is fetched once, on
 * the first payment, and `openCheckout` turns the modal's callbacks into a
 * promise. Test vs live is decided purely by the key the backend hands over.
 */

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

/** The seeker closed the checkout without paying. */
export class PaymentCancelled extends Error {
  constructor(message = 'Payment cancelled') {
    super(message)
    this.name = 'PaymentCancelled'
    this.code = 'payment_cancelled'
  }
}

/** Razorpay reported the payment as failed; `message` is Razorpay's own description. */
export class PaymentFailed extends Error {
  constructor(message = 'Payment failed. Please try again.', details) {
    super(message)
    this.name = 'PaymentFailed'
    this.code = 'payment_failed'
    this.details = details
  }
}

export const isPaymentCancelled = (error) => error instanceof PaymentCancelled || error?.code === 'payment_cancelled'

let scriptPromise = null

/** Resolves with the `Razorpay` constructor; the `<script>` is added at most once. */
export function loadCheckout() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Payments need a browser.'))
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('The payment window could not start. Please try again.'))
    }
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'))
    document.head.appendChild(script)
  }).catch((error) => {
    /* A failed load must not poison the cache — the next attempt gets a fresh <script>. */
    scriptPromise = null
    document.head.querySelector(`script[src="${SCRIPT_URL}"]`)?.remove()
    throw error
  })
  return scriptPromise
}

/** The brand colour token (`--orange` in src/index.css) as the checkout's accent. */
function brandColour() {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue('--orange').trim()
  } catch {
    return ''
  }
}

/**
 * Opens the checkout. `options` are Razorpay's own (`key`, `order_id`,
 * `amount` in paise, `currency`, `name`, `description`, `prefill`, …).
 *
 * Resolves `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`.
 * Rejects `PaymentCancelled` when the modal is dismissed, and `PaymentFailed`
 * carrying Razorpay's description when a payment failed. A failure is reported
 * once the modal closes: Razorpay keeps it open so the seeker can retry with
 * another method, and that retry may still succeed.
 */
export async function openCheckout(options = {}) {
  const Razorpay = await loadCheckout()
  const colour = brandColour()

  return new Promise((resolve, reject) => {
    let settled = false
    let failure = null
    const settle = (fn, value) => {
      if (settled) return
      settled = true
      fn(value)
    }

    const checkout = new Razorpay({
      ...(colour && { theme: { color: colour } }),
      ...options,
      handler: (response) =>
        settle(resolve, {
          razorpay_payment_id: response?.razorpay_payment_id,
          razorpay_order_id: response?.razorpay_order_id,
          razorpay_signature: response?.razorpay_signature,
        }),
      modal: {
        ...options.modal,
        ondismiss: () => settle(reject, failure ?? new PaymentCancelled()),
      },
    })

    checkout.on('payment.failed', (response) => {
      const error = response?.error ?? {}
      failure = new PaymentFailed(error.description || error.reason || undefined, error)
    })

    try {
      checkout.open()
    } catch {
      settle(reject, new Error('The payment window could not open. Please try again.'))
    }
  })
}
