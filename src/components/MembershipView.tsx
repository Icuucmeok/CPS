import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Check, 
  X, 
  CreditCard, 
  Zap, 
  Lock, 
  Calendar, 
  AlertCircle,
  Coins,
  ChevronRight,
  Gift,
  Clock,
  Key,
  CheckCircle2,
  Copy,
  Plus
} from 'lucide-react';
import { UserProfile, UserTier, ActuatorCard, ActuatorPlanDuration } from '../types';
import { ACTUATOR_PLANS, format16DigitCard, cleanCardDigits } from '../utils/cardGenerator';

interface MembershipViewProps {
  user: UserProfile;
  activeVerifiedCount: number;
  actuatorCards?: ActuatorCard[];
  onUpgradeTier: (tier: UserTier, days?: ActuatorPlanDuration, cardUsed?: ActuatorCard) => void;
  onCancelSubscription: () => void;
}

export const MembershipView: React.FC<MembershipViewProps> = ({
  user,
  activeVerifiedCount,
  actuatorCards = [],
  onUpgradeTier,
  onCancelSubscription,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<ActuatorPlanDuration>(30);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [inputCardNumber, setInputCardNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Anti-Brute-Force Rate Limiting (Prevents automated card guessing)
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const isVerified = user.tier !== 'free';
  const currentPlan = ACTUATOR_PLANS[selectedDuration];
  const priceDisplay = `$${currentPlan.priceUsd.toFixed(2)}`;

  const isLockedOut = Boolean(lockoutUntil && Date.now() < lockoutUntil);
  const remainingLockoutMinutes = lockoutUntil ? Math.max(1, Math.ceil((lockoutUntil - Date.now()) / 60000)) : 0;

  // Active cards in system for testing/convenience
  const activeCards = useMemo(() => {
    return actuatorCards.filter((c) => c.status === 'active');
  }, [actuatorCards]);

  // Clean raw digits from input
  const rawDigits = cleanCardDigits(inputCardNumber);

  // Validate the entered card against actuatorCards
  const cardValidation = useMemo(() => {
    if (!rawDigits) {
      return { status: 'empty', message: '' };
    }
    if (rawDigits.length < 16) {
      return { status: 'incomplete', message: `Enter 16 digits (${rawDigits.length}/16)` };
    }

    const matched = actuatorCards.find((c) => c.cardNumber === rawDigits);
    if (!matched) {
      return { 
        status: 'invalid', 
        message: 'Card number not recognized' 
      };
    }

    if (matched.status === 'redeemed') {
      return { 
        status: 'redeemed', 
        message: `This card has already been redeemed on ${matched.redeemedAt?.slice(0, 10) || 'earlier'}.`,
        card: matched
      };
    }

    if (matched.status === 'revoked') {
      return { 
        status: 'revoked', 
        message: 'This card has been revoked.',
        card: matched
      };
    }

    return { 
      status: 'valid', 
      message: `Verified Card: ${matched.label} ($${matched.priceUsd.toFixed(2)} Value)`,
      card: matched
    };
  }, [rawDigits, actuatorCards]);

  // Handle user input changes
  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = format16DigitCard(e.target.value);
    setInputCardNumber(formatted);
    setErrorMessage(null);

    // If 16 digits match a card, auto-select its duration!
    const clean = cleanCardDigits(formatted);
    if (clean.length === 16) {
      const match = actuatorCards.find((c) => c.cardNumber === clean);
      if (match && match.status === 'active') {
        setSelectedDuration(match.days);
      }
    }
  };

  // Quick fill a demo card
  const handleSelectQuickCard = (card: ActuatorCard) => {
    setInputCardNumber(card.formattedCardNumber);
    setSelectedDuration(card.days);
    setErrorMessage(null);
  };

  const handleConfirmPayment = () => {
    if (isLockedOut) {
      setErrorMessage(`Too many invalid attempts. Card redemption locked for ${remainingLockoutMinutes} minute(s) to protect the network.`);
      return;
    }

    if (cardValidation.status !== 'valid' || !cardValidation.card) {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      
      if (nextFailed >= 5) {
        setLockoutUntil(Date.now() + 15 * 60 * 1000); // 15-minute security lockout
        setErrorMessage('Security Warning: 5 failed redemption attempts detected. Card entry locked for 15 minutes to protect against automated bots.');
      } else {
        setErrorMessage(
          cardValidation.status === 'incomplete'
            ? `Please enter the full 16-digit card number. (${5 - nextFailed} attempts remaining)`
            : `${cardValidation.message || 'Card number not recognized'}. (${5 - nextFailed} attempts remaining)`
        );
      }
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutSuccess(true);
      setFailedAttempts(0);
      setLockoutUntil(null);
      const targetTier: UserTier = selectedDuration === 360 ? 'verified_yearly' : 'verified_monthly';
      onUpgradeTier(targetTier, selectedDuration, cardValidation.card);

      setTimeout(() => {
        setCheckoutSuccess(false);
        setShowCheckoutModal(false);
        setInputCardNumber('');
      }, 1500);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Community Power Share (CPS) Collective Value Model</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
          Become an Actuator
        </h1>
        <p className="text-xs sm:text-sm max-w-2xl mx-auto" style={{ color: 'var(--theme-text-secondary)' }}>
          Only Actuators who activate node access for <strong className="text-sky-400">$1.70 (30 Days)</strong>, <strong className="text-sky-400">$10.20 (180 Days / 6 Mo)</strong>, or <strong className="text-sky-400">$20.40 (360 Days / 1 Yr)</strong> via 16-digit Treasury Card drive up the Community Power Share (CPS) price through active presence.
        </p>

        {/* Plan Duration Toggle (30 Days / 180 Days / 360 Days) */}
        <div className="inline-flex flex-wrap items-center p-1 rounded-2xl border mt-3 gap-1" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
          {[
            { days: 30 as const, price: '$1.70', label: '30 Days ($1.70)', tag: null },
            { days: 180 as const, price: '$10.20', label: '180 Days / 6 Mo ($10.20)', tag: '6 Mo' },
            { days: 360 as const, price: '$20.40', label: '360 Days / 1 Yr ($20.40)', tag: '1 Year' },
          ].map((plan) => {
            const isSelected = selectedDuration === plan.days;
            return (
              <button
                key={plan.days}
                type="button"
                onClick={() => setSelectedDuration(plan.days)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{plan.label}</span>
                {plan.tag && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${isSelected ? 'bg-slate-950 text-sky-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                    {plan.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subscription Status Card if user is active */}
      {isVerified && (
        <div
          className="rounded-2xl border p-4 sm:p-6 transition-all"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-emerald-400">
                    Active Actuator Node
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {user.actuatorPlanDays ? `${user.actuatorPlanDays} DAYS PLAN` : user.tier === 'verified_yearly' ? '360 DAYS (1 YEAR)' : '30 DAYS PLAN'}
                  </span>
                  {user.actuatorDaysRemaining && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {user.actuatorDaysRemaining} Days Active
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  Your online presence is actively powering the dynamic pricing engine.
                  {user.actuatorExpiryDate && (
                    <span className="ml-1 text-slate-300 font-medium">
                      Expires: {new Date(user.actuatorExpiryDate).toLocaleDateString()}
                    </span>
                  )}
                  {user.redeemedCardNumber && (
                    <span className="ml-1 font-mono text-[11px] text-sky-400">
                      (Card: {user.redeemedCardNumber})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputCardNumber('');
                  setShowCheckoutModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Extend with 16-Digit Card</span>
              </button>
              <button
                id="cancel-subscription-btn"
                onClick={onCancelSubscription}
                className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors"
              >
                Downgrade to Observer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Matrix: Observer vs Actuator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Tier 1: Observer */}
        <div
          className="rounded-2xl border p-6 flex flex-col justify-between transition-all"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg" style={{ color: 'var(--theme-text-primary)' }}>
                Observer
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400 font-mono">
                Observer
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-black font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                $0
              </span>
              <span className="text-xs ml-1" style={{ color: 'var(--theme-text-muted)' }}>
                forever free
              </span>
              <p className="text-xs mt-2" style={{ color: 'var(--theme-text-secondary)' }}>
                Observe the live market and view charts. You do not influence the price engine.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 text-xs mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>View live price ticker and real-time SVG charts</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hold and track Community Power Share (CPS) tokens in wallet</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Read public community member feed</span>
              </div>
              <div className="flex items-center gap-2.5 opacity-60">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <span>0% influence on dynamic pricing engine</span>
              </div>
              <div className="flex items-center gap-2.5 opacity-60">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <span>No Actuator badge</span>
              </div>
              <div className="flex items-center gap-2.5 opacity-60">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <span>No presence staking liquidity rewards</span>
              </div>
            </div>
          </div>

          <button
            disabled
            className="w-full py-2.5 rounded-xl border border-slate-700/50 text-slate-500 font-semibold text-xs text-center cursor-not-allowed"
          >
            {user.tier === 'free' ? 'Current Tier' : 'Downgrade available above'}
          </button>
        </div>

        {/* Tier 2: Actuator (Highlight) */}
        <div
          className="rounded-2xl border-2 p-6 flex flex-col justify-between transition-all relative shadow-2xl"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: '#38bdf8',
            boxShadow: '0 10px 30px -10px rgba(56, 189, 248, 0.2)',
          }}
        >
          {/* Top Pill */}
          <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-black text-[10px] uppercase tracking-wider shadow">
            PRICE ENGINE ACTIVE
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xl text-sky-400">
                  Actuator
                </h3>
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                Value Driver
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black font-mono text-white">
                  {priceDisplay}
                </span>
                <span className="text-xs text-sky-200">
                  / {currentPlan.label}
                </span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--theme-text-secondary)' }}>
                Your online presence directly elevates the dynamic price by +5% linearly for the entire ecosystem.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 text-xs mb-6" style={{ color: 'var(--theme-text-primary)' }}>
              <div className="flex items-center gap-2.5 font-semibold text-emerald-400">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>DYNAMIC PRICE DRIVER: Direct +5% base price scaling when active</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                <span>16-Digit Treasury Card activation (30, 180, or 360 Days)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Official Actuator badge in app & community feed</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Sub-second real-time WebSocket ticker stream priority</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Active Presence Liquidity Dividends & staking rewards</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Unlimited trade executions & portfolio tracking</span>
              </div>
            </div>
          </div>

          <button
            id="open-checkout-modal-btn"
            onClick={() => {
              setShowCheckoutModal(true);
              setErrorMessage(null);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isVerified ? 'Extend / Update Actuator Status' : `Upgrade Now for ${priceDisplay}`}</span>
          </button>
        </div>
      </div>

      {/* Explainer Box */}
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <h3 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
          <Sparkles className="w-4 h-4 text-amber-400" />
          The Mathematics of the Actuator 16-Digit Voucher Model
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <span className="font-bold block text-sm mb-1 text-sky-400">1. Verified Treasury Cards</span>
            Actuator cards are 16-digit cryptographic vouchers created by the Admin Treasury. Users activate access for 30 Days ($1.70), 180 Days ($10.20), or 360 Days ($20.40).
          </div>
          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <span className="font-bold block text-sm mb-1 text-emerald-400">2. Real Human Attention</span>
            When you open the Community Power Share app as an authenticated Actuator, your online presence elevates the real-time pricing engine for all network holders.
          </div>
          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <span className="font-bold block text-sm mb-1 text-indigo-400">3. Sybil & Bot Immunity</span>
            Requiring admin-validated credit card numbers completely eliminates free bot farms from gaming the live price formula.
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 16-DIGIT ACTUATOR CARD CHECKOUT MODAL                   */}
      {/* ======================================================== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div
            id="checkout-modal"
            className="w-full max-w-md rounded-3xl border p-6 shadow-2xl relative space-y-4"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                  Upgrade to Actuator
                </h3>
              </div>
              <button
                id="close-checkout-modal-btn"
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="text-center py-8 space-y-3 animate-in zoom-in-95">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Check className="w-9 h-9" />
                </div>
                <h4 className="text-lg font-bold text-emerald-400">
                  Actuator Activated!
                </h4>
                <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--theme-text-secondary)' }}>
                  Your 16-digit card was successfully redeemed for <strong className="text-white">{currentPlan.label}</strong>. Your online presence is actively powering the dynamic pricing engine!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Order Summary */}
                <div className="p-3.5 rounded-2xl border text-xs" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ color: 'var(--theme-text-secondary)' }}>Plan Selected:</span>
                    <span className="font-bold font-mono text-sky-400">
                      CPS Actuator ({currentPlan.label})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t mt-2" style={{ borderColor: 'var(--theme-border)' }}>
                    <span>Total Due Today:</span>
                    <span className="text-emerald-400 font-mono font-black text-base">{priceDisplay}</span>
                  </div>
                </div>

                {/* Duration / Payment Method Selector (3 Time Options as Requested) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold block" style={{ color: 'var(--theme-text-secondary)' }}>
                    Select Actuator Plan Duration:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { days: 30, price: '$1.70', label: '30 Days' },
                        { days: 180, price: '$10.20', label: '180 Days' },
                        { days: 360, price: '$20.40', label: '360 Days' },
                      ] as const
                    ).map((p) => {
                      const isSelected = selectedDuration === p.days;
                      return (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => {
                            setSelectedDuration(p.days);
                            setErrorMessage(null);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold ring-1 ring-sky-500 shadow-sm'
                              : 'border-slate-800 hover:border-slate-700 text-slate-400'
                          }`}
                          style={{ backgroundColor: isSelected ? undefined : 'var(--theme-bg)' }}
                        >
                          <Clock className="w-4 h-4 text-sky-400" />
                          <span className="font-bold">{p.label}</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-black">{p.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 16-Digit Actuator Card Number Input (Red Box Area in User's Screenshot) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                      <span>16-Digit Actuator Card Number:</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rawDigits.length}/16 Digits
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      maxLength={19} // 16 digits + 3 spaces
                      value={inputCardNumber}
                      onChange={handleCardInputChange}
                      placeholder="4532 •••• •••• 6789"
                      className="w-full px-3.5 py-3 rounded-xl border font-mono font-bold text-sm tracking-wider outline-none transition-all focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor:
                          cardValidation.status === 'valid'
                            ? '#10b981'
                            : cardValidation.status === 'invalid' || cardValidation.status === 'redeemed'
                            ? '#f43f5e'
                            : 'var(--theme-border)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                    {rawDigits.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputCardNumber('');
                          setErrorMessage(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Card Validation Feedback */}
                  {cardValidation.status === 'valid' && (
                    <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{cardValidation.message}</span>
                    </div>
                  )}

                  {cardValidation.status === 'redeemed' && (
                    <div className="p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-400 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cardValidation.message}</span>
                    </div>
                  )}

                  {cardValidation.status === 'invalid' && (
                    <div className="p-2.5 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cardValidation.message}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-2.5 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Quick Fill Available Treasury Cards: Strictly visible ONLY in Authorized Admin Session */}
                  {user.isAdmin && activeCards.length > 0 ? (
                    <div className="p-2.5 rounded-xl border bg-slate-900/50 border-slate-800 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <Key className="w-3 h-3 text-sky-400" />
                          <span>Admin Test Cards (Click to Test):</span>
                        </span>
                        <span className="text-[10px] text-sky-400 font-mono">{activeCards.length} ready</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeCards.slice(0, 3).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectQuickCard(c)}
                            className="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all hover:border-sky-400 hover:text-white flex items-center gap-1.5"
                            style={{
                              borderColor: 'var(--theme-border)',
                              backgroundColor: 'var(--theme-bg)',
                              color: 'var(--theme-text-secondary)',
                            }}
                          >
                            <span className="text-sky-400 font-bold">{c.days}d:</span>
                            <span>{c.formattedCardNumber.slice(0, 9)}...</span>
                            <span className="text-emerald-400 font-bold">${c.priceUsd.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/30 text-[11px] text-slate-400 flex items-center gap-2 mt-2">
                      <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>16-digit Actuator Cards are single-use cryptographic access keys issued by platform administrators.</span>
                    </div>
                  )}
                </div>

                {/* Instant Checkout Action Button */}
                <button
                  id="confirm-checkout-btn"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Validating 16-Digit Card & Activating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Activate Actuator Status ({priceDisplay})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
