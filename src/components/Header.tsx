import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Wallet, 
  Sun, 
  Moon, 
  Compass, 
  Users,
  Share2,
  Flame,
  Camera,
  CheckCircle2,
  Shield,
  Bell,
  Coins,
  Sparkles
} from 'lucide-react';
import { ThemeMode, UserProfile, AppNotification, PlatformConfig, ActiveTab } from '../types';
import { formatCryptoPrice } from '../utils/pricingEngine';
import { isAdminPortalSupported } from '../utils/platform';
import { NotificationsDropdown } from './NotificationsDropdown';

interface HeaderProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  user: UserProfile;
  currentPrice: number;
  activeVerifiedCount: number;
  referralCount?: number;
  notifications?: AppNotification[];
  platformConfig?: PlatformConfig;
  watchedRewardAdsCount?: number;
  isDailyActive?: boolean;
  onOpenRewardedVideo?: () => void;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenWallet: () => void;
  onOpenMembership: () => void;
  onOpenMyShares: () => void;
  onOpenAirdrop?: () => void;
  onOpenKycModal?: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  isAdminSession?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeChange,
  user,
  currentPrice,
  activeVerifiedCount,
  referralCount = 0,
  notifications = [],
  platformConfig,
  watchedRewardAdsCount = 0,
  isDailyActive = false,
  onOpenRewardedVideo,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onDeleteNotification,
  onNavigateTab,
  onOpenWallet,
  onOpenMembership,
  onOpenMyShares,
  onOpenAirdrop,
  onOpenKycModal,
  onOpenAdmin,
  onOpenSettings,
  isAdminSession = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const isVerified = user.tier !== 'free';
  const isKycPassed = user.kyc?.status === 'verified';

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasLiveAdminAnnouncement = Boolean(platformConfig?.globalAnnouncementActive && platformConfig?.globalAnnouncement);

  const cycleTheme = () => {
    if (theme === 'dark-blue') onThemeChange('white');
    else if (theme === 'white') onThemeChange('dark');
    else onThemeChange('dark-blue');
  };

  const getThemeIcon = () => {
    if (theme === 'dark-blue') {
      return <Compass className="w-4 h-4 text-sky-400" />;
    } else if (theme === 'white') {
      return <Sun className="w-4 h-4 text-amber-500" />;
    } else {
      return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getThemeLabel = () => {
    if (theme === 'dark-blue') return 'Navy';
    if (theme === 'white') return 'Light';
    return 'Dark';
  };

  return (
    <header 
      id="app-header"
      className="sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-200"
      style={{
        backgroundColor: 'var(--theme-header-bg)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-sky-500/20">
              CPS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  COMMUNITY POWER SHARE
                </span>
                <button
                  type="button"
                  id="header-reward-video-ad-btn"
                  onClick={onOpenRewardedVideo}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl border font-mono font-black text-[11px] transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/10"
                  title="Watch Video Ad (Increments Watch Counter & Verifies Daily Active)"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span className="hidden xs:inline">Ads Watched:</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-black">
                    {watchedRewardAdsCount}
                  </span>
                </button>
              </div>
              <p className="text-[10px] hidden md:block" style={{ color: 'var(--theme-text-muted)' }}>
                You Drive The Price • Dynamic Actuator Network
              </p>
            </div>
          </div>
        </div>

        {/* Live Metrics Quick Badges (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Active Verified Price Drivers */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
            style={{ 
              backgroundColor: 'var(--theme-card)', 
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)'
            }}
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">{activeVerifiedCount}</span>
            <span style={{ color: 'var(--theme-text-secondary)' }}>Actuators Online</span>
          </div>

          {/* Current Dynamic Price */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono"
            style={{ 
              backgroundColor: 'var(--theme-card)', 
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)'
            }}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span style={{ color: 'var(--theme-text-secondary)' }}>Price:</span>
            <span className="font-bold text-sky-400">{formatCryptoPrice(currentPrice)}</span>
          </div>
        </div>

        {/* Right Controls: Notification Bell, FREE AIR Drops Stunt, Theme, My Shares & Wallet */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* NOTIFICATION & ANNOUNCEMENT BELL (Replaces top animated KYC button as requested) */}
          <div className="relative">
            <button
              id="header-notifications-bell-btn"
              onClick={() => setShowNotifications((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all hover:scale-105 active:scale-95 shadow-md relative ${
                unreadCount > 0 || hasLiveAdminAnnouncement
                  ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-sky-500/20 border-amber-500/50 text-amber-300'
                  : 'border transition-colors hover:border-sky-500/50'
              }`}
              style={{
                backgroundColor: unreadCount > 0 || hasLiveAdminAnnouncement ? undefined : 'var(--theme-card)',
                borderColor: unreadCount > 0 || hasLiveAdminAnnouncement ? undefined : 'var(--theme-border)',
                color: unreadCount > 0 || hasLiveAdminAnnouncement ? undefined : 'var(--theme-text-primary)',
              }}
              title={
                hasLiveAdminAnnouncement
                  ? `Live Admin Announcement Active: ${platformConfig?.globalAnnouncement}`
                  : unreadCount > 0
                  ? `${unreadCount} unread announcements & notifications`
                  : 'Announcements & Notifications'
              }
            >
              <div className="relative flex items-center">
                <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 || hasLiveAdminAnnouncement ? 'text-amber-300 animate-bounce' : 'text-sky-400'}`} />
                {(unreadCount > 0 || hasLiveAdminAnnouncement) && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <span className="font-extrabold tracking-tight hidden xs:inline">
                Alerts
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-black font-mono shadow-sm">
                  {unreadCount}
                </span>
              )}
              {unreadCount === 0 && hasLiveAdminAnnouncement && (
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black font-mono shadow-sm">
                  ADMIN
                </span>
              )}
            </button>

            {/* Notifications and Announcements Popover Dropdown */}
            {showNotifications && (
              <NotificationsDropdown
                notifications={notifications}
                platformConfig={platformConfig || {
                  tradingFrozen: false,
                  maintenanceMode: false,
                  maintenanceMessage: '',
                  airdropFrozen: false,
                  enforceKycTrading: false,
                  enforceKycAirdrop: false,
                  chatMutedForObservers: false,
                  globalAnnouncement: '',
                  globalAnnouncementActive: false,
                  globalAnnouncementType: 'info',
                  tradingFeePercent: 0,
                  minTradeUsd: 1,
                  maxTradeUsd: 10000,
                  airdropTotalPool: 100000000,
                  airdropClaimed: 0,
                  referralSponsorReward: 1,
                  referralInviteeReward: 1,
                  fluctuationSpeedMs: 4000,
                  stepMultiplierUsd: 0.0000001,
                }}
                onMarkAsRead={(id) => onMarkNotificationAsRead?.(id)}
                onMarkAllAsRead={() => onMarkAllNotificationsAsRead?.()}
                onClearAll={() => onClearAllNotifications?.()}
                onDeleteNotification={(id) => onDeleteNotification?.(id)}
                onNavigateTab={(tab) => {
                  setShowNotifications(false);
                  onNavigateTab?.(tab);
                }}
                onOpenKycModal={() => {
                  setShowNotifications(false);
                  onOpenKycModal?.();
                }}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* FREE AIR Drops Header Stunt Button */}
          {onOpenAirdrop && (
            <button
              id="header-free-airdrop-btn"
              onClick={onOpenAirdrop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
              title="100,000,000 CPS Free Airdrop Pool!"
            >
              <Flame className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
              <span className="font-black tracking-tight">FREE AIRDROPS</span>
              <span className="hidden sm:inline-block text-[10px] bg-black/30 px-1.5 py-0.2 rounded font-mono">
                100M
              </span>
            </button>
          )}

          {/* Master Admin Control Room Button (Exclusively Available on Web Platform) */}
          {isAdminPortalSupported() && (user.isAdmin || isAdminSession) && onOpenAdmin && (
            <button
              id="header-admin-panel-btn"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-emerald-500/15 border border-sky-500/40 text-sky-300 hover:border-sky-400 hover:scale-105 active:scale-95 transition-all shadow-md shadow-sky-500/10"
              title="Master Admin Control Panel: Manage Pricing, Users, KYC, Airdrop & Emergency Killswitches"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-extrabold tracking-tight">Admin</span>
              <span className="text-[9px] bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded font-black font-mono">
                ROOT
              </span>
            </button>
          )}

          {/* Theme Quick Switcher */}
          <button
            id="theme-quick-toggle-btn"
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
            title={`Current: ${getThemeLabel()} Mode. Click to switch.`}
          >
            {getThemeIcon()}
            <span className="hidden sm:inline font-medium text-[11px]">
              {getThemeLabel()}
            </span>
          </button>

          {/* My Shares Referral Button */}
          <button
            id="header-my-shares-btn"
            onClick={onOpenMyShares}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 active:scale-95"
            title="My Shares: Referral link & 2-share reward program"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="font-bold">My Shares</span>
            {referralCount > 0 && (
              <span className="text-[10px] bg-sky-500/20 px-1 py-0.2 rounded font-mono font-bold text-sky-300">
                {referralCount}
              </span>
            )}
          </button>

          {/* User Tier Pill */}
          <button
            id="header-membership-badge"
            onClick={onOpenMembership}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isVerified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">
              {isVerified ? 'Actuator' : 'Observer'}
            </span>
            {!isVerified && (
              <span className="text-[10px] bg-amber-500/20 px-1 py-0.2 rounded font-mono">
                $1/mo
              </span>
            )}
          </button>

          {/* Quick Wallet Preview */}
          <button
            id="header-wallet-preview-btn"
            onClick={onOpenWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs hover:border-sky-500/50"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          >
            <Wallet className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold hidden sm:inline">
              {(user.sharexBalance / 1_000_000).toFixed(1)}M
            </span>
            <span className="text-[10px] font-mono text-sky-400">CPS</span>
          </button>

          {/* User Profile Avatar Quick Button */}
          {onOpenSettings && (
            <button
              id="header-user-profile-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border transition-all hover:border-sky-500/50 group"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
              }}
              title="Open Profile & Settings"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-md object-cover border border-sky-500/40"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-semibold hidden md:inline group-hover:text-sky-400 transition-colors" style={{ color: 'var(--theme-text-primary)' }}>
                {user.name.split(' ')[0]}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
