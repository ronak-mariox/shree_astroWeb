import { useState } from 'react'
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
import micIcon from '../../assets/pages/call/mic-icon.svg'
import micMutedIcon from '../../assets/pages/call/mic-muted-icon.svg'
import speakerIcon from '../../assets/pages/call/speaker-icon.svg'
import speakerMutedIcon from '../../assets/pages/call/speaker-muted-icon.svg'
import phoneOffIcon from '../../assets/pages/call/phone-off-icon.svg'
import kundliIcon from '../../assets/pages/call/kundli-icon.svg'
import notesIcon from '../../assets/pages/call/notes-icon.svg'
import chatIcon from '../../assets/pages/call/chat-icon.svg'
import { avatarFor, formatDuration, useConsultation } from '../Chat/useConsultation.js'
import './Call.css'

const money = (value) => (Number.isInteger(Number(value)) ? String(Number(value) || 0) : Number(value || 0).toFixed(2))

export default function Call() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const c = useConsultation(chatId, 'call')

  const [muted, setMuted] = useState(false)
  const [speakerOff, setSpeakerOff] = useState(false)
  const [recharge, setRecharge] = useState(false)
  /** The amount the recharge modal should suggest when opened from the continue choice. */
  const [rechargeNeed, setRechargeNeed] = useState(0)
  const [processingAmount, setProcessingAmount] = useState(0)
  const [endConfirm, setEndConfirm] = useState(false)
  const [review, setReview] = useState(false)

  const astrologer = c.astrologer || { name: 'Astrologer', avatar: avatarFor('A'), specialty: '' }
  const durationText = formatDuration(c.elapsed)
  const chargeText = money(c.charge)
  const balanceText = c.balance == null ? '—' : rupees(c.balance)

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

  const quickActions = [
    { key: 'kundli', label: 'Kundli', icon: kundliIcon, to: '/kundli' },
    { key: 'notes', label: 'Notes', icon: notesIcon },
    { key: 'chat', label: 'Chat', icon: chatIcon, to: `/chat/${chatId}` },
  ]

  if (c.phase === 'loading') {
    return (
      <div className="call-page call-page--light">
        <p className="call-page__notice">Loading your consultation…</p>
      </div>
    )
  }

  if (c.phase === 'error') {
    return (
      <div className="call-page call-page--light">
        <div className="consult-card call-page__card">
          <h2 className="call-page__card-title">Couldn't open this consultation</h2>
          <p className="call-page__card-text">{c.error}</p>
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
    const title = c.closeReason === 'cancelled' ? 'Request cancelled' : c.closeReason === 'missed' ? `${astrologer.name} didn't respond in time` : `${astrologer.name} couldn't take your call`
    return (
      <div className="call-page call-page--light">
        <div className="consult-card call-page__card">
          <img className="call-page__card-avatar" src={astrologer.avatar} alt="" />
          <h2 className="call-page__card-title">{title}</h2>
          <p className="call-page__card-text">{c.actionError || 'Nothing has been charged. Another astrologer may be free right now.'}</p>
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
    return (
      <div className="call-page call-page--light">
        <CompletedScreen
          astrologer={astrologer}
          message={`Your voice consultation with ${astrologer.name} has ended.`}
          duration={formatDuration(seconds)}
          charge={money(amount)}
          rows={[
            { label: 'Duration', value: formatDuration(seconds) },
            { label: 'Total Charge', value: rupees(amount) },
            { label: 'Deducted From', value: 'Wallet' },
          ]}
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
          <p className="call-page__toast" role="alert" onClick={c.clearActionError}>
            {c.actionError}
          </p>
        )}
      </div>
    )
  }

  const showLowBalanceModal = c.paused && !c.resuming && !c.packageChoice && !recharge && !processingAmount && !endConfirm
  const anyModal = showLowBalanceModal || Boolean(c.packageChoice) || recharge || processingAmount > 0 || endConfirm
  const status = c.astrologerAway ? 'RECONNECTING' : c.paused ? 'PAUSED' : 'LIVE CALL'
  const warning = c.astrologerAway
    ? `${astrologer.name} is reconnecting… billing is paused.`
    : c.resuming
      ? 'Money added — resuming your session…'
      : packageWarning
        ? `Package ending in ${formatCountdown(c.packageSecondsLeft)} — you'll be asked how to continue.`
      : c.lowBalance
        ? c.lowBalance.secondsUntilCut != null
          ? `Low balance — about ${c.lowBalance.secondsUntilCut} sec left.`
          : `Low balance — about ${c.lowBalance.minutesRemaining ?? 1} min left.`
        : ''

  return (
    <div className="call-page call-page--dark">
      <div className={`call-page__live${anyModal ? ' call-page__live--dimmed' : ''}`}>
        <div className="call-page__top">
          <div className="call-page__pill-row">
            <span className={`call-page__pill${status !== 'LIVE CALL' ? ' call-page__pill--warn' : ''}`}>
              <span className="call-page__pill-dot" />
              {status}
            </span>
          </div>
          <div className="call-page__avatar-frame">
            <img className="call-page__avatar" src={astrologer.avatar} alt={astrologer.name} />
          </div>
          <h2 className="call-page__name">{astrologer.name}</h2>
          {astrologer.specialty && <p className="call-page__specialty">{astrologer.specialty}</p>}
        </div>

        <div className="call-page__meter">
          <p className="call-page__timer">{durationText}</p>
          <p className="call-page__charge">
            Consultation charge: <strong>₹{chargeText}</strong>
          </p>
          <p className="call-page__wallet">
            Wallet: <span>{balanceText}</span> · {packageMeter ?? `${rupees(c.ratePerMinute)}/min`}
          </p>
          {warning ? (
            <p className="call-page__warning">
              {warning}
              {c.lowBalance && !c.resuming && !c.astrologerAway && (
                <button type="button" className="call-page__warning-btn" onClick={() => setRecharge(true)}>
                  Add money
                </button>
              )}
            </p>
          ) : (
            <p className="call-page__note">Call audio isn't available on the web yet — the timer and billing here are live.</p>
          )}
        </div>

        <div className="call-page__bottom">
          <div className="call-page__quick">
            {quickActions.map((action) =>
              action.to ? (
                <Link key={action.key} to={action.to} className="call-page__quick-btn">
                  <span className="call-page__quick-icon-box">
                    <img className="call-page__quick-icon" src={action.icon} alt="" />
                  </span>
                  <span className="call-page__quick-label">{action.label}</span>
                </Link>
              ) : (
                <button key={action.key} type="button" className="call-page__quick-btn" disabled title="Coming soon">
                  <span className="call-page__quick-icon-box">
                    <img className="call-page__quick-icon" src={action.icon} alt="" />
                  </span>
                  <span className="call-page__quick-label">{action.label}</span>
                </button>
              ),
            )}
          </div>
          <div className="call-page__controls">
            <button
              type="button"
              className={`call-page__ctrl${muted ? ' call-page__ctrl--active' : ''}`}
              onClick={() => setMuted((m) => !m)}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <img className="call-page__ctrl-icon" src={muted ? micMutedIcon : micIcon} alt="" />
            </button>
            <button
              type="button"
              className="call-page__end"
              onClick={() => setEndConfirm(true)}
              disabled={c.busy === 'end'}
              aria-label="End call"
            >
              <img className="call-page__end-icon" src={phoneOffIcon} alt="" />
            </button>
            <button
              type="button"
              className={`call-page__ctrl${speakerOff ? ' call-page__ctrl--active' : ''}`}
              onClick={() => setSpeakerOff((s) => !s)}
              aria-pressed={speakerOff}
              aria-label={speakerOff ? 'Turn speaker on' : 'Turn speaker off'}
            >
              <img className="call-page__ctrl-icon" src={speakerOff ? speakerMutedIcon : speakerIcon} alt="" />
            </button>
          </div>
        </div>
      </div>

      {c.actionError && (
        <p className="call-page__toast" role="alert" onClick={c.clearActionError}>
          {c.actionError}
        </p>
      )}

      {showLowBalanceModal && (
        <LowBalanceModal
          balance={c.balance ?? 0}
          title="Call paused"
          message={`Your wallet can't cover the next minute (${rupees(c.ratePerMinute)}). Add money and the call resumes right where you left off.`}
          rechargeLabel="Recharge Now"
          continueLabel="End Call"
          onRecharge={() => setRecharge(true)}
          onContinue={() => setEndConfirm(true)}
        />
      )}
      {c.packageChoice && !recharge && !processingAmount && !endConfirm && (
        <ContinueConsultationModal
          channel="call"
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
          endLabel={c.busy === 'end' ? 'Ending…' : 'End Call'}
          continueLabel="Continue Call"
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
