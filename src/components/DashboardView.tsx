import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  Zap, 
  Lock,
  Sparkles,
  BarChart3,
  Coins,
  Layers,
  Activity,
  Share2,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import { LivePriceTicker } from './LivePriceTicker';
import { ActuatorPresenceButton } from './ActuatorPresenceButton';
import { MarketStats, PriceTick, UserProfile } from '../types';
import { formatCryptoPrice } from '../utils/pricingEngine';
import { AdMobBanner } from './ads/AdMobBanner';

interface DashboardViewProps {
  user: UserProfile;
  marketStats: MarketStats;
  previousPrice: number;
  chartData: PriceTick[];
  activeVerifiedCount: number;
  freeOnlineCount: number;
  referralCount?: number;
  isTransmitting?: boolean;
  onToggleTransmitting?: (transmitting: boolean) => void;
  onOpenBuyModal: () => void;
  onOpenMembership: () => void;
  onOpenMyShares: () => void;
  onShowInterstitialAd?: () => void;
  onPriceAlertTriggered?: (targetPrice: number, currentPrice: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  marketStats,
  previousPrice,
  chartData,
  activeVerifiedCount,
  freeOnlineCount,
  referralCount = 0,
  isTransmitting = true,
  onToggleTransmitting = () => {},
  onOpenBuyModal,
  onOpenMembership,
  onOpenMyShares,
  onShowInterstitialAd,
  onPriceAlertTriggered,
}) => {
  const isVerified = user.tier !== 'free';

  // Target price alert state, lifted so it is visually plotted on the price chart and set from the small input field
  const [targetPriceAlert, setTargetPriceAlert] = useState<number | null>(0.0000035);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const referralCode = `CPS-${user.handle.replace('@', '').toUpperCase()}-${user.uniqueId.slice(-4)}`;
  const referralLink = `https://cps.network/join?ref=${referralCode}`;

  const handleQuickShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Community Power Share (CPS)',
          text: 'Join CPS network with my referral link to claim your 1 Free CP Share worth $1!',
          url: referralLink,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    navigator.clipboard?.writeText(referralLink);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top 2 Cards: Grid style on mobile and desktop as requested */}
      {/* Card 1: Share & Earn $1 | Card 2: Drive The Price */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* Card 1: Share & Earn $1 (You Earn 1 Share) */}
        <div 
          id="card-share-earn-you"
          className="rounded-2xl border p-3 sm:p-3.5 flex flex-col justify-between transition-all shadow-md hover:border-sky-400/50 h-full"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
            borderColor: 'rgba(14, 165, 233, 0.28)',
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                $1.00 Value
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-sky-200 font-mono tracking-tight leading-snug">
                Share & Earn $1
              </h4>
              <p className="text-[11px] text-slate-300 font-medium">
                You get <strong className="text-emerald-400 font-bold">1 Free Share</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5">
            <button
              id="dashboard-open-my-shares-btn"
              type="button"
              onClick={onOpenMyShares}
              className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1 font-mono"
              title="Open referral program and view your shares"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Open My Shares ({referralCount})</span>
            </button>
            <button
              id="dashboard-quick-copy-btn"
              type="button"
              onClick={handleQuickShare}
              className="p-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all hover:scale-105 active:scale-95 shrink-0"
              title="Copy referral link"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Card 2: Drive The Price (Actuator Presence 5-Min Circle Button & Session) */}
        <ActuatorPresenceButton
          user={user}
          isTransmitting={isTransmitting}
          onToggleTransmitting={onToggleTransmitting}
          onOpenMembership={onOpenMembership}
          activeVerifiedCount={activeVerifiedCount}
          onShowInterstitialAd={onShowInterstitialAd}
        />
      </div>
      {/* Observer Subscription Gate Banner (if user is an Observer) */}
      {!isVerified && (
        <div 
          id="observer-tier-gate-banner"
          className="rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-amber-300">
                You are currently an Observer
              </h4>
              <p className="text-xs text-amber-400/80">
                You drive the price when active! Become an Actuator ($1/mo) so your online presence actively drives up valuation.
              </p>
            </div>
          </div>
          <button
            id="gate-banner-upgrade-btn"
            onClick={onOpenMembership}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Become an Actuator ($1/mo)</span>
          </button>
        </div>
      )}

      {/* 1. Live Price Ticker Component & Real-Time Chart (Candle / Line) */}
      <LivePriceTicker
        currentPrice={marketStats.currentPrice}
        previousPrice={previousPrice}
        activeVerifiedCount={activeVerifiedCount}
        freeOnlineCount={freeOnlineCount}
        chartData={chartData}
        high24h={marketStats.high24h}
        low24h={marketStats.low24h}
        volume24h={marketStats.volume24h}
        priceChangePercent24h={marketStats.priceChangePercent24h}
        targetPriceAlert={targetPriceAlert}
        onTargetPriceChange={setTargetPriceAlert}
        onPriceAlertTriggered={onPriceAlertTriggered}
        onOpenTargetAlert={() => {
          const input = document.getElementById('chart-target-price-input');
          input?.focus();
        }}
      />

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Price (Driven by verified online fluctuating) */}
        <div
          id="metric-card-current-price"
          className="p-4 rounded-2xl border transition-all relative overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Current Price</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
            {formatCryptoPrice(marketStats.currentPrice)}
          </div>
          <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            Current price of the share will be fluctuating based on the Actuators offline or online ({activeVerifiedCount} online = {formatCryptoPrice(marketStats.currentPrice)}).
          </p>
        </div>

        {/* Metric 2: Market Capitalization */}
        <div
          id="metric-card-market-cap"
          className="p-4 rounded-2xl border transition-all"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Market Cap</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-sky-400">
            ${(marketStats.marketCap).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Dynamic valuation across 1B circulating community tokens
          </p>
        </div>

        {/* Metric 3: Circulating Supply (100,000,000 CPS with Down-Side Community Ownership) */}
        <div
          id="metric-card-circulating-supply"
          className="p-4 rounded-2xl border transition-all flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Circulating Supply</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-indigo-300">
              {(marketStats.circulatingSupply || 100_000_000).toLocaleString()} CPS
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              10% of Max Supply • Active Market Pool
            </p>
          </div>

          {/* Down Side: How much community/users own and ownership percentage */}
          <div className="mt-3 pt-2.5 border-t space-y-1.5" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium" style={{ color: 'var(--theme-text-muted)' }}>Community Owned:</span>
              <span className="font-mono font-bold text-emerald-400">
                {((marketStats.communityOwnedSupply ?? 71_300_000) / 1_000_000).toFixed(1)}M CPS
              </span>
            </div>

            {/* Ownership Progress Bar */}
            <div 
              className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden relative"
              title={`${(marketStats.communityOwnedPercent ?? 71.3).toFixed(1)}% of circulating supply owned by community users`}
            >
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, marketStats.communityOwnedPercent ?? 71.3))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--theme-text-secondary)' }}>
              <span className="font-semibold text-emerald-300 font-mono">
                {(marketStats.communityOwnedPercent ?? 71.3).toFixed(1)}% of Circulating
              </span>
              <span style={{ color: 'var(--theme-text-muted)' }}>
                {marketStats.totalVerifiedMembers + marketStats.totalFreeMembers} Users Holding
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Max Supply (1,000,000,000 CPS strictly hard capped) */}
        <div
          id="metric-card-max-supply"
          className="p-4 rounded-2xl border transition-all flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Max Supply</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-sky-300">
              {(marketStats.maxSupply || 1_000_000_000).toLocaleString()} CPS
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Strictly Hard Capped • Zero Inflation
            </p>
          </div>

          {/* Quick Holding & Spot Trade Shortcut */}
          <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="text-[11px]">
              <span style={{ color: 'var(--theme-text-muted)' }}>Holding: </span>
              <span className="font-mono font-bold text-sky-400">
                {(user.sharexBalance / 1_000_000).toFixed(1)}M CPS
              </span>
            </div>
            <button
              id="dashboard-quick-trade-btn"
              onClick={onOpenBuyModal}
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-[11px] transition-all shadow-sm flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Trade</span>
            </button>
          </div>
        </div>
      </div>

      {/* AdMob Banner Ad: Directly Under the Last Card */}
      <div className="pt-2">
        <AdMobBanner placement="dashboard_bottom" />
      </div>
    </div>
  );
};
