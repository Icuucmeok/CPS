import React, { useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';

interface AdMobBannerProps {
  placement: 'dashboard_bottom' | 'community_feed' | 'airdrop_hero' | 'my_shares_top' | 'wallet_balance';
  index?: number;
  className?: string;
}

interface BannerCreative {
  id: string;
  brand: string;
  headline: string;
  subline: string;
  cta: string;
  tag: string;
  accentColor: string;
  bgGradient: string;
}

const BANNER_CREATIVES: BannerCreative[] = [
  {
    id: 'ledger',
    brand: 'Ledger Nano X',
    headline: 'Secure Your Community Power Shares in Hardware Cold Storage',
    subline: 'Industry-leading certified secure element chip. Keep your crypto safe.',
    cta: 'Shop Now',
    tag: 'Hardware Wallet',
    accentColor: '#10b981',
    bgGradient: 'from-emerald-950/60 via-slate-900 to-slate-950',
  },
  {
    id: 'binance',
    brand: 'Binance Global',
    headline: 'Trade 350+ Crypto Pairs with 0% Maker Fees',
    subline: 'Join 180M+ global traders on the world\'s largest liquidity exchange.',
    cta: 'Claim $100 Voucher',
    tag: 'Crypto Exchange',
    accentColor: '#f59e0b',
    bgGradient: 'from-amber-950/60 via-slate-900 to-slate-950',
  },
  {
    id: 'google_cloud',
    brand: 'Google Cloud Web3',
    headline: 'Build Scalable Blockchain Nodes with High-Performance Cloud APIs',
    subline: 'Deploy RPC endpoints and real-time indexing infrastructure with 99.99% uptime.',
    cta: 'Get $300 Credits',
    tag: 'Cloud Infrastructure',
    accentColor: '#0ea5e9',
    bgGradient: 'from-sky-950/60 via-slate-900 to-slate-950',
  },
  {
    id: 'tradingview',
    brand: 'TradingView Pro',
    headline: 'Advanced Multi-Timeframe Charting & Real-Time Alerts',
    subline: 'Pinpoint momentum shifts with 100+ pre-built technical indicators.',
    cta: 'Start 30-Day Free Trial',
    tag: 'Market Analytics',
    accentColor: '#8b5cf6',
    bgGradient: 'from-purple-950/60 via-slate-900 to-slate-950',
  },
];

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  placement,
  index = 0,
  className = '',
}) => {
  const [creativeIndex, setCreativeIndex] = useState(() => (index % BANNER_CREATIVES.length));
  const creative = BANNER_CREATIVES[creativeIndex];

  // Check dynamic admin configuration
  let isBannerEnabled = true;
  let adUnitId = 'ca-app-pub-3940256099942544/6300978111';
  try {
    const saved = localStorage.getItem('cps_admob_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.enabled === false || parsed.bannerAdsEnabled === false) {
        isBannerEnabled = false;
      }
      if (parsed.bannerAdUnitId) {
        adUnitId = parsed.bannerAdUnitId;
      }
    }
  } catch {
    // fallback
  }

  if (!isBannerEnabled) {
    return null;
  }

  const handleAdClick = () => {
    // Cycle creative on click for interactive test experience
    setCreativeIndex((prev) => (prev + 1) % BANNER_CREATIVES.length);
  };

  return (
    <div
      className={`relative w-full rounded-2xl border overflow-hidden transition-all duration-300 shadow-md group ${className}`}
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'rgba(56, 189, 248, 0.25)',
      }}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${creative.bgGradient} opacity-80 pointer-events-none`} />

      <div className="relative z-10 px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: AdMob Badge & Info */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {/* AdMob Identity Pill */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Ad
            </span>
            <span 
              className="text-[8px] font-mono text-slate-500 mt-0.5 cursor-help" 
              title={`Active AdMob Unit ID: ${adUnitId}`}
            >
              AdMob
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-white truncate">
                {creative.brand}
              </span>
              <span 
                className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold border hidden xs:inline"
                style={{
                  color: creative.accentColor,
                  borderColor: `${creative.accentColor}40`,
                  backgroundColor: `${creative.accentColor}15`,
                }}
              >
                {creative.tag}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
              {creative.headline}
            </p>
            <p className="text-[11px] text-slate-400 truncate hidden md:block">
              {creative.subline}
            </p>
          </div>
        </div>

        {/* Right: CTA Button & Info Icon */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleAdClick}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-950 transition-all shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: creative.accentColor,
            }}
          >
            <span>{creative.cta}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <div
            title="Google AdMob Verified Banner Placement"
            className="text-slate-500 hover:text-slate-300 cursor-help p-1"
          >
            <Info className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
