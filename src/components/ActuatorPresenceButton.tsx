import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Radio, Zap, Lock, Sparkles, Clock, AlertTriangle, X } from 'lucide-react';
import { UserProfile } from '../types';

interface ActuatorPresenceButtonProps {
  user: UserProfile;
  isTransmitting: boolean;
  onToggleTransmitting: (transmitting: boolean) => void;
  onOpenMembership: () => void;
  activeVerifiedCount?: number;
  onShowInterstitialAd?: () => void;
}

const BROADCAST_DURATION_SECONDS = 300; // 5 minutes

export const ActuatorPresenceButton: React.FC<ActuatorPresenceButtonProps> = ({
  user,
  isTransmitting,
  onToggleTransmitting,
  onOpenMembership,
  activeVerifiedCount,
  onShowInterstitialAd,
}) => {
  const isActuator = user.tier !== 'free';
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    try {
      const savedExp = localStorage.getItem('cps_actuator_presence_expires_at');
      if (savedExp) {
        const exp = parseInt(savedExp, 10);
        const diff = Math.ceil((exp - Date.now()) / 1000);
        if (diff > 0 && isActuator) {
          return diff;
        }
      }
    } catch {
      // fallback
    }
    return isTransmitting && isActuator ? BROADCAST_DURATION_SECONDS : 0;
  });

  const [showObserverModal, setShowObserverModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const cooldownRef = useRef<number | null>(null);

  // Cooldown countdown interval
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownRef.current = window.setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldownRemaining]);

  // Synchronize transmission state with secondsRemaining
  useEffect(() => {
    if (secondsRemaining > 0 && !isTransmitting && isActuator) {
      onToggleTransmitting(true);
    }
  }, [secondsRemaining, isTransmitting, isActuator, onToggleTransmitting]);

  // Main countdown timer interval
  useEffect(() => {
    if (isTransmitting && secondsRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // 5 minutes finished! Turn OFF to RED
            if (timerRef.current) clearInterval(timerRef.current);
            onToggleTransmitting(false);
            try {
              localStorage.removeItem('cps_actuator_presence_expires_at');
            } catch {
              // ignore
            }
            playPowerDownChime();
            setToastMessage('⚠️ 5-Minute Actuator session ended. Node is offline. Press button to go live again!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTransmitting, onToggleTransmitting]);

  // Clear toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const playActivateChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now);
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.18);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
      }
    } catch {
      // safe fallback
    }
  };

  const playPowerDownChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.25);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // safe fallback
    }
  };

  const handleButtonClick = () => {
    // Requirement 7: Interstitial ad shows each time anyone clicks Drive the price
    onShowInterstitialAd?.();

    if (!isActuator) {
      setShowObserverModal(true);
      return;
    }

    if (cooldownRemaining > 0) {
      setToastMessage(`⏳ Anti-Spam Security Cooldown: Please wait ${cooldownRemaining}s before toggling again.`);
      return;
    }

    // Set 15-second anti-bot / anti-spam cooldown on toggle
    setCooldownRemaining(15);

    if (isTransmitting && secondsRemaining > 0) {
      // 2nd press: Turn OFF immediately anytime
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsRemaining(0);
      onToggleTransmitting(false);
      try {
        localStorage.removeItem('cps_actuator_presence_expires_at');
      } catch {
        // ignore
      }
      playPowerDownChime();
      setToastMessage('🔴 Node Offline: Actuator presence turned off.');
    } else {
      // 1st press: Turn ON (lives up to 5 minutes, can be turned off anytime)
      const newExp = Date.now() + BROADCAST_DURATION_SECONDS * 1000;
      try {
        localStorage.setItem('cps_actuator_presence_expires_at', newExp.toString());
      } catch {
        // ignore
      }
      setSecondsRemaining(BROADCAST_DURATION_SECONDS);
      onToggleTransmitting(true);
      playActivateChime();
      setToastMessage('🟢 Node Online: Live for up to 5 min! Press again anytime to turn off.');
    }
  };

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLive = isTransmitting && secondsRemaining > 0;
  const progressPercent = ((BROADCAST_DURATION_SECONDS - secondsRemaining) / BROADCAST_DURATION_SECONDS) * 100;

  return (
    <div className="relative h-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-slate-900 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold shadow-2xl shadow-sky-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card: formatted to match Card 1 */}
      <div 
        id="card-drive-the-price"
        className="rounded-2xl border p-3 sm:p-3.5 flex flex-col justify-between transition-all shadow-md h-full relative overflow-hidden"
        style={{
          background: isLive 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(20, 184, 166, 0.08) 100%)' 
            : 'linear-gradient(135deg, rgba(225, 29, 72, 0.14) 0%, rgba(15, 23, 42, 0.4) 100%)',
          borderColor: isLive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.32)',
        }}
      >
        <div className="space-y-1">
          {/* Top row: Icon box + Status / Countdown badge */}
          <div className="flex items-center justify-between gap-1">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
              isLive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              <Zap className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
            </div>

            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border whitespace-nowrap flex items-center gap-1 ${
              isLive 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
              <span>{isLive ? `${formatTime(secondsRemaining)} LIVE` : 'OFFLINE'}</span>
            </span>
          </div>

          {/* Middle: Title & Subtitle + The Radiating Circle Button */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="min-w-0 flex-1">
              <h4 className={`font-extrabold text-xs sm:text-sm font-mono tracking-tight leading-snug truncate ${
                isLive ? 'text-emerald-200' : 'text-rose-200'
              }`}>
                Drive the price
              </h4>
              <p className="text-[11px] text-slate-300 font-medium truncate">
                {cooldownRemaining > 0 ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" />
                    Cooldown {cooldownRemaining}s
                  </span>
                ) : isLive ? (
                  <span className="text-emerald-300 font-semibold">Live (up to 5 min)</span>
                ) : (
                  <span>Press to turn on</span>
                )}
              </p>
            </div>

            {/* THE CIRCLE BUTTON WITH RADIATING WAVES ANIMATION */}
            <div className="relative flex items-center justify-center shrink-0 w-11 h-11 sm:w-12 sm:h-12">
              {/* Radiating rings when live */}
              {isLive && (
                <>
                  <span className="absolute w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-400/35 animate-wifi-wave-1 pointer-events-none" />
                  <span className="absolute w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-400/20 animate-wifi-wave-2 pointer-events-none" />
                </>
              )}
              {!isLive && (
                <span className="absolute inset-0 rounded-full border border-rose-500/40 animate-pulse pointer-events-none" />
              )}

              <button
                id="actuator-presence-circle-button"
                type="button"
                onClick={handleButtonClick}
                title={
                  !isActuator
                    ? 'Only Actuators can press this button to drive the price'
                    : cooldownRemaining > 0
                    ? `Anti-spam cooldown active: ${cooldownRemaining}s remaining`
                    : isLive
                    ? `Live (${formatTime(secondsRemaining)}) • Click to turn offline`
                    : 'Offline • Click to go live for up to 5 minutes'
                }
                className={`relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg cursor-pointer hover:scale-105 active:scale-95 select-none ${
                  cooldownRemaining > 0
                    ? 'bg-amber-600/80 text-amber-200 ring-2 ring-amber-400/50'
                    : isLive
                    ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-emerald-500/40 ring-2 ring-emerald-400/40'
                    : 'bg-gradient-to-tr from-rose-950 via-rose-900 to-red-600 text-rose-200 shadow-rose-900/50 ring-2 ring-rose-500/30 hover:ring-rose-500/50'
                }`}
              >
                {cooldownRemaining > 0 ? (
                  <Clock className="w-3.5 h-3.5 text-amber-200 animate-spin" />
                ) : isLive ? (
                  <Wifi className="w-4 h-4 text-white drop-shadow animate-pulse" />
                ) : !isActuator ? (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Radio className="w-4 h-4 text-rose-200 drop-shadow" />
                )}
                <span className="text-[7.5px] font-mono font-black uppercase tracking-tight leading-none mt-0.5">
                  {cooldownRemaining > 0 ? `${cooldownRemaining}s` : isLive ? 'LIVE' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Action Button with "Drive the price" */}
        <button
          id="actuator-presence-renew-btn"
          type="button"
          onClick={handleButtonClick}
          className={`mt-2.5 w-full py-1.5 px-2 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 font-mono ${
            cooldownRemaining > 0
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-wait'
              : isLive
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/25'
              : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-rose-600/25'
          }`}
          title={
            cooldownRemaining > 0
              ? `Anti-Spam Security Cooldown: ${cooldownRemaining}s`
              : isLive
              ? 'Live • Press to turn offline'
              : 'Offline • Press to turn online (up to 5 min)'
          }
        >
          {cooldownRemaining > 0 ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Cooling down ({cooldownRemaining}s)...</span>
            </>
          ) : isLive ? (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Drive the price (LIVE)</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5" />
              <span>Drive the price</span>
            </>
          )}
        </button>
      </div>

      {/* OBSERVER RESTRICTION MODAL */}
      {showObserverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4"
            style={{
              backgroundColor: '#0c1222',
              borderColor: 'rgba(245, 158, 11, 0.4)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowObserverModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-white font-mono flex items-center gap-2">
                <span>Actuator Status Required</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Actuators Only
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Only <strong className="text-amber-300 font-bold">Actuators</strong> can press this button to become online. Actuators are the verified nodes who actively drive the Community Power Share (CPS) dynamic price (+ $0.0000001 per online Actuator).
              </p>
              <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Observers have 0% weight and cannot transmit to drive price.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Actuator nodes broadcast for 5 minutes per button press!</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowObserverModal(false);
                  onOpenMembership();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs font-mono shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Become an Actuator ($1.7/mo or Card)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowObserverModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
