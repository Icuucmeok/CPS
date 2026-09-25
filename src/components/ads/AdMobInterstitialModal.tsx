import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface AdMobInterstitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: 'drive_price' | 'tab_transition';
}

export const AdMobInterstitialModal: React.FC<AdMobInterstitialModalProps> = ({
  isOpen,
  onClose,
  triggerReason = 'drive_price',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(3);
  const [canClose, setCanClose] = useState(false);

  // Dynamic admin config
  let adUnitId = 'ca-app-pub-3940256099942544/1033173712';
  let isAdEnabled = true;
  try {
    const saved = localStorage.getItem('cps_admob_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.enabled === false || parsed.interstitialAdsEnabled === false) {
        isAdEnabled = false;
      }
      if (parsed.interstitialAdUnitId) {
        adUnitId = parsed.interstitialAdUnitId;
      }
    }
  } catch {
    // fallback
  }

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(3);
      setCanClose(false);
      return;
    }

    if (!isAdEnabled) {
      // If interstitial ads disabled by admin, proceed immediately
      onClose();
      return;
    }

    setSecondsRemaining(3);
    setCanClose(false);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isAdEnabled, onClose]);

  if (!isOpen || !isAdEnabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl border border-sky-500/30 overflow-hidden shadow-2xl relative flex flex-col"
        style={{ backgroundColor: '#090e1a' }}
      >
        {/* Top AdMob Interstitial Header Bar */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Ad • AdMob
            </span>
            <span className="text-slate-400 font-mono text-[11px] cursor-help" title={`Active Unit ID: ${adUnitId}`}>
              {triggerReason === 'drive_price' ? 'Actuator Boost Sponsored' : 'Network Sponsor'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!canClose ? (
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                Close in {secondsRemaining}s
              </span>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                <span>Close</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sponsor Creative Hero Stage */}
        <div className="p-6 sm:p-8 space-y-5 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 flex items-center justify-center text-white mx-auto shadow-xl shadow-sky-500/20">
            <Zap className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Web3 Partner</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Hardware Security for Your Community Shares
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Store your decentralized CP tokens offline with military-grade certified EAL6+ secure chips. Zero internet exposure.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-2 text-left pt-2 max-w-sm mx-auto">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Cold Key Storage</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-[11px]">Instant Bluetooth Signing</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Visit Sponsor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs transition-colors"
              >
                Skip & Return to App
              </button>
            )}
          </div>
        </div>

        {/* Bottom Attribution Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <span>AdMob Interstitial Ad • 1 of 1</span>
          <span>Google Ad Placement</span>
        </div>
      </div>
    </div>
  );
};
