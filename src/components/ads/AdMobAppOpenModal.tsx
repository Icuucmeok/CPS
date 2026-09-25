import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';

interface AdMobAppOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdMobAppOpenModal: React.FC<AdMobAppOpenModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [canSkip, setCanSkip] = useState(false);

  // Dynamic admin config
  let adUnitId = 'ca-app-pub-3940256099942544/3419832817';
  let isAdEnabled = true;
  try {
    const saved = localStorage.getItem('cps_admob_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.enabled === false || parsed.appOpenAdEnabled === false) {
        isAdEnabled = false;
      }
      if (parsed.appOpenAdUnitId) {
        adUnitId = parsed.appOpenAdUnitId;
      }
    }
  } catch {
    // fallback
  }

  useEffect(() => {
    if (!isOpen || !isAdEnabled) return;
    setCountdown(3);
    setCanSkip(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isAdEnabled]);

  if (!isOpen || !isAdEnabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 text-white animate-in fade-in duration-300">
      {/* Top Bar: App Open Ad attribution & Skip button */}
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm">
            CPS
          </div>
          <div>
            <div className="text-xs font-black tracking-tight text-white">
              COMMUNITY POWER SHARE
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <span>App Open Ad • Google AdMob</span>
              <span className="text-[9px] text-sky-400 font-mono hidden sm:inline" title={adUnitId}>
                ({adUnitId.slice(0, 18)}...)
              </span>
            </div>
          </div>
        </div>

        <div>
          {canSkip ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/25 active:scale-95 cursor-pointer"
            >
              <span>Continue to App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400">
              Continue in {countdown}s
            </div>
          )}
        </div>
      </div>

      {/* Center Stage: High Impact Sponsor Display */}
      <div className="w-full max-w-xl mx-auto px-6 py-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Premier Ecosystem Launch Sponsor</span>
        </div>

        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 flex items-center justify-center text-white shadow-2xl shadow-sky-500/30">
          <div className="absolute inset-1 rounded-3xl bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
            <span className="font-mono text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-300">
              WEB3
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Next-Gen Multi-Chain Decentralized Trading
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Experience ultra-low latency execution and deep liquidity pools. Connect seamlessly with your CPS Web3 wallet.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm transition-all shadow-xl shadow-sky-500/25 active:scale-95"
          >
            Explore Ecosystem
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            Skip Ad
          </button>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Powered by AdMob App Open SDK</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          <span>Dismiss</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
