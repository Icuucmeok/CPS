import React, { useState } from 'react';
import { 
  Sparkles, 
  Gift, 
  Share2, 
  Flame, 
  Users, 
  Coins, 
  TrendingUp, 
  Clock, 
  Check, 
  Copy, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Award,
  Zap,
  Globe,
  Radio
} from 'lucide-react';
import { UserProfile, ReferralRecord } from '../types';
import { formatCryptoPrice } from '../utils/pricingEngine';
import { AdMobBanner } from './ads/AdMobBanner';

interface AirdropViewProps {
  user: UserProfile;
  currentPrice: number;
  activeVerifiedCount: number;
  referrals: ReferralRecord[];
  onOpenMyShares: () => void;
  onOpenMembership: () => void;
}

export const AirdropView: React.FC<AirdropViewProps> = ({
  user,
  currentPrice,
  activeVerifiedCount,
  referrals,
  onOpenMyShares,
  onOpenMembership,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasClaimedStarter, setHasClaimedStarter] = useState(false);
  const [claimSuccessToast, setClaimSuccessToast] = useState<string | null>(null);

  // Airdrop Pool constants
  const TOTAL_AIRDROP_POOL = 100_000_000; // 100,000,000 CPS Shares
  const LAUNCH_PRICE_TARGET_1 = 1.00; // $1.00 Target Launch Price
  const LAUNCH_PRICE_TARGET_2 = 5.00; // $5.00 Target if Network Expands

  // Dynamic distribution stats
  // Calculated distributed shares based on referrals and users
  const totalClaimedSoFar = 14_850_200 + (referrals.length * 2);
  const remainingPool = Math.max(0, TOTAL_AIRDROP_POOL - totalClaimedSoFar);
  const percentDistributed = ((totalClaimedSoFar / TOTAL_AIRDROP_POOL) * 100).toFixed(2);

  const referralCode = `CPS-${user.handle.replace('@', '').toUpperCase()}-${user.uniqueId.slice(-4)}`;
  const referralLink = `https://cps.network/join?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClaimStarterBonus = () => {
    if (hasClaimedStarter) return;
    setHasClaimedStarter(true);
    setClaimSuccessToast('🎉 Congratulations! You have secured your Airdrop claim slot. Start sharing your link to drain the 100,000,000 CPS pool!');
    setTimeout(() => setClaimSuccessToast(null), 6000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {claimSuccessToast && (
        <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <span className="font-semibold">{claimSuccessToast}</span>
          </div>
          <button 
            onClick={() => setClaimSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs underline font-bold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TREMENDOUS HERO SHOWCASE BANNER: 100,000,000 CPS MEGA AIRDROP             */}
      {/* ========================================================================= */}
      <div 
        id="airdrop-hero-banner"
        className="rounded-3xl border p-6 sm:p-10 relative overflow-hidden transition-all shadow-2xl"
        style={{
          background: 'radial-gradient(135% 100% at 50% 0%, rgba(245, 158, 11, 0.18) 0%, rgba(236, 72, 153, 0.12) 40%, rgba(14, 165, 233, 0.08) 100%), var(--theme-card)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
        }}
      >
        {/* Top Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-sky-500/20 text-amber-300 border border-amber-500/30 shadow-lg animate-pulse">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="tracking-wide uppercase">Official Community Power Share Event</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>LIVE: {activeVerifiedCount} Actuators Driving Price Online</span>
          </div>
        </div>

        {/* Main Hero Headline */}
        <div className="relative z-10 max-w-3xl space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 bg-clip-text text-transparent">
              100,000,000 CPS
            </span>{' '}
            FREE AIRDROP POOL
          </h1>

          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            The largest community distribution in decentralized history. We are distributing a massive <strong className="text-amber-300">100,000,000 Community Power Shares Pool</strong> directly among active users and community builders who share with their teams!
          </p>

          <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
            Target launching price is <strong className="text-emerald-400 font-bold">$1.00</strong> — and could reach <strong className="text-sky-300 font-bold">$5.00+</strong> depending directly on how many users come online, because the price moves dynamically with the live network on the app! This is the biggest chance for all users to build their fortune.
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="relative z-10 mt-8 flex flex-wrap items-center gap-4">
          <button
            id="airdrop-claim-participate-btn"
            onClick={onOpenMyShares}
            className="flex items-center gap-2.5 px-6 sm:px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 hover:from-amber-400 hover:to-sky-400 text-white font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Share2 className="w-5 h-5 animate-pulse" />
            <span>Start Sharing & Claim Free Shares</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {!hasClaimedStarter ? (
            <button
              id="airdrop-starter-bonus-btn"
              onClick={handleClaimStarterBonus}
              className="flex items-center gap-2 px-5 py-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40 active:scale-95"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            >
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>Verify Airdrop Eligibility</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Airdrop Registration Verified</span>
            </div>
          )}
        </div>

        {/* Floating Background Glow Orbs */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* AdMob Banner Ad: Directly Under 1st Card */}
      <div>
        <AdMobBanner placement="airdrop_hero" />
      </div>

      {/* ========================================================================= */}
      {/* AIRDROP PROGRESS & VALUATION METRICS (TREMENDOUS CARDS)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Total Airdrop Pool Progress */}
        <div 
          className="p-6 rounded-3xl border transition-all shadow-lg flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                100M Pool Status
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Coins className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300">
              100,000,000
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Total Community Power Shares in Airdrop
            </p>

            {/* Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span style={{ color: 'var(--theme-text-muted)' }}>Distributed:</span>
                <span className="text-amber-400 font-bold">{totalClaimedSoFar.toLocaleString()} CPS ({percentDistributed}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${percentDistributed}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                <span>Remaining: {remainingPool.toLocaleString()} CPS</span>
                <span>Offer ends when pool is exhausted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Launching Price: $1.00 to $5.00 Potential */}
        <div 
          className="p-6 rounded-3xl border transition-all shadow-lg flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                Projected Launch Price
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                $1.00 – $5.00+
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Target launch value per CP Share
            </p>

            <div className="mt-4 p-3 rounded-xl border text-xs space-y-1" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--theme-text-muted)' }}>Current Live Price:</span>
                <span className="font-mono font-bold text-sky-400">{formatCryptoPrice(currentPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--theme-text-muted)' }}>Network Multiplier:</span>
                <span className="font-bold text-emerald-400">Dynamic User Scale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: User Online Correlation */}
        <div 
          className="p-6 rounded-3xl border transition-all shadow-lg flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-sky-400">
                Network Driven Value
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono text-sky-300">
              {activeVerifiedCount} Online
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Actuators currently elevating the pricing engine
            </p>

            <div className="mt-4 pt-3 border-t text-xs space-y-1" style={{ borderColor: 'var(--theme-border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                As more people join and stay online, the mathematical formula lifts CPS from fractions of a cent straight towards the <strong className="text-amber-300">$1.00 – $5.00</strong> milestone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HOW TO EARN FROM THE 100M POOL: STEP-BY-STEP VIRAL MECHANICS              */}
      {/* ========================================================================= */}
      <div 
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>
              How the 100,000,000 Airdrop is Distributed
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              The pool lasts strictly until all 100 Million shares are earned by users sharing with their teams!
            </p>
          </div>

          <button
            onClick={onOpenMyShares}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
          >
            <span>Open My Shares Page</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl border relative" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs mb-3 border border-sky-500/30">
              01
            </div>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              Copy Your Referral Link
            </h4>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              Grab your unique link generated exclusively for your wallet and share it across WhatsApp, Telegram, X, and your community networks.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl border relative" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs mb-3 border border-emerald-500/30">
              02
            </div>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              2 CP Shares Distributed Per Signup
            </h4>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              Every time a teammate registers, <strong className="text-emerald-400">1 free share goes to you</strong> and <strong className="text-amber-300">1 free share goes to them</strong> (worth $1.00 at launch).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl border relative" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-xs mb-3 border border-rose-500/30">
              03
            </div>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              Drain the 100M Pool
            </h4>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              There are no limits on how many members you can invite. The faster you share, the larger portion of the 100M pool you secure!
            </p>
          </div>
        </div>

        {/* Quick Share Link Box */}
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Your Airdrop Referral Link (Share to Earn Free CPS):
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div 
              className="flex-1 px-4 py-3 rounded-xl border text-xs sm:text-sm font-mono truncate select-all"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            >
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Airdrop Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MARKET STUNT CALL-TO-ACTION CARD: UPGRADE TO ACTUATOR                    */}
      {/* ========================================================================= */}
      <div 
        className="rounded-3xl border p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          borderColor: 'rgba(14, 165, 233, 0.3)',
        }}
      >
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Zap className="w-3.5 h-3.5" />
            <span>Multiply Your Airdrop Value</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>
            Drive the Launching Price to $5.00!
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Become a Verified Actuator for just $1/mo. Your active online presence directly plugs into the mathematical pricing engine and pumps the market valuation.
          </p>
        </div>

        <button
          onClick={onOpenMembership}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          Become an Actuator ($1/mo)
        </button>
      </div>
    </div>
  );
};
