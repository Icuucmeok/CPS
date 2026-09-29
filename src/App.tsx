import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { CommunityView } from './components/CommunityView';
import { MembershipView } from './components/MembershipView';
import { MySharesView } from './components/MySharesView';
import { WalletView } from './components/WalletView';
import { SettingsView } from './components/SettingsView';
import { AirdropView } from './components/AirdropView';
import { ArchitectureModal } from './components/ArchitectureModal';
import { KycView } from './components/KycView';
import { KycVerificationModal } from './components/KycVerificationModal';
import { AdminPanelView } from './components/AdminPanelView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AccountDeletedSuccessModal } from './components/AccountDeletedSuccessModal';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { isNativeMobileApp, isAdminPortalSupported, getCurrentPlatform } from './utils/platform';
import { 
  AdMobAppOpenModal, 
  AdMobInterstitialModal, 
  AdMobRewardedVideoModal 
} from './components/ads';
import { 
  ThemeMode, 
  ActiveTab, 
  UserProfile, 
  CommunityMember, 
  Transaction, 
  PriceTick, 
  MarketStats, 
  ChatMessage, 
  UserTier,
  ReferralRecord,
  KycData,
  PlatformConfig,
  AdminAuditLog,
  AppNotification,
  ActuatorCard,
  ActuatorPlanDuration
} from './types';
import { 
  INITIAL_USER, 
  INITIAL_COMMUNITY_MEMBERS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_CHAT_MESSAGES, 
  INITIAL_REFERRALS,
  INITIAL_PLATFORM_CONFIG,
  INITIAL_AUDIT_LOGS,
  generateInitialChartData 
} from './data/mockData';
import { INITIAL_ACTUATOR_CARDS, ACTUATOR_PLANS } from './utils/cardGenerator';
import { 
  BASE_PRICE, 
  calculateDynamicPrice, 
  calculateMarketCap,
  formatCryptoPrice
} from './utils/pricingEngine';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_admin_01',
    type: 'admin_announcement',
    title: 'Platform Master Announcement',
    message: 'Welcome to CPS Network! Dynamic bonding curve pricing engine is live. Connect with actuators to drive valuation.',
    timestamp: '10m ago',
    isRead: false,
    priority: 'info',
    actionLabel: 'Open Chat',
    actionTab: 'community',
  },
  {
    id: 'notif_kyc_01',
    type: 'kyc',
    title: 'KYC Action Required',
    message: 'Upload Government ID (Passport / Driving License) & Face Camera selfie to unlock verified Actuator status.',
    timestamp: '25m ago',
    isRead: false,
    priority: 'warning',
    actionLabel: 'Verify Now',
    actionTab: 'kyc',
  },
  {
    id: 'notif_airdrop_01',
    type: 'reward',
    title: '100M CPS Airdrop Live',
    message: 'Airdrop pool claims are open! Claim your share of 100,000,000 CPS community distribution pool.',
    timestamp: '1h ago',
    isRead: false,
    priority: 'success',
    actionLabel: 'Claim Airdrop',
    actionTab: 'airdrop',
  },
  {
    id: 'notif_referral_01',
    type: 'reward',
    title: 'Referral Rewards Active',
    message: 'Earn 1 FREE CP Share worth $1 for every team member who registers with your unique link!',
    timestamp: '2h ago',
    isRead: true,
    priority: 'info',
    actionLabel: 'My Shares',
    actionTab: 'my_shares',
  },
  {
    id: 'notif_price_01',
    type: 'price',
    title: 'Bonding Curve Price Surge',
    message: 'Dynamic price surged as new online actuators validated transaction blocks.',
    timestamp: '3h ago',
    isRead: true,
    priority: 'info',
    actionLabel: 'View Dashboard',
    actionTab: 'dashboard',
  },
];

export default function App() {
  // Theme state: "dark-blue" is DEFAULT as explicitly requested ("little bit dark blue mode will be default")
  const [theme, setTheme] = useState<ThemeMode>('dark-blue');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Architecture modal state
  const [showArchModal, setShowArchModal] = useState(false);
  // KYC modal state
  const [showKycModal, setShowKycModal] = useState(false);
  // Admin authentication modal state
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);

  // Platform Detection & Environment Segregation (Web Platform vs Mobile App - Android APK/AAB / iOS)
  const [simulatedPlatform, setSimulatedPlatform] = useState<'web' | 'mobile'>(() => {
    return isNativeMobileApp() ? 'mobile' : 'web';
  });

  // Admin Portal is EXCLUSIVELY supported on Web; strictly disabled in Android APK/AAB & iOS builds
  const isAdminSupported = simulatedPlatform === 'web' && isAdminPortalSupported();

  const handleToggleSimulatedPlatform = useCallback(() => {
    setSimulatedPlatform((prev) => {
      const next = prev === 'web' ? 'mobile' : 'web';
      try {
        sessionStorage.setItem('cps_simulated_platform', next);
      } catch {
        // ignore
      }
      if (next === 'mobile') {
        setUser((u) => ({ ...u, isAdmin: false }));
        setActiveTab((curr) => (curr === 'admin' ? 'dashboard' : curr));
      }
      return next;
    });
  }, []);

  // Enforce platform compliance: redirect if on mobile and activeTab is admin
  useEffect(() => {
    if (!isAdminSupported && activeTab === 'admin') {
      setActiveTab('dashboard');
    }
  }, [isAdminSupported, activeTab]);

  // Anti-Bot & Anti-Cheat verification timestamps
  const rewardVideoOpenedTimeRef = useRef<number>(0);
  const lastRewardClaimTimeRef = useRef<number>(0);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const handleAdminAuthenticated = (success: boolean) => {
    if (success) {
      setUser((prev) => ({ ...prev, isAdmin: true }));
      setActiveTab('admin');
      const authNotif: AppNotification = {
        id: `notif_auth_${Date.now()}`,
        type: 'system',
        title: 'Master Admin Access Granted 🛡️',
        message: 'Super Admin passkey authenticated. Full platform control room unlocked.',
        timestamp: 'Just now',
        isRead: false,
        priority: 'success',
      };
      setNotifications((prev) => [authNotif, ...prev]);
    }
  };

  const handleExitAdminSession = () => {
    setUser((prev) => ({ ...prev, isAdmin: false }));
    setActiveTab('dashboard');
    try {
      if (
        window.location.hash.toLowerCase().includes('admin') ||
        window.location.search.toLowerCase().includes('admin')
      ) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }
    const exitNotif: AppNotification = {
      id: `notif_exit_${Date.now()}`,
      type: 'system',
      title: 'Admin Session Locked 🔒',
      message: 'Master administrator session closed. Session returned to standard observer/actuator mode.',
      timestamp: 'Just now',
      isRead: false,
      priority: 'info',
    };
    setNotifications((prev) => [exitNotif, ...prev]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Post-Account Deletion modal state
  const [deletedModalData, setDeletedModalData] = useState<{
    isOpen: boolean;
    deletedName: string;
    deletedHandle: string;
  }>({
    isOpen: false,
    deletedName: '',
    deletedHandle: '',
  });

  // =========================================================================
  // ADMOB AD STRATEGY MANAGEMENT
  // =========================================================================
  // 1. App Open Ad: on initial load (shown once per session)
  const [showAppOpenAd, setShowAppOpenAd] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('cps_app_open_ad_seen');
    } catch {
      return true;
    }
  });

  const handleCloseAppOpenAd = () => {
    setShowAppOpenAd(false);
    try {
      sessionStorage.setItem('cps_app_open_ad_seen', 'true');
    } catch {
      // ignore
    }
  };

  // 7 & 8. Interstitial Ad: drive the price button & page/tab transitions with 3-5min rate limit
  const [showInterstitialAd, setShowInterstitialAd] = useState<boolean>(false);
  const [interstitialTriggerReason, setInterstitialTriggerReason] = useState<'drive_price' | 'tab_transition'>('drive_price');
  const [pendingTabTransition, setPendingTabTransition] = useState<ActiveTab | null>(null);
  const lastTabTransitionAdTimeRef = useRef<number>(0);
  const TAB_AD_RATE_LIMIT_MS = 3 * 60 * 1000; // 3 minutes rate limit

  const handleCloseInterstitialAd = () => {
    setShowInterstitialAd(false);
    if (pendingTabTransition) {
      setActiveTab(pendingTabTransition);
      setPendingTabTransition(null);
    }
  };

  const handleTriggerDrivePriceInterstitial = () => {
    if (platformConfig.adMob && (!platformConfig.adMob.enabled || !platformConfig.adMob.interstitialAdsEnabled)) {
      return;
    }
    setPendingTabTransition(null);
    setInterstitialTriggerReason('drive_price');
    setShowInterstitialAd(true);
  };

  const handleTabChangeWithRateLimit = (targetTab: ActiveTab) => {
    if (targetTab === activeTab) return;

    // RBAC & Platform Security Check: Master Admin Panel is EXCLUSIVELY Web-only & requires verified passkey
    if (targetTab === 'admin') {
      if (!isAdminSupported) {
        setActiveTab('dashboard');
        return;
      }
      if (!user.isAdmin) {
        setShowAdminAuthModal(true);
        return;
      }
    }

    const isAdMobActive = platformConfig.adMob 
      ? (platformConfig.adMob.enabled && platformConfig.adMob.interstitialAdsEnabled) 
      : true;

    if (!isAdMobActive) {
      setActiveTab(targetTab);
      return;
    }

    const rateLimitMs = ((platformConfig.adMob?.interstitialRateLimitMinutes ?? 3)) * 60 * 1000;
    const now = Date.now();
    // Dynamic rate limit check for tab transition interstitial
    if (now - lastTabTransitionAdTimeRef.current >= rateLimitMs) {
      lastTabTransitionAdTimeRef.current = now;
      setPendingTabTransition(targetTab);
      setInterstitialTriggerReason('tab_transition');
      setShowInterstitialAd(true);
    } else {
      setActiveTab(targetTab);
    }
  };

  // User and community state
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [impersonatingAdmin, setImpersonatingAdmin] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>(INITIAL_COMMUNITY_MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [referrals, setReferrals] = useState<ReferralRecord[]>(INITIAL_REFERRALS);

  // =========================================================================
  // SECRET ADMIN WEBLINK GATE
  // Admin Panel is accessed exclusively via secret URL (e.g. ?admin=portal or /#admin)
  // Normal visitors and regular users will never see any admin buttons or indicators.
  // =========================================================================
  useEffect(() => {
    const checkAdminWebLink = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.toLowerCase();
        const hasAdminLink =
          urlParams.get('admin') === 'portal' ||
          urlParams.get('admin') === 'root' ||
          urlParams.get('admin') === 'true' ||
          hash === '#admin' ||
          hash === '#admin-portal';

        if (hasAdminLink && isAdminSupported) {
          if (!user.isAdmin) {
            setShowAdminAuthModal(true);
          } else {
            setActiveTab('admin');
          }
        }
      } catch {
        // ignore
      }
    };

    checkAdminWebLink();
    window.addEventListener('hashchange', checkAdminWebLink);
    window.addEventListener('popstate', checkAdminWebLink);
    return () => {
      window.removeEventListener('hashchange', checkAdminWebLink);
      window.removeEventListener('popstate', checkAdminWebLink);
    };
  }, [isAdminSupported, user.isAdmin]);

  // 9. Rewarded Video Ad: watch count, counter persistence, daily active status
  const [showRewardedVideoAd, setShowRewardedVideoAd] = useState<boolean>(false);
  const [watchedRewardAdsCount, setWatchedRewardAdsCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('cps_watched_reward_ads_count') || '4', 10);
    } catch {
      return 4;
    }
  });
  const [isDailyActive, setIsDailyActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cps_daily_active') === 'true';
    } catch {
      return false;
    }
  });

  const handleOpenRewardedVideoAd = useCallback(() => {
    rewardVideoOpenedTimeRef.current = Date.now();
    setShowRewardedVideoAd(true);
  }, []);

  const handleCloseRewardedVideoAd = useCallback(() => {
    setShowRewardedVideoAd(false);
  }, []);

  const handleRewardEarned = useCallback(() => {
    const now = Date.now();
    const elapsedSinceOpen = now - (rewardVideoOpenedTimeRef.current || 0);
    const elapsedSinceLastClaim = now - (lastRewardClaimTimeRef.current || 0);

    // Anti-Bot & Anti-Cheat Validation: Video must run full duration, prevent rapid API spamming
    if (elapsedSinceOpen < 7000 || elapsedSinceLastClaim < 12000) {
      const antiCheatNotif: AppNotification = {
        id: `notif_cheat_${Date.now()}`,
        type: 'system',
        title: 'Anti-Fraud Verification Warning ⚠️',
        message: 'Reward rejected: Video was completed abnormally fast or triggered repeatedly. Automated bot scripts are blocked.',
        timestamp: 'Just now',
        isRead: false,
        priority: 'warning',
      };
      setNotifications((prev) => [antiCheatNotif, ...prev]);
      return;
    }

    lastRewardClaimTimeRef.current = now;

    setWatchedRewardAdsCount((prevCount) => {
      const nextCount = prevCount + 1;
      try {
        localStorage.setItem('cps_watched_reward_ads_count', nextCount.toString());
        localStorage.setItem('cps_daily_active', 'true');
      } catch {
        // ignore
      }

      // Update logged-in user adsWatchedCount (no CPS tokens added to balance)
      setUser((prevUser) => ({
        ...prevUser,
        adsWatchedCount: nextCount,
      }));

      // Update members list so admin can see real-time ad counts
      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === user.id || m.uniqueId === user.uniqueId
            ? { ...m, adsWatchedCount: nextCount }
            : m
        )
      );

      const rewardNotif: AppNotification = {
        id: `notif_reward_${Date.now()}`,
        type: 'reward',
        title: 'Ad Watch Verified! 🪙',
        message: `Sponsored video ad watch confirmed via Server-Side Verification (SSV)! Counter increased to ${nextCount}.`,
        timestamp: 'Just now',
        isRead: false,
        priority: 'success',
      };
      setNotifications((prev) => [rewardNotif, ...prev]);

      return nextCount;
    });
    setIsDailyActive(true);
  }, [user.id, user.uniqueId]);

  // 16-Digit Actuator Cards system for 30d ($1.70), 180d ($10.20), 360d ($20.40) plans
  const [actuatorCards, setActuatorCards] = useState<ActuatorCard[]>(() => {
    try {
      const saved = localStorage.getItem('cps_actuator_cards');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ACTUATOR_CARDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cps_actuator_cards', JSON.stringify(actuatorCards));
    } catch {
      // ignore
    }
  }, [actuatorCards]);

  // Platform configuration and audit logging for Master Admin
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() => {
    try {
      const savedAdMob = localStorage.getItem('cps_admob_config');
      if (savedAdMob) {
        const parsed = JSON.parse(savedAdMob);
        return {
          ...INITIAL_PLATFORM_CONFIG,
          adMob: parsed,
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_PLATFORM_CONFIG;
  });
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(INITIAL_AUDIT_LOGS);

  // Presence simulation counts
  const [activeVerifiedCount, setActiveVerifiedCount] = useState<number>(14);
  const [freeOnlineCount, setFreeOnlineCount] = useState<number>(385);
  const [autoFluctuate, setAutoFluctuate] = useState<boolean>(true);

  // 5-minute Actuator presence state for the current logged-in user
  const [isUserTransmitting, setIsUserTransmitting] = useState<boolean>(() => {
    try {
      const savedExp = localStorage.getItem('cps_actuator_presence_expires_at');
      if (savedExp) {
        const exp = parseInt(savedExp, 10);
        return exp > Date.now();
      }
    } catch {
      // ignore
    }
    return true; // default active on login
  });

  const handleToggleUserTransmitting = (transmitting: boolean) => {
    setIsUserTransmitting((prev) => {
      if (prev !== transmitting) {
        setActiveVerifiedCount((curr) => {
          const updated = transmitting ? curr + 1 : Math.max(1, curr - 1);
          const newPrice = calculateDynamicPrice(updated, {
            stepMultiplier: platformConfig.stepMultiplierUsd,
          });
          setPreviousPrice(calculateDynamicPrice(curr, {
            stepMultiplier: platformConfig.stepMultiplierUsd,
          }));
          recordPriceTick(newPrice, updated);
          return updated;
        });
      }
      return transmitting;
    });
  };

  // Dynamic price state calculated via pricing engine respecting stepMultiplierUsd
  const currentPrice = useMemo(() => {
    return calculateDynamicPrice(activeVerifiedCount, {
      stepMultiplier: platformConfig.stepMultiplierUsd,
    });
  }, [activeVerifiedCount, platformConfig.stepMultiplierUsd]);

  const [previousPrice, setPreviousPrice] = useState<number>(currentPrice);
  const [chartData, setChartData] = useState<PriceTick[]>(() => 
    generateInitialChartData(activeVerifiedCount)
  );

  // High/Low and 24h stats
  const [high24h, setHigh24h] = useState<number>(() => currentPrice * 1.35);
  const [low24h, setLow24h] = useState<number>(() => Math.max(BASE_PRICE, currentPrice * 0.75));
  const [volume24h, setVolume24h] = useState<number>(842910);

  // Keep track of theme on root element for CSS custom variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Record a real-time price tick into the chart dataset
  const recordPriceTick = (price: number, verifiedCount: number) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setHigh24h((prev) => Math.max(prev, price));
    setLow24h((prev) => Math.min(prev, price));

    setChartData((prev) => {
      const updated = [
        ...prev.slice(-30), // keep recent 30 ticks
        {
          timestamp: Date.now(),
          timeLabel,
          price,
          verifiedOnlineCount: verifiedCount,
          volume: Math.floor(180000 + Math.random() * 320000),
        },
      ];
      return updated;
    });
  };

  // Automated live activity fluctuation (simulating realistic verified community members coming online / offline)
  useEffect(() => {
    if (!autoFluctuate || platformConfig.maintenanceMode) return;

    const interval = setInterval(() => {
      // 60% chance to fluctuate verified count by -1 or +1
      const change = Math.random() > 0.45 ? 1 : -1;
      setActiveVerifiedCount((prev) => {
        const next = Math.max(1, prev + change);
        const newPrice = calculateDynamicPrice(next, {
          stepMultiplier: platformConfig.stepMultiplierUsd,
        });
        setPreviousPrice(calculateDynamicPrice(prev, {
          stepMultiplier: platformConfig.stepMultiplierUsd,
        }));
        recordPriceTick(newPrice, next);
        return next;
      });

      // Also fluctuate Observers slightly (has 0 impact on price)
      setFreeOnlineCount((prev) => Math.max(50, prev + (Math.random() > 0.5 ? 2 : -2)));
    }, platformConfig.fluctuationSpeedMs || 4000);

    return () => clearInterval(interval);
  }, [autoFluctuate, platformConfig.maintenanceMode, platformConfig.fluctuationSpeedMs, platformConfig.stepMultiplierUsd]);

  // Recalculate price change percent
  const priceChangePercent24h = useMemo(() => {
    if (low24h === 0) return 0;
    return ((currentPrice - low24h) / low24h) * 100;
  }, [currentPrice, low24h]);

  // Community token ownership calculations (total tokens held by all community members and user)
  const communityOwnedSupply = useMemo(() => {
    const membersTokens = members.reduce((sum, m) => sum + (m.tokensHeld || 0), 0);
    return (user.sharexBalance || 0) + membersTokens;
  }, [members, user.sharexBalance]);

  const communityOwnedPercent = useMemo(() => {
    const circulating = 100_000_000;
    return (communityOwnedSupply / circulating) * 100;
  }, [communityOwnedSupply]);

  // Market stats aggregate
  const marketStats: MarketStats = useMemo(() => {
    const circulatingSupply = 100_000_000;
    const maxSupply = 1_000_000_000;

    return {
      circulatingSupply,
      maxSupply,
      currentPrice,
      priceChange24h: currentPrice - low24h,
      priceChangePercent24h,
      activeVerifiedOnline: activeVerifiedCount,
      totalVerifiedMembers: members.filter((m) => m.tier !== 'free').length + (user.tier !== 'free' ? 1 : 0),
      totalFreeMembers: members.filter((m) => m.tier === 'free').length + (user.tier === 'free' ? 1 : 0),
      totalSupply: maxSupply,
      marketCap: calculateMarketCap(currentPrice, circulatingSupply),
      high24h,
      low24h,
      volume24h,
      priceVelocityPerMinute: 0.05 * activeVerifiedCount,
      communityOwnedSupply,
      communityOwnedPercent,
    };
  }, [currentPrice, activeVerifiedCount, members, user.tier, high24h, low24h, volume24h, priceChangePercent24h, communityOwnedSupply, communityOwnedPercent]);

  // User actions: Toggle user online/offline
  const handleToggleUserOnline = () => {
    const nextOnline = !user.isOnline;
    setUser((prev) => ({ ...prev, isOnline: nextOnline }));

    // If user is verified, coming online/offline directly drives active verified count
    if (user.tier !== 'free') {
      setActiveVerifiedCount((prev) => {
        const next = nextOnline ? prev + 1 : Math.max(0, prev - 1);
        const newPrice = calculateDynamicPrice(next);
        setPreviousPrice(currentPrice);
        recordPriceTick(newPrice, next);
        return next;
      });
    }
  };

  // Subscription management with 16-Digit Actuator Cards
  const handleUpgradeTier = (
    tier: UserTier,
    days: ActuatorPlanDuration = 30,
    cardUsed?: ActuatorCard
  ) => {
    const wasFree = user.tier === 'free';
    const plan = ACTUATOR_PLANS[days] || ACTUATOR_PLANS[30];
    const subCost = plan.priceUsd;
    const daysMs = days * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(Date.now() + daysMs).toISOString();

    // Deduct cost and update user tier with actuator fields
    setUser((prev) => ({
      ...prev,
      tier,
      actuatorPlanDays: days,
      actuatorDaysRemaining: days,
      actuatorExpiryDate: expiryDate,
      redeemedCardNumber: cardUsed ? cardUsed.formattedCardNumber : prev.redeemedCardNumber,
      usdCashBalance: Math.max(0, prev.usdCashBalance - subCost),
      subscriptionStartedAt: new Date().toISOString(),
      subscriptionRenewsAt: expiryDate,
    }));

    // If a card was redeemed, mark it in actuatorCards state
    if (cardUsed) {
      setActuatorCards((prev) =>
        prev.map((c) =>
          c.id === cardUsed.id || c.cardNumber === cardUsed.cardNumber
            ? {
                ...c,
                status: 'redeemed' as const,
                redeemedByUserId: user.id,
                redeemedByName: `${user.name} (${user.handle})`,
                redeemedAt: new Date().toISOString(),
              }
            : c
        )
      );
    }

    // If user was free, they become an active actuator if currently online!
    if (wasFree && user.isOnline) {
      setActiveVerifiedCount((prev) => {
        const updated = prev + 1;
        setPreviousPrice(currentPrice);
        recordPriceTick(calculateDynamicPrice(updated), updated);
        return updated;
      });
    }

    // Add subscription transaction
    const subTx: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'subscription',
      tokenAmount: 0,
      tokenPrice: currentPrice,
      usdTotal: subCost,
      timestamp: new Date().toISOString(),
      status: 'completed',
      txHash: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)}`,
      note: `Actuator Card Activation: ${days} Days ($${subCost.toFixed(2)})${cardUsed ? ` via Card ${cardUsed.formattedCardNumber}` : ''}`,
    };
    setTransactions((prev) => [subTx, ...prev]);

    // Add celebration chat message
    const botMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      memberId: user.id,
      senderName: user.name,
      senderHandle: user.handle,
      senderAvatar: user.avatar,
      senderTier: tier,
      isOnline: true,
      message: `🎉 Just activated ${days}-Day Actuator Node Status ($${subCost.toFixed(2)}) via 16-Digit Treasury Card! My presence is now actively scaling the Community Power Share (CPS) dynamic price engine!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPriceDriver: true,
    };
    setChatMessages((prev) => [botMsg, ...prev]);

    handleAddAuditLog(
      'Actuator Card Redeemed',
      'system',
      `${user.name} (${user.handle}) redeemed 16-digit card for ${days} Days ($${subCost.toFixed(2)} USD). Node status active.`
    );
  };

  // Direct card activation from Admin panel
  const handleDirectActivateCard = (card: ActuatorCard, targetUserId: string) => {
    const days = card.days;
    const plan = ACTUATOR_PLANS[days] || ACTUATOR_PLANS[30];

    if (targetUserId === 'me') {
      handleUpgradeTier(days === 360 ? 'verified_yearly' : 'verified_monthly', days, card);
      return;
    }

    const targetMember = members.find((m) => m.id === targetUserId);
    if (!targetMember) return;

    // Update target member in members list
    setMembers((prev) =>
      prev.map((m) =>
        m.id === targetUserId
          ? {
              ...m,
              tier: days === 360 ? 'verified_yearly' : 'verified_monthly',
              influenceMultiplier: 1.05,
            }
          : m
      )
    );

    // Mark card as redeemed
    setActuatorCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              status: 'redeemed' as const,
              redeemedByUserId: targetMember.id,
              redeemedByName: `${targetMember.name} (${targetMember.handle})`,
              redeemedAt: new Date().toISOString(),
            }
          : c
      )
    );

    // If target was online and previously free, increase active verified count
    if (targetMember.isOnline && targetMember.tier === 'free') {
      setActiveVerifiedCount((prev) => {
        const next = prev + 1;
        setPreviousPrice(currentPrice);
        recordPriceTick(calculateDynamicPrice(next), next);
        return next;
      });
    }

    handleAddAuditLog(
      'Direct Card Activation',
      'system',
      `Admin directly activated Card ${card.formattedCardNumber} (${days} Days - $${card.priceUsd.toFixed(2)}) for ${targetMember.name} (${targetMember.handle}).`
    );
  };

  const handleCancelSubscription = () => {
    const wasVerified = user.tier !== 'free';
    setUser((prev) => ({ ...prev, tier: 'free' }));

    // If user was online and verified, removing verified status removes their price weight
    if (wasVerified && user.isOnline) {
      setActiveVerifiedCount((prev) => {
        const updated = Math.max(0, prev - 1);
        setPreviousPrice(currentPrice);
        recordPriceTick(calculateDynamicPrice(updated), updated);
        return updated;
      });
    }
  };

  const handleToggleUserTier = () => {
    if (user.tier === 'free') {
      handleUpgradeTier('verified_monthly');
    } else {
      handleCancelSubscription();
    }
  };

  // Trade Execution simulation (Buy or Sell CPS tokens)
  const handleExecuteTrade = (type: 'buy' | 'sell', tokenAmount: number, usdTotal: number) => {
    if (type === 'buy') {
      setUser((prev) => ({
        ...prev,
        sharexBalance: prev.sharexBalance + tokenAmount,
        usdCashBalance: Number((prev.usdCashBalance - usdTotal).toFixed(2)),
      }));
    } else {
      setUser((prev) => ({
        ...prev,
        sharexBalance: Math.max(0, prev.sharexBalance - tokenAmount),
        usdCashBalance: Number((prev.usdCashBalance + usdTotal).toFixed(2)),
      }));
    }

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type,
      tokenAmount,
      tokenPrice: currentPrice,
      usdTotal,
      timestamp: new Date().toISOString(),
      status: 'completed',
      txHash: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)}`,
      note: `Spot ${type.toUpperCase()} @ ${currentPrice.toFixed(9)} USD`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    setVolume24h((prev) => prev + usdTotal);
  };

  // Chat message sending - Only Actuators can message
  const handleSendMessage = (text: string) => {
    if (user.tier === 'free') {
      const lockNotif: AppNotification = {
        id: `notif_gate_${Date.now()}`,
        type: 'system',
        title: 'Transmission Restricted',
        message: 'Only verified Actuators can transmit messages. Observers have read-only access to messages and network fees.',
        timestamp: 'Just now',
        isRead: false,
        priority: 'warning',
        actionLabel: 'Become an Actuator',
        actionTab: 'membership',
      };
      setNotifications((prev) => [lockNotif, ...prev]);
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      memberId: user.id,
      senderName: user.name,
      senderHandle: user.handle,
      senderAvatar: user.avatar,
      senderTier: user.tier,
      isOnline: user.isOnline,
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPriceDriver: true,
      feeDisplay: '0 CPS (Actuator Node)',
    };
    setChatMessages((prev) => [newMsg, ...prev]);
  };

  // Update profile
  const handleUpdateUserProfile = (name: string, handle: string) => {
    setUser((prev) => ({ ...prev, name, handle }));
  };

  // Save KYC Data
  const handleSaveKyc = (kyc: KycData) => {
    setUser((prev) => ({
      ...prev,
      kyc,
      location: kyc.country || prev.location,
      countryCode: kyc.countryCode || prev.countryCode,
    }));

    // Add celebration chat message for verified user
    const botMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      memberId: user.id,
      senderName: user.name,
      senderHandle: user.handle,
      senderAvatar: user.avatar,
      senderTier: user.tier,
      isOnline: true,
      message: `🛡️ Completed official KYC Verification! WhatsApp, Email, Government ${kyc.docType.toUpperCase()} & Live Face Camera authenticated.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPriceDriver: true,
    };
    setChatMessages((prev) => [botMsg, ...prev]);

    // Push notification to bell
    const kycNotif: AppNotification = {
      id: `notif_kyc_${Date.now()}`,
      type: 'kyc',
      title: 'KYC Verified Successfully',
      message: 'Your biometric face verification and identity documentation have been approved.',
      timestamp: 'Just now',
      isRead: false,
      priority: 'success',
      actionLabel: 'View KYC',
      actionTab: 'kyc',
    };
    setNotifications((prev) => [kycNotif, ...prev]);
  };

  const handleResetKyc = () => {
    setUser((prev) => ({
      ...prev,
      kyc: {
        status: 'unverified',
        whatsapp: '',
        email: prev.kyc?.email || 'alex.rivera@cps.network',
        docType: 'passport',
        docNumber: '',
      },
    }));
    setShowKycModal(true);
  };

  // Admin Audit Log logger
  const handleAddAuditLog = (action: string, category: AdminAuditLog['category'], details: string) => {
    const newLog: AdminAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      category,
      details,
      timestamp: new Date().toISOString(),
      adminHandle: user.handle,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Admin Broadcast Message to Community Chat
  const handleBroadcastAdminMessage = (text: string) => {
    const adminMsg: ChatMessage = {
      id: `msg_admin_${Date.now()}`,
      memberId: user.id,
      senderName: `${user.name} [ADMIN]`,
      senderHandle: user.handle,
      senderAvatar: user.avatar,
      senderTier: user.tier,
      isOnline: true,
      message: `📢 [OFFICIAL BROADCAST]: ${text}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPriceDriver: true,
      isAdmin: true,
    };
    setChatMessages((prev) => [adminMsg, ...prev]);
    handleAddAuditLog('Official Chat Broadcast', 'chat', `Broadcasted: "${text.slice(0, 45)}..."`);

    // Push high-priority announcement to notification bell
    const adminNotif: AppNotification = {
      id: `notif_broadcast_${Date.now()}`,
      type: 'admin_announcement',
      title: 'Official Admin Broadcast',
      message: text,
      timestamp: 'Just now',
      isRead: false,
      priority: 'warning',
      actionLabel: 'Open Chat',
      actionTab: 'community',
    };
    setNotifications((prev) => [adminNotif, ...prev]);
  };

  // Factory Reset / Demo reset of entire platform state
  const handleResetPlatformState = () => {
    setUser(INITIAL_USER);
    setMembers(INITIAL_COMMUNITY_MEMBERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setReferrals(INITIAL_REFERRALS);
    setPlatformConfig(INITIAL_PLATFORM_CONFIG);
    setActiveVerifiedCount(14);
    setFreeOnlineCount(385);
    setAutoFluctuate(true);
    handleAddAuditLog('System Reset', 'system', 'Admin triggered full platform state reset to initial factory snapshot.');
  };

  // Delete Account Handler: Permanently delete account and all associated info
  const handleDeleteAccount = () => {
    const deletedName = user.name;
    const deletedHandle = user.handle;
    const deletedUniqueId = user.uniqueId;

    // 1. If user was an online actuator, deduct from active verified count and recalculate bonding price
    if (user.tier !== 'free' && user.isOnline) {
      setActiveVerifiedCount((prev) => {
        const next = Math.max(0, prev - 1);
        setPreviousPrice(currentPrice);
        recordPriceTick(calculateDynamicPrice(next, { stepMultiplier: platformConfig.stepMultiplierUsd }), next);
        return next;
      });
    }

    // 2. Remove user from community members registry
    setMembers((prev) => prev.filter((m) => m.uniqueId !== deletedUniqueId && m.handle !== deletedHandle));

    // 3. Sever and remove all referrals originated by this user
    setReferrals((prev) => prev.filter((r) => r.userUniqueId !== deletedUniqueId));

    // 4. Wipe user-specific transactions
    setTransactions((prev) => prev.filter((t) => !t.id.startsWith('tx_user_') && t.type !== 'subscription'));

    // 5. Audit Log the permanent wipe
    handleAddAuditLog(
      'Account Deleted',
      'system',
      `User ${deletedName} (${deletedHandle}, ID: ${deletedUniqueId}) permanently deleted their account. All profile info, KYC biometric documents, wallet address, and token balances were purged.`
    );

    // 6. Broadcast deletion notification in community chat
    const deleteNoticeMsg: ChatMessage = {
      id: `msg_del_${Date.now()}`,
      memberId: 'system',
      senderName: 'System Security',
      senderHandle: '@security',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      senderTier: 'free',
      isOnline: true,
      message: `🔒 Notice: User ${deletedHandle} has permanently deleted their account and purged all personal data & node weight.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPriceDriver: false,
    };
    setChatMessages((prev) => [deleteNoticeMsg, ...prev]);

    // 7. Reset User to wiped/guest state
    setUser({
      id: `usr_guest_${Date.now()}`,
      uniqueId: '000000000000000',
      name: 'Guest Observer',
      handle: '@guest_user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      tier: 'free',
      isOnline: false,
      isAdmin: false,
      walletAddress: '0x0000000000000000000000000000000000000000',
      sharexBalance: 0,
      usdCashBalance: 0,
      kyc: {
        status: 'unverified',
        whatsapp: '',
        email: '',
        docType: 'passport',
        docNumber: '',
      },
    });

    // 8. Open the AccountDeletedSuccessModal
    setDeletedModalData({
      isOpen: true,
      deletedName,
      deletedHandle,
    });
  };

  const handleRegisterNewAccount = (name: string, handle: string) => {
    const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newUniqueId = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      uniqueId: newUniqueId,
      name,
      handle,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tier: 'free',
      isOnline: true,
      isAdmin: false,
      walletAddress: `0x${randomHex}`,
      sharexBalance: 0,
      usdCashBalance: 100,
      kyc: {
        status: 'unverified',
        whatsapp: '',
        email: `${handle.replace('@', '')}@cps.network`,
        docType: 'passport',
        docNumber: '',
      },
    };
    setUser(newUser);
    handleAddAuditLog('New Registration', 'system', `New user registered: ${name} (${handle})`);
    setActiveTab('dashboard');
  };

  const handleRestoreDemoProfile = () => {
    setUser(INITIAL_USER);
    handleAddAuditLog('Demo Restored', 'system', 'Restored default demo profile for Alex Rivera');
    setActiveTab('dashboard');
  };

  const handleImpersonateUser = (member: CommunityMember) => {
    // Preserve original admin session if not already in impersonation mode
    if (!impersonatingAdmin) {
      setImpersonatingAdmin(user);
    }

    const calculatedCash = Math.max(1500, Number((member.tokensHeld * 0.0000015).toFixed(2)) + 450);
    const mockWallet = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const impersonatedProfile: UserProfile = {
      id: member.id,
      uniqueId: member.uniqueId || Math.floor(100000000000000 + Math.random() * 900000000000000).toString(),
      name: member.name,
      handle: member.handle,
      avatar: member.avatar,
      tier: member.tier,
      isOnline: member.isOnline,
      isAdmin: false,
      walletAddress: mockWallet,
      sharexBalance: member.tokensHeld,
      usdCashBalance: calculatedCash,
      kyc: member.tier !== 'free' 
        ? {
            status: 'verified',
            verifiedAt: '2026-03-01',
            whatsapp: '+1 (555) 349-8821',
            email: `${member.handle.replace('@', '')}@cps.network`,
            docType: 'passport',
            docNumber: `PASSPORT-${member.id.toUpperCase()}`,
          }
        : {
            status: 'unverified',
            whatsapp: '',
            email: `${member.handle.replace('@', '')}@cps.network`,
            docType: 'passport',
            docNumber: '',
          },
    };

    setUser(impersonatedProfile);
    setActiveTab('dashboard');

    handleAddAuditLog(
      'User Impersonated',
      'user',
      `Master Admin initiated impersonation session for ${member.name} (${member.handle}, ID: ${member.id})`
    );

    const impNotif: AppNotification = {
      id: `notif_imp_${Date.now()}`,
      type: 'system',
      title: 'Impersonation Mode Active',
      message: `Now viewing platform as ${member.name} (${member.handle}). You can test trades, transfers, and wallet views as this account.`,
      timestamp: 'Just now',
      isRead: false,
      priority: 'warning',
      actionLabel: 'View Dashboard',
      actionTab: 'dashboard',
    };
    setNotifications((prev) => [impNotif, ...prev]);
  };

  const handleExitImpersonation = () => {
    if (!impersonatingAdmin) return;
    const original = impersonatingAdmin;
    setUser(original);
    setImpersonatingAdmin(null);
    setActiveTab('admin');

    handleAddAuditLog(
      'Impersonation Ended',
      'user',
      `Returned to Master Admin account (${original.name}, ${original.handle})`
    );

    const exitNotif: AppNotification = {
      id: `notif_imp_exit_${Date.now()}`,
      type: 'system',
      title: 'Admin Session Restored',
      message: `Returned to Master Admin (${original.name}). All root administrator privileges restored.`,
      timestamp: 'Just now',
      isRead: false,
      priority: 'info',
      actionLabel: 'Admin Panel',
      actionTab: 'admin',
    };
    setNotifications((prev) => [exitNotif, ...prev]);
  };

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text-primary)',
      }}
    >
      {/* 0. Admin Impersonation Active Banner */}
      {impersonatingAdmin && (
        <ImpersonationBanner
          currentUser={user}
          originalAdmin={impersonatingAdmin}
          members={members}
          onExitImpersonation={handleExitImpersonation}
          onSwitchUser={handleImpersonateUser}
        />
      )}

      {/* 1. Global Application Header with Notification & Announcement Bell */}
      <Header
        theme={theme}
        onThemeChange={setTheme}
        user={user}
        currentPrice={currentPrice}
        activeVerifiedCount={activeVerifiedCount}
        referralCount={referrals.length}
        notifications={notifications}
        platformConfig={platformConfig}
        watchedRewardAdsCount={watchedRewardAdsCount}
        isDailyActive={isDailyActive}
        onOpenRewardedVideo={handleOpenRewardedVideoAd}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onDeleteNotification={handleDeleteNotification}
        onNavigateTab={handleTabChangeWithRateLimit}
        onOpenWallet={() => handleTabChangeWithRateLimit('wallet')}
        onOpenMembership={() => handleTabChangeWithRateLimit('membership')}
        onOpenMyShares={() => handleTabChangeWithRateLimit('my_shares')}
        onOpenAirdrop={() => handleTabChangeWithRateLimit('airdrop')}
        onOpenKycModal={() => setShowKycModal(true)}
        onOpenAdmin={isAdminSupported ? () => handleTabChangeWithRateLimit('admin') : undefined}
        onOpenSettings={() => handleTabChangeWithRateLimit('settings')}
        isAdminSession={Boolean(isAdminSupported && (user.isAdmin || impersonatingAdmin))}
      />

      {/* Global Maintenance Banner if active */}
      {platformConfig.maintenanceMode && (
        <div 
          id="global-maintenance-banner"
          className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>⚠️ EMERGENCY MAINTENANCE ACTIVE: {platformConfig.maintenanceMessage}</span>
          {isAdminSupported && (
            <button
              onClick={() => setActiveTab('admin')}
              className="underline text-amber-300 ml-2 hover:text-white font-mono"
            >
              Manage in Admin
            </button>
          )}
        </div>
      )}

      {/* Global Announcement Banner if active */}
      {platformConfig.globalAnnouncementActive && platformConfig.globalAnnouncement && (
        <div 
          id="global-announcement-banner"
          className={`px-4 py-2 text-xs font-semibold border-b transition-all ${
            platformConfig.globalAnnouncementType === 'critical'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : platformConfig.globalAnnouncementType === 'warning'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : platformConfig.globalAnnouncementType === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
              <span>{platformConfig.globalAnnouncement}</span>
            </div>
            <button
              onClick={() => setPlatformConfig((p) => ({ ...p, globalAnnouncementActive: false }))}
              className="text-[11px] opacity-75 hover:opacity-100 font-mono underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Main App Content Area with Responsive Sidebar & Mobile Bottom Nav */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        <Navigation
          activeTab={activeTab}
          onTabChange={handleTabChangeWithRateLimit}
          userTier={user.tier}
          activeVerifiedCount={activeVerifiedCount}
          referralCount={referrals.length}
          kycData={user.kyc}
          isAdmin={Boolean(isAdminSupported && (user.isAdmin || impersonatingAdmin))}
          onOpenKycModal={() => setShowKycModal(true)}
          onOpenArchitectureDocs={() => setShowArchModal(true)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-full overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              marketStats={marketStats}
              previousPrice={previousPrice}
              chartData={chartData}
              activeVerifiedCount={activeVerifiedCount}
              freeOnlineCount={freeOnlineCount}
              referralCount={referrals.length}
              isTransmitting={isUserTransmitting}
              onToggleTransmitting={handleToggleUserTransmitting}
              onOpenBuyModal={() => handleTabChangeWithRateLimit('wallet')}
              onOpenMembership={() => handleTabChangeWithRateLimit('membership')}
              onOpenMyShares={() => handleTabChangeWithRateLimit('my_shares')}
              onShowInterstitialAd={handleTriggerDrivePriceInterstitial}
              onPriceAlertTriggered={(targetPrice, reachedPrice) => {
                const newNotif: AppNotification = {
                  id: `notif_target_${Date.now()}`,
                  type: 'price',
                  title: 'Price Target Hit!',
                  message: `Dynamic price reached ${formatCryptoPrice(reachedPrice)}, hitting or exceeding your custom target of ${formatCryptoPrice(targetPrice)}!`,
                  timestamp: 'Just now',
                  isRead: false,
                  priority: 'success',
                  actionLabel: 'View Dashboard',
                  actionTab: 'dashboard',
                };
                setNotifications((prev) => [newNotif, ...prev]);
                handleAddAuditLog('Target Price Reached', 'system', `Dynamic price hit ${formatCryptoPrice(reachedPrice)} (target: ${formatCryptoPrice(targetPrice)})`);
              }}
            />
          )}

          {activeTab === 'community' && (
            <CommunityView
              members={members}
              chatMessages={chatMessages}
              user={user}
              activeVerifiedCount={activeVerifiedCount}
              onSendMessage={handleSendMessage}
              onOpenMembership={() => handleTabChangeWithRateLimit('membership')}
            />
          )}

          {activeTab === 'airdrop' && (
            <AirdropView
              user={user}
              currentPrice={currentPrice}
              activeVerifiedCount={activeVerifiedCount}
              referrals={referrals}
              onOpenMyShares={() => handleTabChangeWithRateLimit('my_shares')}
              onOpenMembership={() => handleTabChangeWithRateLimit('membership')}
            />
          )}

          {activeTab === 'membership' && (
            <MembershipView
              user={user}
              activeVerifiedCount={activeVerifiedCount}
              actuatorCards={actuatorCards}
              onUpgradeTier={handleUpgradeTier}
              onCancelSubscription={handleCancelSubscription}
            />
          )}

          {activeTab === 'my_shares' && (
            <MySharesView
              user={user}
              referrals={referrals}
              onOpenMembership={() => handleTabChangeWithRateLimit('membership')}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletView
              user={user}
              currentPrice={currentPrice}
              transactions={transactions}
              referrals={referrals}
              onExecuteTrade={handleExecuteTrade}
              onOpenMembership={() => handleTabChangeWithRateLimit('membership')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              theme={theme}
              referralCount={referrals.length}
              onThemeChange={setTheme}
              onUpdateUserProfile={handleUpdateUserProfile}
              onUpgradeTier={handleUpgradeTier}
              onOpenKycModal={() => setShowKycModal(true)}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {activeTab === 'kyc' && (
            <KycView
              user={user}
              onOpenKycModal={() => setShowKycModal(true)}
              onResetKyc={handleResetKyc}
            />
          )}

          {activeTab === 'admin' && isAdminSupported && (
            <AdminPanelView
              user={user}
              members={members}
              transactions={transactions}
              chatMessages={chatMessages}
              referrals={referrals}
              platformConfig={platformConfig}
              activeVerifiedCount={activeVerifiedCount}
              freeOnlineCount={freeOnlineCount}
              currentPrice={currentPrice}
              autoFluctuate={autoFluctuate}
              auditLogs={auditLogs}
              onUpdatePlatformConfig={setPlatformConfig}
              onSetVerifiedCount={(cnt) => {
                setPreviousPrice(currentPrice);
                setActiveVerifiedCount(cnt);
                recordPriceTick(calculateDynamicPrice(cnt, { stepMultiplier: platformConfig.stepMultiplierUsd }), cnt);
              }}
              onSetFreeCount={setFreeOnlineCount}
              onToggleAutoFluctuate={() => setAutoFluctuate(!autoFluctuate)}
              onUpdateUser={setUser}
              onUpdateMembers={setMembers}
              onUpdateTransactions={setTransactions}
              onUpdateChatMessages={setChatMessages}
              onAddAuditLog={handleAddAuditLog}
              onBroadcastAdminMessage={handleBroadcastAdminMessage}
              onResetPlatformState={handleResetPlatformState}
              onOpenKycModal={() => setShowKycModal(true)}
              onUpdateReferrals={setReferrals}
              onImpersonateUser={handleImpersonateUser}
              impersonatingAdmin={impersonatingAdmin}
              onExitImpersonation={handleExitImpersonation}
              actuatorCards={actuatorCards}
              onUpdateActuatorCards={setActuatorCards}
              onDirectActivateCard={handleDirectActivateCard}
              onTriggerTestAd={(type) => {
                if (type === 'app_open') {
                  setShowAppOpenAd(true);
                } else if (type === 'interstitial') {
                  setPendingTabTransition(null);
                  setInterstitialTriggerReason('drive_price');
                  setShowInterstitialAd(true);
                } else if (type === 'rewarded') {
                  handleOpenRewardedVideoAd();
                }
              }}
            />
          )}
        </main>
      </div>

      {/* 3. Global Architecture & API Integration Modal */}
      <ArchitectureModal
        isOpen={showArchModal}
        onClose={() => setShowArchModal(false)}
      />

      {/* 4. Global KYC Verification Modal (Live Camera, Passport/DL, WhatsApp & Email) */}
      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        user={user}
        onSaveKyc={handleSaveKyc}
      />

      {/* 5. Permanent Account Deletion Confirmation & New Registration Modal */}
      <AccountDeletedSuccessModal
        isOpen={deletedModalData.isOpen}
        deletedName={deletedModalData.deletedName}
        deletedHandle={deletedModalData.deletedHandle}
        onClose={() => setDeletedModalData((prev) => ({ ...prev, isOpen: false }))}
        onRegisterNewAccount={handleRegisterNewAccount}
        onRestoreDemo={handleRestoreDemoProfile}
      />

      {/* 5.5 Master Admin Passkey Authentication Gate Modal (Exclusively Rendered on Web Platform) */}
      {isAdminSupported && (
        <AdminAuthModal
          isOpen={showAdminAuthModal}
          onClose={() => setShowAdminAuthModal(false)}
          onAuthenticate={handleAdminAuthenticated}
          currentIsAdmin={Boolean(user.isAdmin)}
          onExitAdminSession={handleExitAdminSession}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. ADMOB MODALS                                                           */}
      {/* ========================================================================= */}
      {/* 1. App Open Ad: Triggered upon application launch */}
      <AdMobAppOpenModal
        isOpen={showAppOpenAd}
        onClose={handleCloseAppOpenAd}
      />

      {/* 7 & 8. Interstitial Ad: Triggered on Drive the price button & Tab Transitions */}
      <AdMobInterstitialModal
        isOpen={showInterstitialAd}
        onClose={handleCloseInterstitialAd}
        triggerReason={interstitialTriggerReason}
      />

      {/* 9. Rewarded Video Ad: Header Button Coins Style & Daily Active Counter */}
      <AdMobRewardedVideoModal
        isOpen={showRewardedVideoAd}
        onClose={handleCloseRewardedVideoAd}
        onRewardEarned={handleRewardEarned}
        currentWatchedCount={watchedRewardAdsCount}
      />
    </div>
  );
}
