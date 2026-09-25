export type ThemeMode = 'dark-blue' | 'white' | 'dark';

export type UserTier = 'free' | 'verified_monthly' | 'verified_yearly';

export type ActuatorPlanDuration = 30 | 180 | 360;

export interface ActuatorCard {
  id: string;
  cardNumber: string; // 16-digit card number, e.g. "4532890123456789"
  formattedCardNumber: string; // e.g. "4532 8901 2345 6789"
  days: ActuatorPlanDuration; // 30 | 180 | 360
  priceUsd: number; // 1.70 | 10.20 | 20.40
  label: string; // "30 Days" | "180 Days (6 Mo)" | "360 Days (1 Yr)"
  createdAt: string;
  status: 'active' | 'redeemed' | 'revoked';
  assignedToUserId?: string;
  assignedToName?: string;
  redeemedByUserId?: string;
  redeemedByName?: string;
  redeemedAt?: string;
  memo?: string;
}

export type KycStatus = 'unverified' | 'pending' | 'verified';

export type KycIdDocType = 'passport' | 'driving_license' | 'national_id';

export interface KycData {
  status: KycStatus;
  country?: string; // Government jurisdiction / country name
  countryCode?: string; // 2-letter ISO country code
  whatsapp: string;
  email: string;
  docType: KycIdDocType;
  docNumber: string;
  docPhotoUrl?: string; // photo or uploaded document
  facePhotoUrl?: string; // selfie/face from camera
  verifiedAt?: string;
}

export interface UserProfile {
  id: string;
  uniqueId: string; // 15-digit unique identifier
  name: string;
  handle: string;
  avatar: string;
  tier: UserTier;
  isOnline: boolean;
  walletAddress: string;
  sharexBalance: number;
  usdCashBalance: number;
  subscriptionStartedAt?: string;
  subscriptionRenewsAt?: string;
  actuatorDaysRemaining?: number;
  actuatorExpiryDate?: string;
  actuatorPlanDays?: ActuatorPlanDuration;
  redeemedCardNumber?: string;
  kyc?: KycData;
  location?: string;
  countryCode?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  signUpDate?: string;
  adsWatchedCount?: number;
}

export interface CommunityMember {
  id: string;
  uniqueId: string; // 15-digit unique identifier
  serialNumber?: number;
  name: string;
  handle: string;
  avatar: string;
  tier: UserTier;
  isOnline: boolean;
  verifiedSince: string;
  influenceMultiplier: number;
  tokensHeld: number;
  location?: string;
  isKycVerified?: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  kyc?: KycData;
  signUpDate?: string;
  adsWatchedCount?: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'subscription' | 'dividend' | 'transfer';
  tokenAmount: number;
  tokenPrice: number;
  usdTotal: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
  note?: string;
}

export interface PriceTick {
  timestamp: number;
  timeLabel: string;
  price: number;
  verifiedOnlineCount: number;
  volume: number;
}

export interface CandleTick {
  timestamp: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  verifiedOnlineCount: number;
}

export type ChartType = 'line' | 'candle';
export type ChartTimeframe = '1M' | '5M' | '15M' | '1H' | '4H' | '24H' | '1Month' | 'All Time';

export interface MarketStats {
  circulatingSupply: number;
  maxSupply: number;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  activeVerifiedOnline: number;
  totalVerifiedMembers: number;
  totalFreeMembers: number;
  totalSupply: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceVelocityPerMinute: number;
  communityOwnedSupply?: number;
  communityOwnedPercent?: number;
}

export interface ReferralRecord {
  id: string;
  sponsorId?: string; // ID of the sponsor who referred this member (e.g. usr_me_001, mem_01)
  sponsorHandle?: string; // Handle of the sponsor (e.g. @alex_rivera)
  sponsorName?: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  userUniqueId: string;
  joinedAt: string;
  rewardCoinsSponsor: number; // 1 share to sponsor
  rewardCoinsInvitee: number; // 1 share to invitee
  status: 'completed' | 'pending';
  tier: UserTier;
  kycStatus?: KycStatus; // 'verified' | 'pending' | 'unverified'
  kycData?: KycData;
  isSold?: boolean; // Whether this referral lead was sold/transferred by admin
  salePriceUsd?: number; // Price it was sold for (if sold by admin)
  saleDate?: string;
  saleNotes?: string;
  commissionStatus?: 'unpaid' | 'paid' | 'transferred';
}

export interface ChatMessage {
  id: string;
  memberId: string;
  senderName: string;
  senderHandle: string;
  senderAvatar: string;
  senderTier: UserTier;
  isOnline: boolean;
  message: string;
  timestamp: string;
  isPriceDriver: boolean;
  isAdmin?: boolean;
  feeDisplay?: string;
}

export interface InflowThrottleConfig {
  enabled: boolean; // Whether mass inflow time-slicing (TWAP) is enabled
  targetDurationMinutes: number; // e.g. 15, 30, 60 (1 hr), 120 (2 hrs), 240 (4 hrs)
  maxPriceVelocityPerMinutePercent: number; // Max bullish price drift per minute/candle (e.g. 1.5% to 3.0%)
  maxDownwardVelocityPercent: number; // Max bearish pullback drift per minute/candle (e.g. 0.8% to 1.5%)
  curveType: 'twap_linear' | 'sigmoid_scurve' | 'instant';
  cooldownSeconds: number; // Anti-bot cooldown on the "Drive" button (e.g. 15s to 30s)
}

export interface AdMobConfig {
  enabled: boolean; // Master ad serving toggle
  testMode: boolean; // True to run Google official test units
  appId: string; // e.g. "ca-app-pub-3940256099942544~3347511713"
  appOpenAdUnitId: string; // e.g. "ca-app-pub-3940256099942544/3419832817"
  appOpenAdEnabled: boolean;
  bannerAdUnitId: string; // e.g. "ca-app-pub-3940256099942544/6300978111"
  bannerAdsEnabled: boolean;
  interstitialAdUnitId: string; // e.g. "ca-app-pub-3940256099942544/1033173712"
  interstitialAdsEnabled: boolean;
  interstitialRateLimitMinutes: number; // e.g. 3 (rate limit between view transitions)
  rewardedVideoAdUnitId: string; // e.g. "ca-app-pub-3940256099942544/5224354917"
  rewardedVideoAdEnabled: boolean;
  rewardVideoTokenBonus: number; // e.g. 100 CPS coins awarded per completed ad
}

export interface PlatformConfig {
  tradingFrozen: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  airdropFrozen: boolean;
  enforceKycTrading: boolean;
  enforceKycAirdrop: boolean;
  chatMutedForObservers: boolean;
  globalAnnouncement: string;
  globalAnnouncementActive: boolean;
  globalAnnouncementType: 'info' | 'warning' | 'critical' | 'success';
  tradingFeePercent: number; // e.g. 0.0%
  minTradeUsd: number;
  maxTradeUsd: number;
  airdropTotalPool: number; // default 100,000,000
  airdropClaimed: number;
  referralSponsorReward: number; // default 1 share
  referralInviteeReward: number; // default 1 share
  fluctuationSpeedMs: number; // default 4000
  stepMultiplierUsd: number; // default 0.0000001 (1e-7)
  inflowThrottle?: InflowThrottleConfig;
  adMob?: AdMobConfig;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  category: 'pricing' | 'kyc' | 'user' | 'trading' | 'airdrop' | 'system' | 'chat' | 'referrals' | 'admob';
  details: string;
  timestamp: string;
  adminHandle: string;
}

export interface AppNotification {
  id: string;
  type: 'admin_announcement' | 'system' | 'reward' | 'kyc' | 'price';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'critical' | 'warning' | 'info' | 'success';
  actionLabel?: string;
  actionTab?: ActiveTab;
}

export type ActiveTab = 'dashboard' | 'community' | 'airdrop' | 'my_shares' | 'membership' | 'wallet' | 'settings' | 'kyc' | 'admin';
