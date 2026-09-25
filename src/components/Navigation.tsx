import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Sparkles, 
  Share2,
  Wallet, 
  Settings, 
  Code2,
  Activity,
  Flame,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Sliders,
  FileCode,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { ActiveTab, UserTier, KycData } from '../types';
import { isAdminPortalSupported } from '../utils/platform';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  userTier: UserTier;
  activeVerifiedCount: number;
  referralCount?: number;
  kycData?: KycData;
  isAdmin?: boolean;
  onOpenKycModal: () => void;
  onOpenArchitectureDocs: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  userTier,
  activeVerifiedCount,
  referralCount = 0,
  kycData,
  isAdmin = false,
  onOpenKycModal,
  onOpenArchitectureDocs,
}) => {
  const isPlatformAdminAllowed = isAdminPortalSupported();
  const canShowAdmin = Boolean(isAdmin && isPlatformAdminAllowed);

  const [isMoreOpen, setIsMoreOpen] = useState(
    activeTab === 'membership' || activeTab === 'wallet' || activeTab === 'settings' || activeTab === 'kyc' || (canShowAdmin && activeTab === 'admin')
  );
  // Mobile bottom sheet / slide-over modal for "More" menu
  const [showMobileMoreSheet, setShowMobileMoreSheet] = useState(false);

  const isVerified = userTier !== 'free';
  const isKycPassed = kycData?.status === 'verified';

  // Core 4 items explicitly requested:
  // "in the navigation bar the button should be dashboard comunity FREE AIR Drops My Shares more button so the other will come in the more on the left side menu"
  const primaryNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: TrendingUp,
      badge: null,
      isSpecial: false,
    },
    {
      id: 'community' as ActiveTab,
      label: 'Community',
      icon: Users,
      badge: activeVerifiedCount > 0 ? `${activeVerifiedCount}` : null,
      isSpecial: false,
    },
    {
      id: 'airdrop' as ActiveTab,
      label: 'FREE AIR Drops',
      icon: Flame,
      badge: '100M POOL',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse',
      isSpecial: true,
    },
    {
      id: 'my_shares' as ActiveTab,
      label: 'My Shares',
      icon: Share2,
      badge: referralCount > 0 ? `${referralCount}` : '+1 Share',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      isSpecial: false,
    },
  ];

  // Secondary items nested inside the "More" expandable dropdown / sheet
  const moreNavItems = [
    {
      id: 'kyc' as ActiveTab,
      label: 'KYC Verification',
      description: 'WhatsApp, email, passport or driving license & face with camera',
      icon: ShieldCheck,
      badge: isKycPassed ? 'Verified' : 'Required',
      badgeColor: isKycPassed 
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse',
    },
    {
      id: 'membership' as ActiveTab,
      label: 'Membership & Actuator',
      description: 'Actuator status, $1/mo subscription, price driver multiplier',
      icon: Sparkles,
      badge: isVerified ? 'Active' : '$1/mo',
      badgeColor: isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'wallet' as ActiveTab,
      label: 'Wallet & Ledger',
      description: 'Total shares, USD cash balance, commission, transaction ledger',
      icon: Wallet,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings & Profile',
      description: 'Connected wallet address, theme mode, profile info',
      icon: Settings,
      badge: null,
      badgeColor: '',
    },
    ...(canShowAdmin ? [{
      id: 'admin' as ActiveTab,
      label: 'Master Admin Panel',
      description: 'Dynamic bonding curve, user balances, KYC verification, 100M airdrop, kill-switches',
      icon: Shield,
      badge: 'ROOT',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold',
    }] : []),
  ];

  const isMoreActive = moreNavItems.some((item) => item.id === activeTab);

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    setShowMobileMoreSheet(false);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile < md)       */}
      {/* ======================================================== */}
      <aside
        id="desktop-sidebar-nav"
        className="hidden md:flex flex-col w-64 shrink-0 border-r min-h-[calc(100vh-4rem)] p-4 transition-colors duration-200"
        style={{
          backgroundColor: 'var(--theme-bg)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="space-y-1.5">
          {/* Prominent KYC Verification Button Banner at Top of Sidebar */}
          <div className="mb-3">
            <button
              id="sidebar-quick-kyc-btn"
              onClick={onOpenKycModal}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                isKycPassed
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-sky-500/15 border-amber-500/40 hover:border-amber-500/70 shadow-md shadow-amber-500/10 animate-pulse'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl ${
                  isKycPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300 animate-bounce'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                      KYC Status
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isKycPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isKycPassed ? 'PASS' : 'REQUIRED'}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {isKycPassed ? 'Face & ID Verified' : 'Govt ID & Face Camera'}
                  </p>
                </div>
              </div>
              <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
            </button>
          </div>

          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            Core Navigation
          </p>

          {/* Primary Nav Items */}
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.isSpecial) {
              // Animated eye-catching "FREE AIR Drops" button
              return (
                <button
                  key={item.id}
                  id="sidebar-nav-airdrop"
                  onClick={() => onTabChange(item.id)}
                  className={`w-full relative overflow-hidden flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 group shadow-lg ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 text-white shadow-amber-500/25 scale-[1.02]'
                      : 'bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-sky-500/10 hover:from-amber-500/20 hover:to-sky-500/20 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  {/* Subtle moving shimmer highlight */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className={`p-1.5 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'}`}>
                      <Flame className="w-4 h-4 animate-bounce" />
                    </div>
                    <span className="tracking-tight font-black flex items-center gap-1">
                      <span className="text-amber-400 font-extrabold animate-pulse">FREE</span>
                      <span>AIR Drops</span>
                    </span>
                  </div>

                  <span className="relative z-10 text-[10px] px-2 py-0.5 rounded-full font-mono font-black tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                    100M
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'shadow-md shadow-sky-500/10'
                    : 'hover:bg-sky-500/5'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--theme-card-hover)' : 'transparent',
                  color: isActive ? 'var(--theme-accent)' : 'var(--theme-text-secondary)',
                  border: isActive ? '1px solid var(--theme-border)' : '1px solid transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      item.badgeColor || 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* MORE EXPANDABLE SECTION (Contains KYC, Membership, Wallet, Settings) */}
          <div className="pt-2">
            <button
              id="sidebar-nav-more-toggle"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${
                isMoreActive
                  ? 'text-sky-400 bg-sky-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-sky-500/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MoreHorizontal className="w-4 h-4 text-sky-400" />
                <span>More Pages</span>
              </div>
              {isMoreOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Sub-items inside More */}
            {isMoreOpen && (
              <div className="pl-3 mt-1 space-y-1 border-l-2 border-slate-800 ml-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-sky-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                            item.badgeColor || 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Pricing Engine Card in Sidebar */}
        <div
          className="mt-6 p-3.5 rounded-xl border relative overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Engine Status
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Circulating: <span className="font-mono font-semibold text-sky-400">100,000,000 CPS</span>
          </p>
          <div className="mt-2.5 pt-2.5 border-t text-[11px] flex justify-between items-center" style={{ borderColor: 'var(--theme-border)' }}>
            <span style={{ color: 'var(--theme-text-muted)' }}>Valuation:</span>
            <span className="font-semibold text-emerald-400">
              You Drive The Price!
            </span>
          </div>
          {!isVerified && (
            <div className="mt-2 text-[10px] text-amber-400/90 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
              ⚡ Observer tier: Your presence does not drive price. Become an Actuator for $1/mo.
            </div>
          )}
        </div>

        {/* Developer & Architecture Docs Trigger */}
        <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <button
            id="sidebar-architecture-btn"
            onClick={onOpenArchitectureDocs}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-sky-500/10"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            <Code2 className="w-4 h-4 text-sky-400" />
            <span>API & Database Architecture</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Sticky footer < md)        */}
      {/* ======================================================== */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg px-2 py-1.5 safe-area-bottom"
        style={{
          backgroundColor: 'var(--theme-bg)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="grid grid-cols-5 gap-1 items-center">
          {/* Dashboard */}
          <button
            id="mobile-nav-dashboard"
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'scale-105 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[9px] mt-1">Dashboard</span>
          </button>

          {/* Community */}
          <button
            id="mobile-nav-community"
            onClick={() => handleSelectTab('community')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
              activeTab === 'community' ? 'scale-105 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] mt-1">Community</span>
          </button>

          {/* FREE AIR Drops (Center Highlight) */}
          <button
            id="mobile-nav-airdrop"
            onClick={() => handleSelectTab('airdrop')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
              activeTab === 'airdrop'
                ? 'scale-110 bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black shadow-lg shadow-amber-500/30'
                : 'text-amber-400 bg-amber-500/10'
            }`}
          >
            <Flame className="w-4 h-4 animate-bounce text-amber-300" />
            <span className="text-[9px] font-black uppercase tracking-tight">Airdrop</span>
          </button>

          {/* My Shares */}
          <button
            id="mobile-nav-my-shares"
            onClick={() => handleSelectTab('my_shares')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
              activeTab === 'my_shares' ? 'scale-105 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[9px] mt-1">My Shares</span>
          </button>

          {/* More Menu Button (Opens full mobile menu popup/sheet) */}
          <button
            id="mobile-nav-more"
            onClick={() => setShowMobileMoreSheet(!showMobileMoreSheet)}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
              isMoreActive || showMobileMoreSheet
                ? 'scale-105 text-sky-400 font-bold bg-sky-500/15 border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="More pages (KYC, Membership, Wallet, Settings)"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[9px] mt-1 flex items-center gap-0.5">
              More
              <ChevronUp className={`w-2.5 h-2.5 transition-transform ${showMobileMoreSheet ? 'rotate-180' : ''}`} />
            </span>
            {(!isKycPassed || isMoreActive) && (
              <span className={`absolute top-1 right-2 w-1.5 h-1.5 rounded-full ${!isKycPassed ? 'bg-amber-400 animate-pulse' : 'bg-sky-400'}`} />
            )}
          </button>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* MOBILE "MORE" MENU DRAWER / BOTTOM SHEET                 */}
      {/* ======================================================== */}
      {showMobileMoreSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileMoreSheet(false)}
          />

          {/* Sheet Container */}
          <div
            id="mobile-more-pages-sheet"
            className="relative z-10 rounded-t-3xl border-t border-x p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                    More Pages & Tools
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Select an application module to navigate
                  </p>
                </div>
              </div>

              <button
                id="close-mobile-more-sheet"
                onClick={() => setShowMobileMoreSheet(false)}
                className="p-1.5 rounded-xl border hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Quick Verify Button in Mobile Sheet */}
            <button
              id="mobile-sheet-kyc-quick-action"
              onClick={() => {
                setShowMobileMoreSheet(false);
                onOpenKycModal();
              }}
              className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                isKycPassed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-sky-500/20 border-amber-500/40 text-amber-300 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-2">
                    <span>{isKycPassed ? 'KYC Verification (Passed)' : 'Verify KYC Now'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-black/40">
                      {isKycPassed ? 'Active' : 'Action Required'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    WhatsApp, Email, Govt ID & Live Face Camera
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 shrink-0" />
            </button>

            {/* List of More Pages */}
            <div className="space-y-2.5">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`mobile-sheet-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-sky-500/15 border-sky-500/40 shadow-lg shadow-sky-500/10'
                        : 'border hover:border-sky-500/30'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--theme-card-hover)' : 'var(--theme-bg)',
                      borderColor: isActive ? 'rgba(14, 165, 233, 0.4)' : 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl border ${
                        isActive 
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' 
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-500">
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Extra Tools: Architecture & Network Docs */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <button
                id="mobile-sheet-architecture-btn"
                onClick={() => {
                  setShowMobileMoreSheet(false);
                  onOpenArchitectureDocs();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-colors hover:bg-sky-500/10"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-secondary)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold">API & Database Architecture</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono">View Specs</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
