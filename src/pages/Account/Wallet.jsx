import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import {
  confirmTopUp,
  dateTime,
  fetchSettings,
  fetchTransactions,
  fetchWallet,
  messageOf,
  rupees,
  shortDate,
  startTopUp,
} from '../../api/index.js'
import CouponBox from '../../components/ui/CouponBox.jsx'
import txnCredit from '../../assets/account/txn-credit.svg'
import txnDebit from '../../assets/account/txn-debit.svg'
import { EmptyState, ErrorState, Skeleton, Spinner } from './accountUi.jsx'
import { idOf, useAsync } from './accountUtils.js'
import './Wallet.css'

const PRESETS = [99, 199, 299, 499, 999, 1999]
const PAGE_SIZE = 20

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'added', label: 'Added' },
  { key: 'spent', label: 'Spent' },
]

const EMPTY_TEXT = {
  all: 'No transactions yet. Add money to get started.',
  added: 'Nothing added yet.',
  spent: 'Nothing spent yet.',
}

function RowSkeleton() {
  return (
    <li className="account-wallet__row">
      <Skeleton style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0 }} />
      <div className="account-wallet__row-text">
        <Skeleton style={{ width: '50%', height: 14 }} />
        <Skeleton style={{ width: '30%', height: 11, marginTop: 8 }} />
      </div>
      <Skeleton style={{ width: 70, height: 18 }} />
    </li>
  )
}

export default function Wallet() {
  const { user, refreshUser } = useAuth()
  const wallet = useAsync(fetchWallet)
  const settings = useAsync(fetchSettings)

  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [listTick, setListTick] = useState(0)
  /** `key` names the request the rows belong to; a mismatch with the current key means a load is in flight. */
  const [list, setList] = useState({ key: null, rows: [], total: 0, error: null })
  const listKey = `${filter}:${page}:${listTick}`

  useEffect(() => {
    let cancelled = false
    fetchTransactions(filter, page, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return
        const items = data?.items ?? []
        setList((prev) => ({
          key: listKey,
          rows: page === 1 ? items : [...prev.rows, ...items],
          total: data?.total ?? items.length,
          error: null,
        }))
      })
      .catch((err) => {
        if (!cancelled) setList((prev) => ({ ...prev, key: listKey, error: messageOf(err) }))
      })
    return () => {
      cancelled = true
    }
  }, [filter, page, listTick, listKey])

  const rows = list.rows
  const total = list.total
  const listLoading = list.key !== listKey
  const listError = listLoading ? null : list.error

  const changeFilter = (key) => {
    if (key === filter) return
    setFilter(key)
    setPage(1)
    setList((l) => ({ ...l, rows: [], total: 0, error: null }))
  }
  const reloadList = () => {
    setPage(1)
    setList((l) => ({ ...l, rows: [], total: 0, error: null }))
    setListTick((t) => t + 1)
  }

  /* -------------------------------------------------------------- top-up */
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(PRESETS[1])
  const [custom, setCustom] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [toast, setToast] = useState('')
  /** `{ code, coupon, discount, bonusAmount? }` from POST /coupons/validate, or null. */
  const [coupon, setCoupon] = useState(null)

  const min = Number(settings.data?.minRecharge) || 1
  const max = Number(settings.data?.maxRecharge) || 100000
  const presets = PRESETS.filter((v) => v >= min && v <= max)
  const customValue = Number.parseInt(custom, 10)
  const amount = custom !== '' && customValue > 0 ? customValue : selected
  const amountOk = Number.isFinite(amount) && amount >= min && amount <= max
  const bonus = coupon ? Math.max(0, Number(coupon.bonusAmount ?? coupon.discount) || 0) : 0

  const pickPreset = (value) => {
    setSelected(value)
    setCustom('')
    setPayError('')
  }

  const pay = async (e) => {
    e.preventDefault()
    if (!amountOk || paying) return
    setPaying(true)
    setPayError('')
    setToast('')
    try {
      const order = await startTopUp(amount, coupon?.code)
      /* No gateway is wired yet, so the order is confirmed straight away; `method` is cosmetic. */
      const txn = await confirmTopUp(order.transactionId, undefined, 'upi')
      const credited = Number(order?.bonusAmount) || 0
      setToast(
        `${rupees(txn?.amount ?? amount)} added to your wallet${credited > 0 ? ` + ${rupees(credited)} coupon bonus` : ''}${
          txn?.reference ? ` · ${txn.reference}` : ''
        }.`,
      )
      setAdding(false)
      setCustom('')
      setCoupon(null)
      wallet.reload()
      reloadList()
      refreshUser().catch(() => {})
    } catch (err) {
      if (err?.code === 'coupon_invalid') setCoupon(null)
      setPayError(messageOf(err))
    } finally {
      setPaying(false)
    }
  }

  const balance = wallet.data?.balance ?? user?.wallet?.balance
  const walletBusy = wallet.loading && !wallet.data
  const lastTxnAt = wallet.data?.lastTransactionAt || rows[0]?.createdAt
  const hasMore = rows.length < total

  return (
    <div className="account-wallet">
      <div className="account-page__head">
        <div>
          <h1 className="account-page__title">User Wallet</h1>
          <p className="account-page__subtitle">Manage your balance and transaction history</p>
        </div>
      </div>

      <section className="account-wallet__balance">
        <span className="account-wallet__glow" aria-hidden="true" />
        <p className="account-wallet__eyebrow">User Wallet</p>
        {walletBusy && balance == null ? (
          <div className="account-wallet__amount">
            <Skeleton />
          </div>
        ) : (
          <p className="account-wallet__amount">{rupees(balance)}</p>
        )}
        <p className="account-wallet__note">
          {wallet.error && !wallet.data ? (
            <>
              {wallet.error}{' '}
              <button type="button" className="account-wallet__retry" onClick={wallet.reload}>
                Retry
              </button>
            </>
          ) : (
            'Auto-applied on your next consultation'
          )}
        </p>
        <div className="account-wallet__actions">
          <Link to="/astrologers" className="account-wallet__btn account-wallet__btn--primary">
            Use Now
          </Link>
          <button
            type="button"
            className={`account-wallet__btn account-wallet__btn--ghost${adding ? ' account-wallet__btn--open' : ''}`}
            onClick={() => {
              setAdding((v) => !v)
              setPayError('')
              setToast('')
            }}
            aria-expanded={adding}
          >
            Add Money
          </button>
        </div>

        {toast && (
          <p className="account-wallet__toast" role="status">
            {toast}
          </p>
        )}

        {adding && (
          <form className="account-wallet__topup" onSubmit={pay}>
            <p className="account-wallet__topup-label">Select Amount</p>
            <div className="account-wallet__grid">
              {(presets.length ? presets : PRESETS).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`account-wallet__tile${amount === value ? ' account-wallet__tile--active' : ''}`}
                  onClick={() => pickPreset(value)}
                  disabled={paying}
                >
                  ₹{value}
                </button>
              ))}
            </div>
            <div className="account-wallet__topup-row">
              <input
                className="account-wallet__input"
                type="number"
                min={min}
                max={max}
                step="1"
                inputMode="numeric"
                placeholder="Or enter custom amount"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value)
                  setPayError('')
                }}
                disabled={paying}
                aria-label="Custom amount"
              />
              <button
                type="submit"
                className="account-wallet__btn account-wallet__btn--primary"
                disabled={!amountOk || paying}
              >
                {paying ? 'Adding…' : `Pay ${rupees(amount || 0)}`}
              </button>
              <button
                type="button"
                className="account-wallet__btn account-wallet__btn--ghost"
                onClick={() => setAdding(false)}
                disabled={paying}
              >
                Cancel
              </button>
            </div>
            <CouponBox
              tone="dark"
              context="topup"
              amount={amount}
              applied={coupon}
              onChange={(next) => {
                setCoupon(next)
                setPayError('')
              }}
              disabled={paying}
            />
            {coupon && bonus > 0 && (
              <p className="account-wallet__topup-bonus" role="status">
                +{rupees(bonus)} will be added to your wallet with this top-up.
              </p>
            )}
            <p className="account-wallet__topup-limits">
              {settings.loading && !settings.data
                ? 'Checking recharge limits…'
                : `Minimum ${rupees(min)} · Maximum ${rupees(max)}`}
              {!amountOk && custom !== '' ? ` — enter an amount between ${rupees(min)} and ${rupees(max)}.` : ''}
            </p>
            {payError && (
              <p className="account-wallet__topup-error" role="alert">
                {payError}
              </p>
            )}
          </form>
        )}
      </section>

      <div className="account-wallet__tiles">
        <div className="account-wallet__summary">
          {walletBusy ? (
            <Skeleton />
          ) : (
            <p className="account-wallet__summary-value account-wallet__summary-value--green">
              {rupees(wallet.data?.totalAdded ?? user?.wallet?.totalAdded)}
            </p>
          )}
          <p className="account-wallet__summary-label">Total Credited</p>
        </div>
        <div className="account-wallet__summary">
          {walletBusy ? (
            <Skeleton />
          ) : (
            <p className="account-wallet__summary-value account-wallet__summary-value--red">
              {rupees(wallet.data?.totalSpent ?? user?.wallet?.totalSpent)}
            </p>
          )}
          <p className="account-wallet__summary-label">Total Spent</p>
        </div>
        <div className="account-wallet__summary">
          {walletBusy && listLoading ? (
            <Skeleton />
          ) : (
            <p className="account-wallet__summary-value account-wallet__summary-value--muted">
              {lastTxnAt ? shortDate(lastTxnAt) : '—'}
            </p>
          )}
          <p className="account-wallet__summary-label">Last Transaction</p>
        </div>
      </div>

      <section className="account-wallet__history">
        <div className="account-wallet__history-head">
          <h3 className="account-wallet__history-title">Transaction History</h3>
          <div className="account-wallet__filters" role="tablist" aria-label="Filter transactions">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`account-wallet__filter${filter === f.key ? ' account-wallet__filter--active' : ''}`}
                onClick={() => changeFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="account-wallet__list">
          {listLoading && rows.length === 0 ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : listError && rows.length === 0 ? (
            <ErrorState compact message={listError} onRetry={reloadList} />
          ) : rows.length === 0 ? (
            <EmptyState compact text={EMPTY_TEXT[filter]} />
          ) : (
            rows.map((t) => {
              const credit = t.direction === 'credit'
              const status = t.status && t.status !== 'success' ? t.status : null
              return (
                <li
                  key={idOf(t)}
                  className={`account-wallet__row${status ? ` account-wallet__row--${status}` : ''}`}
                >
                  <div
                    className={`account-wallet__row-icon ${credit ? 'account-wallet__row-icon--credit' : 'account-wallet__row-icon--debit'}`}
                  >
                    <img src={credit ? txnCredit : txnDebit} alt="" />
                  </div>
                  <div className="account-wallet__row-text">
                    <p className="account-wallet__row-title">
                      {t.title || (credit ? 'Money added' : 'Money spent')}
                      {status && (
                        <span className={`account-wallet__row-status account-wallet__row-status--${status}`}>
                          {status}
                        </span>
                      )}
                    </p>
                    <p className="account-wallet__row-date">
                      {dateTime(t.createdAt)}
                      {t.reference && <span className="account-wallet__row-ref">· {t.reference}</span>}
                    </p>
                  </div>
                  <span
                    className={`account-wallet__row-amount ${credit ? 'account-wallet__row-amount--credit' : 'account-wallet__row-amount--debit'}`}
                  >
                    {credit ? '+' : '−'}
                    {rupees(t.amount)}
                  </span>
                </li>
              )
            })
          )}
        </ul>

        {listLoading && rows.length > 0 && <Spinner label="Loading more…" />}
        {listError && rows.length > 0 && (
          <ErrorState compact message={listError} onRetry={() => setListTick((t) => t + 1)} />
        )}
        {!listLoading && !listError && hasMore && (
          <button type="button" className="account-wallet__more" onClick={() => setPage((p) => p + 1)}>
            Load more ({total - rows.length} more)
          </button>
        )}
      </section>
    </div>
  )
}
