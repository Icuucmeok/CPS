import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Sparkles, CheckCircle2, Award, Play, AlertCircle } from 'lucide-react';

interface AdMobRewardedVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  currentWatchedCount: number;
}

export const AdMobRewardedVideoModal: React.FC<AdMobRewardedVideoModalProps> = ({
  isOpen,
  onClose,
  onRewardEarned,
  currentWatchedCount,
}) => {
  const TOTAL_DURATION_SECONDS = 8;
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_DURATION_SECONDS);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  // Store callbacks in refs to eliminate re-triggering intervals when parent re-renders
  const onCloseRef = useRef(onClose);
  const onRewardEarnedRef = useRef(onRewardEarned);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onRewardEarnedRef.current = onRewardEarned;
  }, [onRewardEarned]);

  // Read dynamic admin config from localStorage
  let adUnitId = 'ca-app-pub-3940256099942544/5224354917';
  let isAdEnabled = true;
  try {
    const saved = localStorage.getItem('cps_admob_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.enabled === false || parsed.rewardedVideoAdEnabled === false) {
        isAdEnabled = false;
      }
      if (parsed.rewardedVideoAdUnitId) {
        adUnitId = parsed.rewardedVideoAdUnitId;
      }
    }
  } catch {
    // fallback
  }

  // Play subtle fanfare tone upon video completion
  const playRewardFanfare = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.36);
      });
    } catch {
      // ignore audio errors
    }
  };

  // Timer lifecycle: strictly runs ONLY based on isOpen transition
  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(TOTAL_DURATION_SECONDS);
      setIsCompleted(false);
      setShowExitWarning(false);
      return;
    }

    if (!isAdEnabled) {
      onCloseRef.current();
      return;
    }

    setSecondsRemaining(TOTAL_DURATION_SECONDS);
    setIsCompleted(false);
    setShowExitWarning(false);

    let remaining = TOTAL_DURATION_SECONDS;
    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        setSecondsRemaining(0);
        setIsCompleted(true);
        playRewardFanfare();
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isAdEnabled]);

  const handleAttemptClose = () => {
    if (isCompleted) {
      handleClaim();
    } else {
      setShowExitWarning(true);
    }
  };

  const handleClaim = () => {
    onRewardEarnedRef.current();
    onCloseRef.current();
  };

  if (!isOpen || !isAdEnabled) return null;

  const progressPercent = ((TOTAL_DURATION_SECONDS - secondsRemaining) / TOTAL_DURATION_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl border border-amber-500/40 overflow-hidden shadow-2xl relative flex flex-col"
        style={{ backgroundColor: '#090e1a' }}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span 
              className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-help" 
              title={`Active AdMob Unit ID: ${adUnitId}`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Rewarded Ad • AdMob
            </span>
            <span className="text-slate-400 font-mono text-[11px] hidden xs:inline">
              Watch to update Daily Active Counter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleAttemptClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Simulation Stage */}
        <div className="p-5 sm:p-7 relative overflow-hidden space-y-5">
          {!isCompleted ? (
            <div className="space-y-4">
              {/* Simulated Video Player Box */}
              <div className="relative aspect-video rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center overflow-hidden shadow-inner">
                {/* Dynamic animated glow rings */}
                <div className="absolute w-40 h-40 rounded-full bg-amber-500/10 animate-ping pointer-events-none" />
                <div className="absolute w-60 h-60 rounded-full bg-sky-500/10 blur-xl pointer-events-none" />

                {/* Center Icon & Partner Spotlight */}
                <div className="relative z-10 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-500/20">
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base">
                      Web3 Ecosystem Partner Spotlight
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      Verified decentralized network consensus & daily active user telemetry.
                    </p>
                  </div>
                </div>

                {/* In-Video Countdown Overlay Pill */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 font-mono text-[11px] font-bold text-amber-300 flex items-center gap-1.5 backdrop-blur-sm">
                  <span>Reward in</span>
                  <span className="text-white font-black">{secondsRemaining}s</span>
                </div>

                {/* Bottom Video Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                <span>Total ads watched: <strong className="text-amber-400">{currentWatchedCount}</strong></span>
                <span>Reward: <strong className="text-emerald-400">+1 to Ad Counter</strong></span>
              </div>
            </div>
          ) : (
            /* Completed State */
            <div className="py-4 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-sky-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/30 animate-bounce">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Full Video Watch Completed!</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  +1 Ad Watch Counter Added
                </h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Your daily active sign has been confirmed! Ad watch count recorded in the system.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300 flex items-center justify-around">
                <div>
                  <span className="block text-[10px] text-slate-400">Total Watched</span>
                  <span className="font-bold text-sm text-white">{currentWatchedCount + 1} Ads</span>
                </div>
                <div className="h-6 w-px bg-emerald-500/20" />
                <div>
                  <span className="block text-[10px] text-slate-400">Status</span>
                  <span className="font-bold text-sm text-emerald-400">Daily Active ✅</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClaim}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/25 active:scale-95 cursor-pointer"
              >
                Confirm & Close
              </button>
            </div>
          )}

          {/* Early Exit Warning Prompt */}
          {showExitWarning && !isCompleted && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Ad Not Finished Yet!</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                If you close now, your ad watch counter will not increment and Daily Active status won't be recorded. Wait just <strong>{secondsRemaining} more seconds</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                >
                  Keep Watching
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs transition-colors"
                >
                  Exit Without Credit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
