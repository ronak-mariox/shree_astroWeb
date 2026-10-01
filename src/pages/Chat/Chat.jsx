import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConnectingScreen from '../../components/consult/ConnectingScreen.jsx'
import LowBalanceModal from '../../components/consult/LowBalanceModal.jsx'
import RechargeModal from '../../components/consult/RechargeModal.jsx'
import ProcessingModal from '../../components/consult/ProcessingModal.jsx'
import EndConfirmModal from '../../components/consult/EndConfirmModal.jsx'
import CompletedScreen from '../../components/consult/CompletedScreen.jsx'
import ReviewModal from '../../components/consult/ReviewModal.jsx'
import ContinueConsultationModal from '../../components/consult/ContinueConsultationModal.jsx'
import { formatCountdown, resolveQuotes } from '../../data/consultPackages.js'
import { rupees } from '../../api/index.js'
import endChatIcon from '../../assets/pages/chat/end-chat-icon.svg'
import endChatModalIcon from '../../assets/pages/chat/end-chat-modal-icon.svg'
import sendIcon from '../../assets/pages/chat/send-icon.svg'
import { avatarFor, endedMessage, formatDuration, useConsultation } from './useConsultation.js'
import './Chat.css'

const money = (value) => (Number.isInteger(Number(value)) ? String(Number(value) || 0) : Number(value || 0).toFixed(2))

export default function Chat() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const c = useConsultation(chatId, 'chat')

  const [draft, setDraft] = useState('')
  const [recharge, setRecharge] = useState(false)
  /** The amount the recharge modal should suggest when opened from the continue choice. */
  const [rechargeNeed, setRechargeNeed] = useState(0)
  const [processingAmount, setProcessingAmount] = useState(0)
  const [endConfirm, setEndConfirm] = useState(false)
  const [review, setReview] = useState(false)
  const bottomRef = useRef(null)

  const astrologer = c.astrologer || { name: 'Astrologer', avatar: avatarFor('A'), specialty: '' }
  const durationText = formatDuration(c.elapsed)
  const chargeText = money(c.charge)
  const balanceText = c.balance == null ? '—' : rupees(c.balance)

  useEffect(() => {
    if (c.phase !== 'live') return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [c.messages, c.typing, c.phase])

  const submit = async (e) => {
    e?.preventDefault()
    const text = draft
    setDraft('')
    const ok = await c.send(text)
    if (!ok) setDraft(text)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const proceedToPay = async (amount) => {
    setRecharge(false)
    setProcessingAmount(amount)
    await c.topUp(amount)
    setProcessingAmount(0)
    setRechargeNeed(0)
  }

  /** The seeker approved how to go on after a package — per-minute or another package. */
  const continueChoice = async (choice) => {
    const result = await c.continueWith(choice)
    if (result?.recharge) openRecharge(result.recharge)
  }

  const openRecharge = (need = 0) => {
    setRechargeNeed(need)
    setRecharge(true)
  }

  const packageWarning =
    c.pkg?.phase === 'package' && c.packageSecondsLeft > 0 && c.packageSecondsLeft <= (c.pkg.warningSeconds ?? 30)
  const packageMeter = c.pkg?.phase === 'package' ? `${formatCountdown(c.packageSecondsLeft)} left` : null
  const continueQuotes = c.packageChoice
    ? resolveQuotes(c.packageChoice.packages, c.packageChoice.ratePerMinute ?? c.ratePerMinute, c.balance ?? c.packageChoice.balanceRemaining)
    : []

  const goToAppointments = () => navigate('/account/appointments')

  if (c.phase === 'loading') {
    return (
      <div className="chat-page chat-page--light">
        <p className="chat-page__notice">Loading your consultation…</p>
      </div>
    )
  }

  if (c.phase === 'error') {
    return (
      <div className="chat-page chat-page--light">
        <div className="consult-card chat-page__card">
          <h2 className="chat-page__card-title">Couldn't open this consultation</h2>
          <p className="chat-page__card-text">{c.error}</p>
          <Link to="/account/appointments" className="consult-btn consult-btn--primary">
            My consultations
          </Link>
        </div>
      </div>
    )
  }

  if (c.phase === 'requested') {
    return (
      <ConnectingScreen
        astrologer={astrologer}
        statusText={`Waiting for ${astrologer.name} to accept`}
        hintText={`Request sent · ${c.secondsLeft}s left · ${c.requestedPackage ? `${c.requestedPackage.minutes}-min package${c.requestedPackage.price != null ? ` · ${rupees(c.requestedPackage.price)}` : ''}` : `${rupees(c.ratePerMinute)}/min`}`}
        cancelLabel={c.busy === 'cancel' ? 'Cancelling…' : 'Cancel request'}
        onCancel={c.busy === 'cancel' ? undefined : c.cancel}
      />
    )
  }

  if (c.phase === 'closed') {
    const title = c.closeReason === 'cancelled' ? 'Request cancelled' : c.closeReason === 'missed' ? `${astrologer.name} didn't respond in time` : `${astrologer.name} couldn't take your request`
    return (
      <div className="chat-page chat-page--light">
        <div className="consult-card chat-page__card">
          <img className="chat-page__card-avatar" src={astrologer.avatar} alt="" />
          <h2 className="chat-page__card-title">{title}</h2>
          <p className="chat-page__card-text">{c.actionError || 'Nothing has been charged. Another astrologer may be free right now.'}</p>
          <Link to="/astrologers" className="consult-btn consult-btn--primary">
            Try another astrologer
          </Link>
        </div>
      </div>
    )
  }

  if (c.phase === 'ended') {
    const seconds = c.ended?.durationSeconds ?? 0
    const amount = c.ended?.amountCharged ?? 0
    const userMessages = c.messages.filter((m) => m.from !== 'system').length
    return (
      <div className="chat-page chat-page--light">
        <CompletedScreen
          astrologer={astrologer}
          message={endedMessage(c.ended, astrologer.name, 'chat')}
          duration={formatDuration(seconds)}
          charge={money(amount)}
          rows={[
            { label: 'Duration', value: formatDuration(seconds) },
            ...(userMessages ? [{ label: 'Messages', value: `${userMessages} messages` }] : []),
            { label: 'Total Charge', value: rupees(amount) },
            { label: 'Deducted From', value: 'Wallet' },
          ]}
          rateLabel="Rate & Review"
          backLabel="My consultations"
          onRate={c.rated ? undefined : () => setReview(true)}
          onBack={goToAppointments}
        />
        {review && !c.rated && (
          <ReviewModal
            astrologer={astrologer}
            busy={c.busy === 'rate'}
            onSubmit={async ({ rating, comment }) => {
              if (await c.rate(rating, comment)) goToAppointments()
            }}
            onSkip={goToAppointments}
          />
        )}
        {c.actionError && (
          <p className="chat-page__toast" role="alert" onClick={c.clearActionError}>
            {c.actionError}
          </p>
        )}
      </div>
    )
  }

  const composerLocked = c.paused || Boolean(c.packageChoice)
  const showLowBalanceModal = c.paused && !c.resuming && !c.packageChoice && !recharge && !processingAmount && !endConfirm
  const banner = c.astrologerAway
    ? { tone: 'warn', text: `${astrologer.name} is reconnecting… billing is paused.` }
    : c.resuming
      ? { tone: 'ok', text: 'Money added — resuming your session…' }
      : packageWarning
        ? { tone: 'warn', text: `Package ending in ${formatCountdown(c.packageSecondsLeft)} — you'll be asked how to continue.` }
      : c.lowBalance
        ? {
            tone: 'warn',
            text: c.lowBalance.secondsUntilCut != null
              ? `Low balance — about ${c.lowBalance.secondsUntilCut} sec left. Add money to keep chatting.`
              : `Low balance — about ${c.lowBalance.minutesRemaining ?? 1} min left. Add money to keep chatting.`,
            action: 'Add money',
          }
        : null

  return (
    <div className="chat-page chat-page--live">
      <header className="chat-page__bar">
        <div className="chat-page__avatar-wrap">
          <img className="chat-page__avatar" src={astrologer.avatar} alt={astrologer.name} />
          {!c.astrologerAway && <span className="chat-page__online-dot" />}
        </div>
        <div className="chat-page__who">
          <h2 className="chat-page__name">{astrologer.name}</h2>
          <p className="chat-page__status">
            <span className={`chat-page__status-dot${c.astrologerAway ? ' chat-page__status-dot--off' : ''}`} />
            <span className="chat-page__status-online">{c.astrologerAway ? 'Reconnecting' : c.typing ? 'Typing…' : c.paused ? 'Paused' : 'Online'}</span>
            {astrologer.specialty && <span className="chat-page__status-spec">· {astrologer.specialty}</span>}
          </p>
        </div>
        <div className="chat-page__tiles">
          <div className="chat-page__tile chat-page__tile--timer">
            <span className="chat-page__timer">{durationText}</span>
            <span className="chat-page__charge">
              ₹{chargeText} · {packageMeter ?? `${rupees(c.ratePerMinute)}/min`}
            </span>
          </div>
          <div className="chat-page__tile chat-page__tile--wallet">
            <span className="chat-page__wallet-label">Wallet</span>
            <span className="chat-page__wallet-amount">{balanceText}</span>
          </div>
          <button type="button" className="chat-page__end" onClick={() => setEndConfirm(true)} disabled={c.busy === 'end'}>
            <img className="chat-page__end-icon" src={endChatIcon} alt="" />
            End Chat
          </button>
        </div>
      </header>

      {banner && (
        <div className={`chat-page__banner chat-page__banner--${banner.tone}`} role="status">
          <span>{banner.text}</span>
          {banner.action && (
            <button type="button" className="chat-page__banner-btn" onClick={() => setRecharge(true)}>
              {banner.action}
            </button>
          )}
        </div>
      )}

      <div className="chat-page__messages" role="log" aria-live="polite">
        <div className="chat-page__thread">
          {c.messages.map((msg) => {
            if (msg.from === 'system') {
              return (
                <div key={msg.id} className="chat-page__msg chat-page__msg--system">
                  <span className="chat-page__system">{msg.text}</span>
                </div>
              )
            }
            if (msg.from === 'astrologer') {
              return (
                <div key={msg.id} className="chat-page__msg chat-page__msg--astro">
                  <img className="chat-page__msg-avatar" src={astrologer.avatar} alt="" />
                  <div className="chat-page__msg-body">
                    <div className="chat-page__bubble chat-page__bubble--astro">
                      <p className="chat-page__bubble-text">{msg.text}</p>
                    </div>
                    <span className="chat-page__msg-time">{msg.time}</span>
                  </div>
                </div>
              )
            }
            return (
              <div key={msg.id} className={`chat-page__msg chat-page__msg--user${msg.pending ? ' chat-page__msg--pending' : ''}`}>
                <div className="chat-page__msg-body">
                  <div className="chat-page__bubble chat-page__bubble--user">
                    <p className="chat-page__bubble-text">{msg.text}</p>
                  </div>
                  <span className="chat-page__msg-time">{msg.pending ? 'Sending…' : msg.time}</span>
                </div>
              </div>
            )
          })}
          {c.typing && (
            <div className="chat-page__msg chat-page__msg--astro">
              <img className="chat-page__msg-avatar" src={astrologer.avatar} alt="" />
              <div className="chat-page__msg-body">
                <div className="chat-page__bubble chat-page__bubble--astro chat-page__typing" aria-label={`${astrologer.name} is typing`}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form className="chat-page__composer" onSubmit={submit}>
        <div className="chat-page__composer-inner">
          <input
            className="chat-page__input"
            type="text"
            placeholder={composerLocked ? (c.packageChoice ? 'Session paused — choose how to continue' : 'Session paused — add money to continue') : 'Type your message…'}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              c.onDraftChange()
            }}
            onKeyDown={onKeyDown}
            disabled={composerLocked}
            aria-label="Message"
          />
          <button type="submit" className="chat-page__send" aria-label="Send message" disabled={composerLocked || !draft.trim()}>
            <img className="chat-page__send-icon" src={sendIcon} alt="" />
          </button>
        </div>
      </form>

      {c.actionError && (
        <p className="chat-page__toast" role="alert" onClick={c.clearActionError}>
          {c.actionError}
        </p>
      )}

      {showLowBalanceModal && (
        <LowBalanceModal
          balance={c.balance ?? 0}
          title="Session paused"
          message={`Your wallet can't cover the next minute (${rupees(c.ratePerMinute)}). Add money and the chat resumes right where you left off.`}
          rechargeLabel="Recharge Now"
          continueLabel="End Chat"
          onRecharge={() => setRecharge(true)}
          onContinue={() => setEndConfirm(true)}
        />
      )}
      {c.packageChoice && !recharge && !processingAmount && !endConfirm && (
        <ContinueConsultationModal
          channel="chat"
          ratePerMinute={c.packageChoice.ratePerMinute ?? c.ratePerMinute}
          quotes={continueQuotes}
          balance={c.balance ?? c.packageChoice.balanceRemaining}
          busy={c.busy === 'continue'}
          onContinue={continueChoice}
          onRecharge={openRecharge}
          onEnd={() => setEndConfirm(true)}
        />
      )}
      {recharge && (
        <RechargeModal
          balance={c.balance ?? 0}
          defaultAmount={Math.max(99, Math.ceil(Math.max(rechargeNeed, c.ratePerMinute * 5) / 50) * 50)}
          onClose={() => setRecharge(false)}
          onProceed={proceedToPay}
        />
      )}
      {processingAmount > 0 && <ProcessingModal amount={processingAmount} />}
      {endConfirm && (
        <EndConfirmModal
          duration={durationText}
          charge={chargeText}
          endLabel={c.busy === 'end' ? 'Ending…' : 'End Chat'}
          continueLabel="Continue Chat"
          icon={endChatModalIcon}
          onEnd={() => {
            setEndConfirm(false)
            c.end()
          }}
          onContinue={() => setEndConfirm(false)}
        />
      )}
    </div>
  )
}
