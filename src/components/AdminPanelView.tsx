import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Users,
  Coins,
  DollarSign,
  Flame,
  Sliders,
  Settings,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Download,
  Upload,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Eye,
  Layers,
  Cpu,
  Globe,
  Sparkles,
  Filter,
  Camera,
  FileText,
  Check,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  UserCheck,
  UserX,
  Database,
  Key,
  Network,
  ShoppingCart,
  Tag,
  ArrowRightLeft,
  LogIn,
  LogOut,
  X,
  CreditCard,
  Calendar,
  Tv
} from 'lucide-react';
import { 
  UserProfile, 
  CommunityMember, 
  Transaction, 
  ChatMessage, 
  ReferralRecord,
  PlatformConfig,
  AdminAuditLog,
  UserTier,
  KycStatus,
  KycData,
  ActuatorCard
} from '../types';
import { 
  BASE_PRICE, 
  calculateDynamicPrice,
  formatCryptoPrice 
} from '../utils/pricingEngine';
import { INITIAL_ADMIN_KYC_DOSSIERS } from '../data/mockData';
import { AdminReferralsTab } from './AdminReferralsTab';
import { AdminCardsTab } from './AdminCardsTab';
import { AdminGeoHeatmap } from './AdminGeoHeatmap';
import { AdminAdMobTab } from './AdminAdMobTab';

interface AdminPanelViewProps {
  user: UserProfile;
  members: CommunityMember[];
  transactions: Transaction[];
  chatMessages: ChatMessage[];
  referrals: ReferralRecord[];
  platformConfig: PlatformConfig;
  activeVerifiedCount: number;
  freeOnlineCount: number;
  currentPrice: number;
  autoFluctuate: boolean;
  auditLogs: AdminAuditLog[];
  onUpdatePlatformConfig: (updater: (prev: PlatformConfig) => PlatformConfig) => void;
  onSetVerifiedCount: (count: number) => void;
  onSetFreeCount: (count: number) => void;
  onToggleAutoFluctuate: () => void;
  onUpdateUser: (updater: (prev: UserProfile) => UserProfile) => void;
  onUpdateMembers: (updater: (prev: CommunityMember[]) => CommunityMember[]) => void;
  onUpdateTransactions: (updater: (prev: Transaction[]) => Transaction[]) => void;
  onUpdateChatMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onAddAuditLog: (action: string, category: AdminAuditLog['category'], details: string) => void;
  onBroadcastAdminMessage: (text: string) => void;
  onResetPlatformState: () => void;
  onOpenKycModal: () => void;
  onUpdateReferrals: (updater: (prev: ReferralRecord[]) => ReferralRecord[]) => void;
  onImpersonateUser?: (member: CommunityMember) => void;
  impersonatingAdmin?: UserProfile | null;
  onExitImpersonation?: () => void;
  actuatorCards?: ActuatorCard[];
  onUpdateActuatorCards?: (updater: (prev: ActuatorCard[]) => ActuatorCard[]) => void;
  onDirectActivateCard?: (card: ActuatorCard, targetUserId: string) => void;
  onTriggerTestAd?: (type: 'app_open' | 'interstitial' | 'rewarded') => void;
}

type AdminTab = 'overview' | 'pricing' | 'heatmap' | 'users' | 'cards' | 'referrals' | 'kyc' | 'airdrop' | 'transactions' | 'chat' | 'system' | 'admob';

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  user,
  members,
  transactions,
  chatMessages,
  referrals,
  platformConfig,
  activeVerifiedCount,
  freeOnlineCount,
  currentPrice,
  autoFluctuate,
  auditLogs,
  onUpdatePlatformConfig,
  onSetVerifiedCount,
  onSetFreeCount,
  onToggleAutoFluctuate,
  onUpdateUser,
  onUpdateMembers,
  onUpdateTransactions,
  onUpdateChatMessages,
  onAddAuditLog,
  onBroadcastAdminMessage,
  onResetPlatformState,
  onOpenKycModal,
  onUpdateReferrals,
  onImpersonateUser,
  impersonatingAdmin,
  onExitImpersonation,
  actuatorCards = [],
  onUpdateActuatorCards,
  onDirectActivateCard,
  onTriggerTestAd,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedReferralSponsorFilter, setSelectedReferralSponsorFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Pricing Engine: Value Per Actuator state
  const [valuePerActuatorInput, setValuePerActuatorInput] = useState<string>(
    platformConfig.stepMultiplierUsd !== undefined ? platformConfig.stepMultiplierUsd.toString() : BASE_PRICE.toString()
  );
  const [manualActuatorsInput, setManualActuatorsInput] = useState<number>(activeVerifiedCount);

  // Synchronize state if platformConfig changes
  React.useEffect(() => {
    if (platformConfig.stepMultiplierUsd !== undefined) {
      setValuePerActuatorInput(platformConfig.stepMultiplierUsd.toString());
    }
  }, [platformConfig.stepMultiplierUsd]);

  React.useEffect(() => {
    setManualActuatorsInput(activeVerifiedCount);
  }, [activeVerifiedCount]);

  // Handler to save the Value Per Actuator to platformConfig
  const handleSaveValuePerActuator = (overrideVal?: number) => {
    const raw = overrideVal !== undefined ? overrideVal.toString() : valuePerActuatorInput;
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Error: Value per Actuator must be a positive number greater than 0');
      return;
    }
    setValuePerActuatorInput(parsed.toString());
    onUpdatePlatformConfig((prev) => ({
      ...prev,
      stepMultiplierUsd: parsed,
    }));
    onAddAuditLog(
      'Value Per Actuator Updated',
      'pricing',
      `Set Value Per Actuator to $${parsed} USD (Formula: Price = Active Online Actuators * $${parsed})`
    );
    showToast(`Saved! Value per Actuator set to $${parsed}. Price dynamically recalculated.`);
  };

  const handleApplyActuatorsOverride = () => {
    onSetVerifiedCount(manualActuatorsInput);
    onAddAuditLog(
      'Actuators Count Override',
      'pricing',
      `Manually set active Actuators count to ${manualActuatorsInput}`
    );
    showToast(`Applied Actuators count: ${manualActuatorsInput} online`);
  };

  // Users tab states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userTierFilter, setUserTierFilter] = useState<'all' | UserTier>('all');
  const [userKycFilter, setUserKycFilter] = useState<'all' | KycStatus>('all');
  const [editingMember, setEditingMember] = useState<CommunityMember | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    handle: '@',
    tier: 'verified_monthly' as UserTier,
    tokensHeld: 1000000,
    isOnline: true,
    location: 'Global Hub',
    signUpDate: new Date().toISOString().split('T')[0],
  });

  // Direct Token Minting Modal State & Recipient Filters
  const [mintTargetId, setMintTargetId] = useState<string>('me');
  const [mintAmount, setMintAmount] = useState<number>(5000000);
  const [mintUsdAmount, setMintUsdAmount] = useState<number>(100);
  const [mintUserSearch, setMintUserSearch] = useState<string>('');
  const [mintUserTierFilter, setMintUserTierFilter] = useState<'all' | 'admin' | 'actuator' | 'observer'>('all');

  // KYC Tab states
  const [selectedKycReview, setSelectedKycReview] = useState<{
    id: string;
    name: string;
    handle: string;
    avatar: string;
    kyc?: KycData;
  } | null>(null);

  // Chat tab broadcast state
  const [adminBroadcastText, setAdminBroadcastText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Combine current user with community members for unified user management
  const allUsersList = [
    {
      id: user.id,
      uniqueId: user.uniqueId,
      name: user.name,
      handle: user.handle,
      avatar: user.avatar,
      tier: user.tier,
      isOnline: user.isOnline,
      tokensHeld: user.sharexBalance,
      usdCashBalance: user.usdCashBalance,
      walletAddress: user.walletAddress,
      kyc: user.kyc,
      isCurrentLoggedInUser: true,
      isAdmin: true,
      signUpDate: user.signUpDate || user.subscriptionStartedAt?.split('T')[0] || '2026-01-10',
      adsWatchedCount: user.adsWatchedCount ?? 4,
    },
    ...members.map((m) => ({
      id: m.id,
      uniqueId: m.uniqueId,
      name: m.name,
      handle: m.handle,
      avatar: m.avatar,
      tier: m.tier,
      isOnline: m.isOnline,
      tokensHeld: m.tokensHeld,
      usdCashBalance: 0,
      walletAddress: `0x${m.id.slice(-4)}...${m.uniqueId.slice(-4)}`,
      kyc: INITIAL_ADMIN_KYC_DOSSIERS[m.id] || m.kyc || (m.isKycVerified ? {
        status: 'verified' as KycStatus,
        whatsapp: '+1 555-0199',
        email: `${m.handle.replace('@', '')}@cps.network`,
        docType: 'passport' as const,
        docNumber: `PASS-${m.uniqueId.slice(-6)}`,
        facePhotoUrl: m.avatar,
        verifiedAt: m.verifiedSince,
      } : {
        status: 'unverified' as KycStatus,
        whatsapp: '',
        email: `${m.handle.replace('@', '')}@cps.network`,
        docType: 'national_id' as const,
        docNumber: '',
      }),
      isCurrentLoggedInUser: false,
      isAdmin: m.isAdmin || false,
      signUpDate: m.signUpDate || (m.verifiedSince && m.verifiedSince !== '-' ? m.verifiedSince : '2026-08-15'),
      adsWatchedCount: m.adsWatchedCount ?? 0,
    })),
  ];

  // Filtered users
  const filteredUsers = allUsersList.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.uniqueId.includes(userSearchQuery);
    const matchesTier = userTierFilter === 'all' || u.tier === userTierFilter;
    const kycStatus = u.kyc?.status || 'unverified';
    const matchesKyc = userKycFilter === 'all' || kycStatus === userKycFilter;
    return matchesSearch && matchesTier && matchesKyc;
  });

  // Filtered recipients for Direct Token Minting & Liquidity Injection
  const filteredMintRecipients = allUsersList.filter((u) => {
    const q = mintUserSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q) ||
      u.uniqueId.includes(q) ||
      u.id.toLowerCase().includes(q);

    let matchesTier = true;
    if (mintUserTierFilter === 'admin') {
      matchesTier = !!u.isAdmin || u.isCurrentLoggedInUser;
    } else if (mintUserTierFilter === 'actuator') {
      matchesTier = u.tier !== 'free';
    } else if (mintUserTierFilter === 'observer') {
      matchesTier = u.tier === 'free';
    }

    return matchesSearch && matchesTier;
  });

  const selectedMintRecipient = allUsersList.find(
    (u) => u.id === mintTargetId || (mintTargetId === 'me' && u.isCurrentLoggedInUser)
  ) || allUsersList[0];

  // Calculate stats
  const totalActuators = allUsersList.filter((u) => u.tier !== 'free').length;
  const totalObservers = allUsersList.filter((u) => u.tier === 'free').length;
  const totalTokensDistributed = allUsersList.reduce((acc, u) => acc + u.tokensHeld, 0);
  const pendingKycSubmissions = allUsersList.filter((u) => u.kyc?.status === 'pending');
  const verifiedKycUsers = allUsersList.filter((u) => u.kyc?.status === 'verified');

  // KYC Approval handler
  const handleApproveKyc = (userId: string, userName: string) => {
    if (userId === user.id) {
      onUpdateUser((prev) => ({
        ...prev,
        kyc: {
          ...(prev.kyc || {
            whatsapp: '+1 555-0100',
            email: 'alex.rivera@cps.network',
            docType: 'passport',
            docNumber: 'US-92841029',
          }),
          status: 'verified',
          verifiedAt: new Date().toISOString(),
        },
      }));
    } else {
      onUpdateMembers((prev) =>
        prev.map((m) => {
          if (m.id === userId) {
            return {
              ...m,
              isKycVerified: true,
              kyc: {
                ...(m.kyc || {
                  whatsapp: '+1 555-0100',
                  email: `${m.handle.replace('@', '')}@cps.network`,
                  docType: 'passport',
                  docNumber: `ID-${m.uniqueId.slice(-6)}`,
                }),
                status: 'verified',
                verifiedAt: new Date().toISOString(),
              },
            };
          }
          return m;
        })
      );
    }
    onAddAuditLog('KYC Approved', 'kyc', `Approved KYC verification for ${userName} (${userId})`);
    showToast(`KYC Approved for ${userName}`);
    if (selectedKycReview?.id === userId) {
      setSelectedKycReview(null);
    }
  };

  // KYC Rejection handler
  const handleRejectKyc = (userId: string, userName: string, reason: string) => {
    if (userId === user.id) {
      onUpdateUser((prev) => ({
        ...prev,
        kyc: {
          ...(prev.kyc || {
            whatsapp: '',
            email: '',
            docType: 'passport',
            docNumber: '',
          }),
          status: 'unverified',
          verifiedAt: undefined,
        },
      }));
    } else {
      onUpdateMembers((prev) =>
        prev.map((m) => {
          if (m.id === userId) {
            return {
              ...m,
              isKycVerified: false,
              kyc: {
                ...(m.kyc || {
                  whatsapp: '',
                  email: '',
                  docType: 'passport',
                  docNumber: '',
                }),
                status: 'unverified',
                verifiedAt: undefined,
              },
            };
          }
          return m;
        })
      );
    }
    onAddAuditLog('KYC Rejected', 'kyc', `Rejected KYC for ${userName}. Reason: ${reason}`);
    showToast(`KYC Rejected for ${userName}`);
    if (selectedKycReview?.id === userId) {
      setSelectedKycReview(null);
    }
  };

  // KYC Auto-Verify All Pending
  const handleVerifyAllPendingKyc = () => {
    onUpdateMembers((prev) =>
      prev.map((m) => {
        if (m.kyc?.status === 'pending') {
          return {
            ...m,
            isKycVerified: true,
            kyc: {
              ...m.kyc,
              status: 'verified',
              verifiedAt: new Date().toISOString(),
            },
          };
        }
        return m;
      })
    );
    if (user.kyc?.status === 'pending') {
      onUpdateUser((prev) => ({
        ...prev,
        kyc: {
          ...prev.kyc!,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
        },
      }));
    }
    onAddAuditLog('Bulk KYC Approved', 'kyc', 'Master Admin approved all pending KYC submissions');
    showToast('All pending KYC submissions have been verified!');
  };

  // Direct Minting / Balance Injection
  const handleExecuteMint = () => {
    const targetRecipient = allUsersList.find(
      (u) => u.id === mintTargetId || (mintTargetId === 'me' && u.isCurrentLoggedInUser)
    );
    const targetLabel = targetRecipient ? `${targetRecipient.name} (${targetRecipient.handle})` : mintTargetId;

    if (mintTargetId === 'me' || mintTargetId === user.id) {
      onUpdateUser((prev) => ({
        ...prev,
        sharexBalance: prev.sharexBalance + mintAmount,
        usdCashBalance: prev.usdCashBalance + mintUsdAmount,
      }));
    } else {
      onUpdateMembers((prev) =>
        prev.map((m) => {
          if (m.id === mintTargetId) {
            return {
              ...m,
              tokensHeld: m.tokensHeld + mintAmount,
            };
          }
          return m;
        })
      );
    }

    const mintTx: Transaction = {
      id: `tx_admin_mint_${Date.now()}`,
      type: 'dividend',
      tokenAmount: mintAmount,
      tokenPrice: currentPrice,
      usdTotal: mintUsdAmount,
      timestamp: new Date().toISOString(),
      status: 'completed',
      txHash: `0xADMIN_MINT_${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      note: `Admin Treasury Grant: +${(mintAmount / 1_000_000).toFixed(2)}M CPS & $${mintUsdAmount} USD to ${targetLabel}`,
    };
    onUpdateTransactions((prev) => [mintTx, ...prev]);
    onAddAuditLog(
      'Treasury Mint Executed',
      'trading',
      `Minted ${mintAmount.toLocaleString()} CPS and $${mintUsdAmount} USD to ${targetLabel}`
    );
    showToast(`Successfully granted ${mintAmount.toLocaleString()} CPS & $${mintUsdAmount} USD to ${targetLabel}!`);
  };

  // Add new community member
  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.handle) return;

    const newMember: CommunityMember = {
      id: `mem_${Date.now()}`,
      uniqueId: Math.floor(100000000000000 + Math.random() * 900000000000000).toString(),
      serialNumber: members.length + 2,
      name: newMemberForm.name,
      handle: newMemberForm.handle.startsWith('@') ? newMemberForm.handle : `@${newMemberForm.handle}`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      tier: newMemberForm.tier,
      isOnline: newMemberForm.isOnline,
      verifiedSince: new Date().toISOString().split('T')[0],
      signUpDate: newMemberForm.signUpDate || new Date().toISOString().split('T')[0],
      influenceMultiplier: newMemberForm.tier !== 'free' ? 1.0 : 0.0,
      tokensHeld: newMemberForm.tokensHeld,
      location: newMemberForm.location,
      isKycVerified: false,
    };

    onUpdateMembers((prev) => [newMember, ...prev]);
    setIsAddingMember(false);
    setNewMemberForm({
      name: '',
      handle: '@',
      tier: 'verified_monthly',
      tokensHeld: 1000000,
      isOnline: true,
      location: 'Global Hub',
      signUpDate: new Date().toISOString().split('T')[0],
    });
    onAddAuditLog('New Member Enrolled', 'user', `Admin registered new member ${newMember.name} (${newMember.handle})`);
    showToast(`Member ${newMember.name} added to the network`);
  };

  // Save edited member
  const handleSaveMemberEdit = () => {
    if (!editingMember) return;
    onUpdateMembers((prev) =>
      prev.map((m) => (m.id === editingMember.id ? editingMember : m))
    );
    onAddAuditLog('Member Profile Modified', 'user', `Updated profile parameters for ${editingMember.name}`);
    showToast(`Updated profile for ${editingMember.name}`);
    setEditingMember(null);
  };

  // Delete member
  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the CPS network?`)) {
      onUpdateMembers((prev) => prev.filter((m) => m.id !== id));
      onAddAuditLog('Member Expelled', 'user', `Removed member ${name} (${id}) from community`);
      showToast(`Removed member ${name}`);
    }
  };

  // Send official broadcast message
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBroadcastText.trim()) return;
    onBroadcastAdminMessage(adminBroadcastText);
    setAdminBroadcastText('');
    showToast('Official admin broadcast dispatched to community chat');
  };

  // Export platform state
  const handleExportStateJson = () => {
    const dump = {
      timestamp: new Date().toISOString(),
      exportedBy: user.handle,
      platformConfig,
      user,
      members,
      transactions,
      referrals,
      auditLogs,
      activeVerifiedCount,
      currentPrice,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dump, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `CPS_Platform_Snapshot_${Date.now()}.json`);
    dlAnchor.click();
    showToast('Platform JSON snapshot downloaded');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl border bg-sky-500/10 border-sky-500/40 text-sky-300 text-xs sm:text-sm flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right duration-200">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MASTER ADMIN COMMAND HEADER                                            */}
      {/* ========================================================================= */}
      <div 
        className="rounded-3xl border p-6 relative overflow-hidden transition-all shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, var(--theme-card) 100%)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-sky-500/20 shrink-0">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  MASTER ADMIN CONTROL PANEL
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ROOT ACCESS
                </span>
                {platformConfig.maintenanceMode && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    MAINTENANCE ACTIVE
                  </span>
                )}
                {platformConfig.tradingFrozen && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    TRADING FROZEN
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Full Operational Control • Pricing Bonding Curve, User Balances, KYC Verification, 100M Airdrop & Emergency Kill-Switches
              </p>
            </div>
          </div>

          {/* Quick System Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportStateJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:border-sky-500 transition-all"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
              title="Download full platform state as JSON"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Snapshot</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset system cache to initial settings?')) {
                  onResetPlatformState();
                  showToast('System cache reset to baseline');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-all"
              title="Reset state to default baseline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Cache</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
          {[
            { id: 'overview', label: 'Master Overview', icon: Activity },
            { id: 'pricing', label: 'Dynamic Price Engine', icon: Sliders },
            { id: 'heatmap', label: 'Geo Heatmap (IP)', icon: Globe },
            { id: 'users', label: `Users & Balances (${allUsersList.length})`, icon: Users },
            { id: 'cards', label: `16-Digit Cards (${actuatorCards.length})`, icon: CreditCard },
            { id: 'referrals', label: `Referral Teams & Sales (${referrals.length})`, icon: Network },
            { 
              id: 'kyc', 
              label: `KYC Compliance ${pendingKycSubmissions.length > 0 ? `(${pendingKycSubmissions.length} Pending)` : ''}`, 
              icon: ShieldCheck, 
              badge: pendingKycSubmissions.length 
            },
            { id: 'airdrop', label: '100M Airdrop Pool', icon: Flame },
            { id: 'transactions', label: `Ledger & Trades (${transactions.length})`, icon: DollarSign },
            { id: 'chat', label: 'Announcements & Chat', icon: MessageSquare },
            { id: 'admob', label: 'Google AdMob Ads', icon: Tv },
            { id: 'system', label: 'Audit Trail & Policy', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 scale-102'
                    : 'border hover:bg-slate-800/40'
                }`}
                style={{
                  backgroundColor: isActive ? undefined : 'var(--theme-card)',
                  borderColor: isActive ? undefined : 'var(--theme-border)',
                  color: isActive ? undefined : 'var(--theme-text-secondary)',
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MASTER OVERVIEW & KILL-SWITCHES                                     */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div 
              onClick={() => setActiveTab('pricing')}
              className="p-4 rounded-2xl border cursor-pointer hover:border-sky-500/60 transition-all group"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
              title="Click to configure Value Per Actuator"
            >
              <div className="flex items-center justify-between text-xs text-sky-400 font-bold mb-1">
                <span>Current Dynamic Price</span>
                <Sliders className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform" />
              </div>
              <div className="text-xl font-black font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                {formatCryptoPrice(currentPrice)}
              </div>
              <p className="text-[11px] mt-1 text-sky-400 flex items-center justify-between">
                <span>${platformConfig.stepMultiplierUsd !== undefined ? platformConfig.stepMultiplierUsd : BASE_PRICE} / Actuator</span>
                <span className="text-[10px] underline group-hover:text-sky-300">Edit →</span>
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('heatmap')}
              className="p-4 rounded-2xl border cursor-pointer hover:border-emerald-500/60 transition-all group"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
              title="Click to view full Global Geo Heatmap (IP)"
            >
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
                <span>Active Nodes (Geo)</span>
                <Globe className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
              </div>
              <div className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1.5">
                <span>{activeVerifiedCount} 🟢</span>
                <span className="text-rose-400 text-sm font-normal">/ {freeOnlineCount} 🔴</span>
              </div>
              <p className="text-[11px] mt-1 text-slate-400 flex items-center justify-between">
                <span>Open Geo Heatmap</span>
                <span className="text-emerald-400 text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
              </p>
            </div>

            <div 
              className="p-4 rounded-2xl border"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-1">
                <span>100M Airdrop Pool</span>
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-xl font-black font-mono text-amber-300">
                {((platformConfig.airdropClaimed / platformConfig.airdropTotalPool) * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {(platformConfig.airdropClaimed / 1_000_000).toFixed(1)}M / {(platformConfig.airdropTotalPool / 1_000_000).toFixed(0)}M Claimed
              </p>
            </div>

            <div 
              className="p-4 rounded-2xl border"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center justify-between text-xs text-indigo-400 font-bold mb-1">
                <span>KYC Compliance</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xl font-black font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                {verifiedKycUsers.length} <span className="text-xs font-normal text-emerald-400">Verified</span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {pendingKycSubmissions.length} Submissions Awaiting Audit
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('referrals')}
              className="p-4 rounded-2xl border cursor-pointer hover:border-sky-500 transition-all group col-span-2 sm:col-span-1"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center justify-between text-xs text-sky-400 font-bold mb-1">
                <span>Referral Teams</span>
                <Network className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-black font-mono text-sky-400">
                {referrals.length} <span className="text-xs font-normal" style={{ color: 'var(--theme-text-muted)' }}>Leads</span>
              </div>
              <p className="text-[11px] mt-1 text-emerald-400 flex items-center justify-between">
                <span>{referrals.filter(r => r.kycStatus === 'verified' || r.kycData?.status === 'verified').length} Verified</span>
                <span className="text-sky-400 underline group-hover:text-sky-300">Manage →</span>
              </p>
            </div>
          </div>

          {/* Quick Value Per Actuator Multiplier Control Banner in Overview */}
          <div
            className="p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              borderColor: 'rgba(14, 165, 233, 0.3)',
            }}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-sky-200">
                    Dynamic Price Multiplier (Value Per Actuator)
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                    Price = Actuators × Value
                  </span>
                </div>
                <p className="text-xs text-sky-300/80 mt-0.5">
                  Set the multiplier per online Actuator. Currently: <strong>${platformConfig.stepMultiplierUsd}</strong> ({activeVerifiedCount} Actuators online = <strong>{formatCryptoPrice(currentPrice)}</strong>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">$</span>
                <input
                  type="text"
                  value={valuePerActuatorInput}
                  onChange={(e) => setValuePerActuatorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveValuePerActuator();
                    }
                  }}
                  placeholder="0.0000001"
                  className="w-36 pl-6 pr-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold outline-none focus:border-sky-400"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleSaveValuePerActuator()}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-sky-500/10 text-sky-300 border-sky-500/30 transition-all"
              >
                Engine Tab →
              </button>
            </div>
          </div>

          {/* 16-Digit Actuator Cards Treasury Quick Banner */}
          <div
            className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                    16-Digit Actuator Cards Treasury
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {actuatorCards.filter(c => c.status === 'active').length} Active (Unredeemed)
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  Admin-minted 16-digit vouchers for users to activate Actuator node access: <strong>30 Days ($1.70)</strong>, <strong>180 Days / 6 Mo ($10.20)</strong>, or <strong>360 Days / 1 Yr ($20.40)</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>Card Generator & Directory ({actuatorCards.length}) →</span>
            </button>
          </div>

          {/* Global Actuator & Observer Geo Heatmap Quick Access Banner */}
          <div
            onClick={() => setActiveTab('heatmap')}
            className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-emerald-500/60 transition-all group"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Global Actuator & Observer Heatmap</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      IP Geolocation Live
                    </span>
                  </h4>
                </div>
                <p className="text-xs mt-0.5 text-slate-400">
                  Visual telemetry of all incoming connections by region: <strong className="text-emerald-400">Green ({activeVerifiedCount} Actuators)</strong> and <strong className="text-rose-400">Red ({freeOnlineCount} Observers)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className="text-xs font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
                <span>Open World Map</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </div>

          {/* MASTER PLATFORM KILL-SWITCHES */}
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-4"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Emergency & Platform Kill-Switches
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Instant toggles to protect liquidity, halt order matching, or enter scheduled maintenance
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Live State
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Killswitch 1: Freeze Trading */}
              <div className="p-4 rounded-2xl border bg-slate-900/30 flex items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>Spot Trading Engine</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {platformConfig.tradingFrozen ? 'HALTED (No buys or sells permitted)' : 'ACTIVE (Normal trading)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !platformConfig.tradingFrozen;
                    onUpdatePlatformConfig((p) => ({ ...p, tradingFrozen: next }));
                    onAddAuditLog('Trading Engine State Changed', 'trading', `Trading is now ${next ? 'FROZEN' : 'ACTIVE'}`);
                    showToast(`Trading is now ${next ? 'FROZEN' : 'ACTIVE'}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    platformConfig.tradingFrozen
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {platformConfig.tradingFrozen ? 'Unfreeze' : 'Freeze'}
                </button>
              </div>

              {/* Killswitch 2: Maintenance Mode */}
              <div className="p-4 rounded-2xl border bg-slate-900/30 flex items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>Maintenance Mode</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {platformConfig.maintenanceMode ? 'ACTIVE (Banner displayed)' : 'OFF (Normal service)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !platformConfig.maintenanceMode;
                    onUpdatePlatformConfig((p) => ({ ...p, maintenanceMode: next }));
                    onAddAuditLog('Maintenance Mode Toggled', 'system', `Maintenance is now ${next ? 'ACTIVE' : 'OFF'}`);
                    showToast(`Maintenance mode is now ${next ? 'ACTIVE' : 'OFF'}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    platformConfig.maintenanceMode
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-700/30 border-slate-600 text-slate-300'
                  }`}
                >
                  {platformConfig.maintenanceMode ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Killswitch 3: Airdrop Pool Freeze */}
              <div className="p-4 rounded-2xl border bg-slate-900/30 flex items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>100M Airdrop Claims</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {platformConfig.airdropFrozen ? 'PAUSED (Claims locked)' : 'OPEN (Users can claim free CPS)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !platformConfig.airdropFrozen;
                    onUpdatePlatformConfig((p) => ({ ...p, airdropFrozen: next }));
                    onAddAuditLog('Airdrop Claim State Toggled', 'airdrop', `Airdrop claims are now ${next ? 'PAUSED' : 'OPEN'}`);
                    showToast(`Airdrop claiming is now ${next ? 'PAUSED' : 'OPEN'}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    platformConfig.airdropFrozen
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {platformConfig.airdropFrozen ? 'Resume' : 'Pause'}
                </button>
              </div>

              {/* Killswitch 4: Auto Fluctuation Presence */}
              <div className="p-4 rounded-2xl border bg-slate-900/30 flex items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>Presence Auto-Ticker</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {autoFluctuate ? 'LIVE (Real-time network sync active)' : 'PAUSED (Static telemetry)'}
                  </p>
                </div>
                <button
                  onClick={onToggleAutoFluctuate}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    autoFluctuate
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-700/30 border-slate-600 text-slate-300'
                  }`}
                >
                  {autoFluctuate ? 'Pause' : 'Start'}
                </button>
              </div>

              {/* Killswitch 5: Enforce KYC for Trading */}
              <div className="p-4 rounded-2xl border bg-slate-900/30 flex items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>Mandatory KYC for Trades</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {platformConfig.enforceKycTrading ? 'ENFORCED (Unverified cannot trade)' : 'OPTIONAL (Anyone can trade)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !platformConfig.enforceKycTrading;
                    onUpdatePlatformConfig((p) => ({ ...p, enforceKycTrading: next }));
                    onAddAuditLog('KYC Trade Policy Changed', 'kyc', `Trading KYC enforcement set to ${next}`);
                    showToast(`KYC enforcement for trading: ${next ? 'ON' : 'OFF'}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    platformConfig.enforceKycTrading
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-700/30 border-slate-600 text-slate-300'
                  }`}
                >
                  {platformConfig.enforceKycTrading ? 'Disable' : 'Enforce'}
                </button>
              </div>

              {/* Killswitch 6: Mute Free Observers in Chat */}
              <div className="p-4 rounded-2xl border bg-slate-900/30 flex items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>Chat Observer Mute</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {platformConfig.chatMutedForObservers ? 'MUTED (Actuators only)' : 'PUBLIC (Everyone can chat)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !platformConfig.chatMutedForObservers;
                    onUpdatePlatformConfig((p) => ({ ...p, chatMutedForObservers: next }));
                    onAddAuditLog('Chat Permission Changed', 'chat', `Chat muted for free observers: ${next}`);
                    showToast(`Chat mute for free observers: ${next ? 'ON' : 'OFF'}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    platformConfig.chatMutedForObservers
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-slate-700/30 border-slate-600 text-slate-300'
                  }`}
                >
                  {platformConfig.chatMutedForObservers ? 'Unmute' : 'Mute Free'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Direct Token Minting / Liquidity Injection Box */}
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-4"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Coins className="w-5 h-5 text-sky-400" />
                  Direct Token Minting & Liquidity Injection
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Filter and locate any user or actuator wallet to directly grant CPS tokens and USD balance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authorized Treasury
                </span>
              </div>
            </div>

            {/* Recipient User Filter & Search Bar */}
            <div 
              className="p-3.5 rounded-2xl border space-y-2.5"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    Filter Users:
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {filteredMintRecipients.length} of {allUsersList.length} Accounts
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                  <button
                    type="button"
                    onClick={() => setMintUserTierFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      mintUserTierFilter === 'all'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'border text-slate-400 hover:text-white'
                    }`}
                    style={mintUserTierFilter !== 'all' ? { borderColor: 'var(--theme-border)' } : undefined}
                  >
                    All ({allUsersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMintUserTierFilter('actuator')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      mintUserTierFilter === 'actuator'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'border text-slate-400 hover:text-white'
                    }`}
                    style={mintUserTierFilter !== 'actuator' ? { borderColor: 'var(--theme-border)' } : undefined}
                  >
                    Actuators ({allUsersList.filter(u => u.tier !== 'free').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMintUserTierFilter('observer')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      mintUserTierFilter === 'observer'
                        ? 'bg-slate-300 text-slate-900 shadow-sm'
                        : 'border text-slate-400 hover:text-white'
                    }`}
                    style={mintUserTierFilter !== 'observer' ? { borderColor: 'var(--theme-border)' } : undefined}
                  >
                    Observers ({allUsersList.filter(u => u.tier === 'free').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMintUserTierFilter('admin')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      mintUserTierFilter === 'admin'
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'border text-slate-400 hover:text-white'
                    }`}
                    style={mintUserTierFilter !== 'admin' ? { borderColor: 'var(--theme-border)' } : undefined}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Search input + Fast Reset / Select Myself */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mintUserSearch}
                    onChange={(e) => setMintUserSearch(e.target.value)}
                    placeholder="Search recipient by name, @handle, or 15-digit UID..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none focus:border-sky-500"
                    style={{
                      backgroundColor: 'var(--theme-card)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                  />
                  {mintUserSearch && (
                    <button
                      type="button"
                      onClick={() => setMintUserSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMintTargetId('me');
                    setMintUserSearch('');
                    setMintUserTierFilter('all');
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold hover:border-sky-400 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                >
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Select Master Admin</span>
                </button>
              </div>
            </div>

            {/* Main Injection Input Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
                    Recipient User / Wallet
                  </label>
                  <span className="text-[10px] text-sky-400 font-mono">
                    {filteredMintRecipients.length} found
                  </span>
                </div>

                {filteredMintRecipients.length > 0 ? (
                  <select
                    value={mintTargetId}
                    onChange={(e) => setMintTargetId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none focus:border-sky-500 cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                  >
                    {filteredMintRecipients.map((m) => (
                      <option key={m.id} value={m.isCurrentLoggedInUser ? 'me' : m.id}>
                        {m.name} ({m.handle}) • UID: {m.uniqueId} • {m.isCurrentLoggedInUser ? 'MASTER ADMIN' : (m.tier === 'free' ? 'OBSERVER' : 'ACTUATOR')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl border text-xs text-rose-400 border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-2">
                    <span className="text-[11px]">No users match current filters</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMintUserSearch('');
                        setMintUserTierFilter('all');
                      }}
                      className="underline font-bold text-[11px] text-rose-300 hover:text-white"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
                    CPS Tokens to Mint
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">
                    +{(mintAmount / 1_000_000).toFixed(2)}M CPS
                  </span>
                </div>
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-xl border text-xs font-mono font-bold outline-none focus:border-sky-500"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                  placeholder="e.g. 5000000"
                />
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {[1000000, 5000000, 10000000, 50000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setMintAmount(amt)}
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-all ${
                        mintAmount === amt
                          ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      +{amt / 1000000}M
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
                    USD Cash to Inject ($)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ${mintUsdAmount.toFixed(2)} USD
                  </span>
                </div>
                <input
                  type="number"
                  value={mintUsdAmount}
                  onChange={(e) => setMintUsdAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-xl border text-xs font-mono font-bold outline-none focus:border-sky-500"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                  placeholder="e.g. 100.00"
                />
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {[25, 50, 100, 500, 1000].map((usd) => (
                    <button
                      key={usd}
                      type="button"
                      onClick={() => setMintUsdAmount(usd)}
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-all ${
                        mintUsdAmount === usd
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      +${usd}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Recipient Card & Real-Time Balance Preview */}
            {selectedMintRecipient && (
              <div 
                className="p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img 
                      src={selectedMintRecipient.avatar} 
                      alt={selectedMintRecipient.name} 
                      className="w-10 h-10 rounded-xl object-cover border border-sky-400/30"
                    />
                    <span 
                      className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-slate-900 ${
                        selectedMintRecipient.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                        {selectedMintRecipient.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                        {selectedMintRecipient.handle}
                      </span>
                      <span className="font-mono text-[10px] text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.2 rounded">
                        UID: {selectedMintRecipient.uniqueId}
                      </span>
                      {selectedMintRecipient.isCurrentLoggedInUser ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          MASTER ADMIN
                        </span>
                      ) : selectedMintRecipient.tier !== 'free' ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ACTUATOR ({selectedMintRecipient.tier === 'verified_yearly' ? 'YEARLY' : 'MONTHLY'})
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-300 border border-slate-600">
                          OBSERVER
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] flex-wrap" style={{ color: 'var(--theme-text-muted)' }}>
                      <span>Current Tokens: <strong className="font-mono text-white">{selectedMintRecipient.tokensHeld.toLocaleString()} CPS</strong></span>
                      {selectedMintRecipient.isCurrentLoggedInUser && (
                        <span>USD Cash: <strong className="font-mono text-emerald-400">${selectedMintRecipient.usdCashBalance.toFixed(2)}</strong></span>
                      )}
                      <span className="text-sky-400 font-medium">
                        → Projected after grant: <strong className="font-mono text-sky-300">{(selectedMintRecipient.tokensHeld + mintAmount).toLocaleString()} CPS</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteMint}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 hover:scale-102 active:scale-98 transition-all shrink-0"
                >
                  <Coins className="w-4 h-4" />
                  <span>Execute Mint & Disburse Liquidity</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: GLOBAL GEO HEATMAP (IP TELEMETRY)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'heatmap' && (
        <div className="animate-in fade-in duration-200">
          <AdminGeoHeatmap
            activeVerifiedCount={activeVerifiedCount}
            freeOnlineCount={freeOnlineCount}
            currentPrice={currentPrice}
            userRole={user.tier}
            userCountry={user.kyc?.country || user.location}
            userCountryCode={user.kyc?.countryCode || user.countryCode}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: DYNAMIC PRICING ENGINE (VALUE PER ACTUATOR)                          */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-6"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            {/* Header & Core Formula Callout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Sliders className="w-6 h-6 text-sky-400" />
                  Dynamic Price Engine: Value Per Actuator
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                  Configure the exact monetary appreciation added per online Actuator who transmits presence.
                </p>
              </div>

              <div 
                className="p-3 rounded-2xl border flex items-center gap-3 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
                  borderColor: 'rgba(14, 165, 233, 0.3)'
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-bold">
                  $
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
                    Engine Formula
                  </div>
                  <div className="text-xs font-mono font-black text-white">
                    Price = Active Actuators × Value Per Actuator
                  </div>
                </div>
              </div>
            </div>

            {/* Input Field: Set Value Per Actuator */}
            <div 
              className="p-5 rounded-2xl border space-y-4"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                    <span>Value Per Actuator (USD Multiplier)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Live Parameter
                    </span>
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    Input the exact dollar amount added for every Actuator online. E.g. <code className="text-sky-300">0.0000001</code>, <code className="text-sky-300">0.0001</code>, <code className="text-sky-300">0.01</code>, or <code className="text-sky-300">1.00</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-black text-sky-400">$</span>
                    <input
                      type="text"
                      value={valuePerActuatorInput}
                      onChange={(e) => setValuePerActuatorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveValuePerActuator();
                        }
                      }}
                      placeholder="0.0000001"
                      className="w-48 pl-7 pr-3 py-2.5 rounded-xl border text-sm font-mono font-extrabold outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveValuePerActuator()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-md shadow-sky-500/25 flex items-center gap-2 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Value</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
                  Quick Step Presets:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: '$0.0000001 (1e-7 Default)', val: 0.0000001 },
                    { label: '$0.0000010 (10x Boost)', val: 0.000001 },
                    { label: '$0.0000100 (100x Boost)', val: 0.00001 },
                    { label: '$0.0001000 ($1 / 10k Users)', val: 0.0001 },
                    { label: '$0.0010000 ($1 / 1k Users)', val: 0.001 },
                    { label: '$0.0100000 ($1 / 100 Users)', val: 0.01 },
                    { label: '$0.1000000 ($1 / 10 Users)', val: 0.1 },
                    { label: '$1.0000000 ($1 / Actuator)', val: 1.0 },
                  ].map((preset) => {
                    const isCurrent = Number(platformConfig.stepMultiplierUsd) === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => handleSaveValuePerActuator(preset.val)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-mono font-bold transition-all flex items-center gap-1.5 ${
                          isCurrent
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-sm'
                            : 'hover:border-sky-400 text-slate-300 hover:text-white'
                        }`}
                        style={{
                          backgroundColor: isCurrent ? undefined : 'var(--theme-card)',
                          borderColor: isCurrent ? undefined : 'var(--theme-border)',
                        }}
                      >
                        {isCurrent && <Check className="w-3 h-3 text-sky-400" />}
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Interactive Calculation & Projection Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: Current Price Calculation Card */}
              <div 
                className="p-5 rounded-2xl border space-y-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(14, 165, 233, 0.06) 100%)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Dynamic Price
                  </span>
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>

                <div className="text-3xl font-black font-mono text-emerald-300">
                  {formatCryptoPrice(currentPrice)}
                </div>

                <div className="space-y-2 text-xs font-mono pt-2 border-t border-emerald-500/20">
                  <div className="flex justify-between text-slate-300">
                    <span>Active Actuators:</span>
                    <span className="font-bold text-white">{activeVerifiedCount} users</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Value / Actuator:</span>
                    <span className="font-bold text-sky-400">${platformConfig.stepMultiplierUsd}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Active Observers:</span>
                    <span className="font-bold text-slate-400">{freeOnlineCount} (0 weight)</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 pt-1 border-t border-emerald-500/20 font-bold">
                    <span>Calculation:</span>
                    <span>{activeVerifiedCount} × ${platformConfig.stepMultiplierUsd}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  🔒 Observers contribute <strong>$0.00</strong> to the price. Only authenticated Actuators who turn ON the "Drive the price" button transmit presence to move the price.
                </p>
              </div>

              {/* Center & Right Column: Growth & Scale Projection Matrix */}
              <div 
                className="lg:col-span-2 p-5 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    Scale & Growth Projection Matrix
                  </h4>
                  <span className="text-xs font-mono text-sky-400 font-semibold">
                    Based on ${platformConfig.stepMultiplierUsd} / Actuator
                  </span>
                </div>

                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  This table shows the exact resulting price as community adoption scales under your current multiplier:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { nodes: 10, label: '10 Actuators' },
                    { nodes: 100, label: '100 Actuators' },
                    { nodes: 1000, label: '1,000 Actuators' },
                    { nodes: 10000, label: '10,000 Actuators' },
                    { nodes: 100000, label: '100,000 Actuators' },
                    { nodes: 500000, label: '500,000 Actuators' },
                    { nodes: 1000000, label: '1,000,000 Actuators' },
                    { nodes: 10000000, label: '10,000,000 Actuators' },
                  ].map((row) => {
                    const projected = row.nodes * (platformConfig.stepMultiplierUsd || BASE_PRICE);
                    return (
                      <div
                        key={row.nodes}
                        className="p-2.5 rounded-xl border flex flex-col justify-between"
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.4)',
                          borderColor: 'var(--theme-border)',
                        }}
                      >
                        <span className="text-[11px] font-mono text-slate-400">{row.label}</span>
                        <span className="text-xs font-black font-mono text-emerald-400 mt-1 truncate">
                          {formatCryptoPrice(projected)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Actuators Count Simulation Override */}
            <div 
              className="p-5 rounded-2xl border space-y-3"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                    <Users className="w-4 h-4 text-emerald-400" />
                    Simulate Active Online Actuators Count
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    Test how the dynamic price behaves when the number of online Actuators increases or decreases.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {manualActuatorsInput} Actuators
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyActuatorsOverride}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                  >
                    Apply Online Count
                  </button>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="1000"
                value={manualActuatorsInput}
                onChange={(e) => setManualActuatorsInput(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
                <span>1 Actuator</span>
                <span className="text-sky-400 font-bold">
                  Simulated Price: {formatCryptoPrice(manualActuatorsInput * (platformConfig.stepMultiplierUsd || BASE_PRICE))}
                </span>
                <span>1,000 Actuators</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-4"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Users className="w-5 h-5 text-indigo-400" />
                  Community Member Registry & Balances
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Manage individual user tokens, cash balances, online presence, tiers, and administrative rights
                </p>
              </div>

              <button
                onClick={() => setIsAddingMember(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Admin User Impersonation Hub */}
            <div 
              id="admin-impersonation-hub"
              className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
                borderColor: 'rgba(168, 85, 247, 0.3)',
              }}
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-purple-200">
                      User Impersonation Engine
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                      Admin Privilege
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/80">
                    Log in and test the platform from any user's perspective. Inspect their wallet, trade shares, view referral downlines, and verify experiences.
                  </p>
                </div>
              </div>

              {/* Quick Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  id="admin-quick-impersonate-select"
                  className="bg-slate-900/90 text-purple-200 border border-purple-500/40 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                  defaultValue=""
                  onChange={(e) => {
                    const target = members.find((m) => m.id === e.target.value);
                    if (target && onImpersonateUser) {
                      onImpersonateUser(target);
                    }
                  }}
                >
                  <option value="" disabled>Select a user to impersonate...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.handle}) - {m.tier !== 'free' ? 'Actuator' : 'Observer'}
                    </option>
                  ))}
                </select>

                {impersonatingAdmin && onExitImpersonation && (
                  <button
                    onClick={onExitImpersonation}
                    className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, handle, or unique ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none focus:border-sky-500"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                />
              </div>

              <div>
                <select
                  value={userTierFilter}
                  onChange={(e) => setUserTierFilter(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                >
                  <option value="all">All Tiers ({allUsersList.length})</option>
                  <option value="verified_monthly">Actuator Monthly ($1/mo)</option>
                  <option value="verified_yearly">Actuator Yearly ($10/yr)</option>
                  <option value="free">Observer (Free)</option>
                </select>
              </div>

              <div>
                <select
                  value={userKycFilter}
                  onChange={(e) => setUserKycFilter(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                >
                  <option value="all">All KYC Statuses</option>
                  <option value="verified">KYC Verified</option>
                  <option value="pending">KYC Pending Audit</option>
                  <option value="unverified">KYC Unverified</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border rounded-2xl" style={{ borderColor: 'var(--theme-border)' }}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-slate-900/40 text-slate-400 font-bold" style={{ borderColor: 'var(--theme-border)' }}>
                    <th className="p-3">User / Identity</th>
                    <th className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>Sign Up Date</span>
                      </div>
                    </th>
                    <th className="p-3">Tier Status</th>
                    <th className="p-3">KYC Status</th>
                    <th className="p-3">CPS Holdings</th>
                    <th className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ads Watched</span>
                      </div>
                    </th>
                    <th className="p-3">Online</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                  {filteredUsers.map((u) => {
                    const isUserVerified = u.tier !== 'free';
                    const kycStatus = u.kyc?.status || 'unverified';
                    return (
                      <tr 
                        key={u.id}
                        className="hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                                {u.name}
                                {u.isAdmin && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                                    ADMIN
                                  </span>
                                )}
                                {u.isCurrentLoggedInUser && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {u.handle} • ID: {u.uniqueId.slice(0, 7)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.signUpDate}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isUserVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700/40 text-slate-400'
                          }`}>
                            {u.tier === 'verified_yearly' ? 'Actuator Yearly' : u.tier === 'verified_monthly' ? 'Actuator $1/mo' : 'Observer'}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            kycStatus === 'verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : kycStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-700/40 text-slate-400'
                          }`}>
                            {kycStatus.toUpperCase()}
                          </span>
                        </td>

                        <td className="p-3 font-mono font-bold text-sky-400">
                          {(u.tokensHeld).toLocaleString()} CPS
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono text-xs font-bold">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>{u.adsWatchedCount ?? 0}</span>
                            <span className="text-[10px] text-amber-400/60 font-normal">ads</span>
                          </span>
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            u.isOnline ? 'text-emerald-400' : 'text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            {u.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>

                        <td className="p-3 text-right space-x-1">
                          {/* Toggle Online */}
                          <button
                            onClick={() => {
                              if (u.isCurrentLoggedInUser) {
                                onUpdateUser((p) => ({ ...p, isOnline: !p.isOnline }));
                              } else {
                                onUpdateMembers((p) =>
                                  p.map((m) => m.id === u.id ? { ...m, isOnline: !m.isOnline } : m)
                                );
                              }
                              showToast(`Presence toggled for ${u.name}`);
                            }}
                            className="p-1.5 rounded-lg border hover:border-sky-500 text-slate-400 hover:text-white transition-all text-xs"
                            title="Toggle Online/Offline"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Mint Shares to this user */}
                          <button
                            onClick={() => {
                              setMintTargetId(u.id);
                              setActiveTab('overview');
                              showToast(`Selected ${u.name} for Treasury Minting`);
                            }}
                            className="p-1.5 rounded-lg border hover:border-emerald-500 text-emerald-400 transition-all text-xs"
                            title="Mint Shares to this user"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>

                          {/* View Referral Downline Team */}
                          <button
                            onClick={() => {
                              setSelectedReferralSponsorFilter(u.id);
                              setActiveTab('referrals');
                              showToast(`Viewing ${u.name}'s referral team`);
                            }}
                            className="p-1.5 rounded-lg border hover:border-sky-500 text-sky-400 hover:bg-sky-500/10 transition-all text-xs"
                            title={`Inspect ${u.name}'s Referral Downline Team`}
                          >
                            <Network className="w-3.5 h-3.5" />
                          </button>

                          {/* Impersonate User Account */}
                          {!u.isCurrentLoggedInUser && onImpersonateUser && (
                            <button
                              onClick={() => {
                                const found = members.find((m) => m.id === u.id);
                                if (found) onImpersonateUser(found);
                              }}
                              className="px-2 py-1 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 font-bold transition-all text-xs flex items-center gap-1 shadow-sm active:scale-95"
                              title={`Impersonate ${u.name} (Log in as this user)`}
                            >
                              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                              <span className="hidden xl:inline text-[11px]">Impersonate</span>
                            </button>
                          )}

                          {/* Edit Member Details */}
                          {!u.isCurrentLoggedInUser && (
                            <button
                              onClick={() => {
                                const found = members.find((m) => m.id === u.id);
                                if (found) setEditingMember(found);
                              }}
                              className="p-1.5 rounded-lg border hover:border-indigo-500 text-indigo-300 transition-all text-xs"
                              title="Edit Member Parameters"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Member */}
                          {!u.isCurrentLoggedInUser && (
                            <button
                              onClick={() => handleDeleteMember(u.id, u.name)}
                              className="p-1.5 rounded-lg border hover:border-rose-500 text-rose-400 transition-all text-xs"
                              title="Delete Member from Network"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Member Modal */}
          {editingMember && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div 
                className="w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl"
                style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                    Edit Member Profile: {editingMember.name}
                  </h3>
                  <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-white">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="w-full p-2 rounded-xl border text-xs"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Handle</label>
                    <input
                      type="text"
                      value={editingMember.handle}
                      onChange={(e) => setEditingMember({ ...editingMember, handle: e.target.value })}
                      className="w-full p-2 rounded-xl border text-xs"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Membership Tier</label>
                    <select
                      value={editingMember.tier}
                      onChange={(e) => setEditingMember({ ...editingMember, tier: e.target.value as UserTier })}
                      className="w-full p-2 rounded-xl border text-xs"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    >
                      <option value="free">Observer (Free)</option>
                      <option value="verified_monthly">Actuator Monthly ($1/mo)</option>
                      <option value="verified_yearly">Actuator Yearly ($10/yr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">CPS Tokens Held</label>
                    <input
                      type="number"
                      value={editingMember.tokensHeld}
                      onChange={(e) => setEditingMember({ ...editingMember, tokensHeld: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border text-xs font-mono"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Location Hub</label>
                    <input
                      type="text"
                      value={editingMember.location || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                      className="w-full p-2 rounded-xl border text-xs"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Sign Up Date</label>
                    <input
                      type="date"
                      value={editingMember.signUpDate || editingMember.verifiedSince || '2026-01-15'}
                      onChange={(e) => setEditingMember({ ...editingMember, signUpDate: e.target.value })}
                      className="w-full p-2 rounded-xl border text-xs font-mono"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-semibold"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMemberEdit}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Member Modal */}
          {isAddingMember && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form 
                onSubmit={handleAddNewMember}
                className="w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl"
                style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                    Add New Community Member
                  </h3>
                  <button type="button" onClick={() => setIsAddingMember(false)} className="text-slate-400 hover:text-white">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.name}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border text-xs"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                      placeholder="e.g. Satoshi Nakamoto"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Network Handle</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.handle}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, handle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border text-xs font-mono"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                      placeholder="@satoshi"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Initial Tier</label>
                    <select
                      value={newMemberForm.tier}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, tier: e.target.value as UserTier })}
                      className="w-full p-2.5 rounded-xl border text-xs"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    >
                      <option value="verified_monthly">Actuator Monthly ($1/mo)</option>
                      <option value="verified_yearly">Actuator Yearly ($10/yr)</option>
                      <option value="free">Observer (Free)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Initial CPS Tokens</label>
                    <input
                      type="number"
                      value={newMemberForm.tokensHeld}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, tokensHeld: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border text-xs font-mono"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Location</label>
                    <input
                      type="text"
                      value={newMemberForm.location}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, location: e.target.value })}
                      className="w-full p-2.5 rounded-xl border text-xs"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Sign Up Date</label>
                    <input
                      type="date"
                      value={newMemberForm.signUpDate}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, signUpDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border text-xs font-mono"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingMember(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-semibold"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                  >
                    Register Member
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: 16-DIGIT ACTUATOR CARDS GENERATOR & MANAGEMENT                        */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <AdminCardsTab
          cards={actuatorCards}
          members={members}
          currentUser={user}
          onUpdateCards={onUpdateActuatorCards || (() => {})}
          onAddAuditLog={onAddAuditLog}
          onDirectActivateCard={onDirectActivateCard}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: USER REFERRAL TEAMS & LEAD MONETIZATION                              */}
      {/* ========================================================================= */}
      {activeTab === 'referrals' && (
        <AdminReferralsTab
          user={user}
          members={members}
          referrals={referrals}
          transactions={transactions}
          currentPrice={currentPrice}
          initialSponsorFilter={selectedReferralSponsorFilter}
          onUpdateReferrals={onUpdateReferrals}
          onUpdateUser={onUpdateUser}
          onUpdateMembers={onUpdateMembers}
          onUpdateTransactions={onUpdateTransactions}
          onAddAuditLog={onAddAuditLog}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KYC VERIFICATION & COMPLIANCE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'kyc' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-5"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  KYC Verification & Identity Auditing Center
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Audit submitted WhatsApp numbers, verified emails, government IDs (Passport/DL), and camera face biometric selfies
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyAllPendingKyc}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify All Pending</span>
                </button>
                <button
                  onClick={onOpenKycModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-xs font-bold transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Test KYC Modal</span>
                </button>
              </div>
            </div>

            {/* KYC Policy Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border bg-slate-900/30" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    Require KYC for Spot Trading
                  </span>
                  <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Block unverified accounts from buying or selling CPS tokens
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !platformConfig.enforceKycTrading;
                    onUpdatePlatformConfig((p) => ({ ...p, enforceKycTrading: next }));
                    showToast(`Trading KYC requirement set to ${next}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    platformConfig.enforceKycTrading
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {platformConfig.enforceKycTrading ? 'Enforced' : 'Optional'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    Require KYC for 100M Airdrop Claiming
                  </span>
                  <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Users must pass WhatsApp, Email & Face Camera to claim airdrop
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !platformConfig.enforceKycAirdrop;
                    onUpdatePlatformConfig((p) => ({ ...p, enforceKycAirdrop: next }));
                    showToast(`Airdrop KYC requirement set to ${next}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    platformConfig.enforceKycAirdrop
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {platformConfig.enforceKycAirdrop ? 'Enforced' : 'Optional'}
                </button>
              </div>
            </div>

            {/* KYC Submission Queue */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Member KYC Verification Queue
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allUsersList.map((u) => {
                  const kyc = u.kyc;
                  const status = kyc?.status || 'unverified';
                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl border space-y-3 transition-all hover:border-sky-500/50"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                              {u.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">{u.handle}</div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {status.toUpperCase()}
                        </span>
                      </div>

                      {/* Details preview */}
                      <div className="text-[11px] space-y-1 pt-1 border-t" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                        <div><span className="text-slate-500 font-medium">WhatsApp:</span> {kyc?.whatsapp || 'Not submitted'}</div>
                        <div><span className="text-slate-500 font-medium">Email:</span> {kyc?.email || 'None'}</div>
                        <div>
                          <span className="text-slate-500 font-medium">ID Document:</span> {kyc?.docType ? `${kyc.docType.toUpperCase()} (${kyc.docNumber || 'No #'}` : 'None'}
                        </div>
                        {kyc?.facePhotoUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-slate-500 font-medium">Biometric:</span>
                            <span className="text-emerald-400 flex items-center gap-1 font-bold text-[10px]">
                              <Camera className="w-3 h-3" /> Face Selfie Attached
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-2">
                        {status !== 'verified' ? (
                          <button
                            onClick={() => handleApproveKyc(u.id, u.name)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                          >
                            Approve KYC
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRejectKyc(u.id, u.name, 'Admin revoked verification')}
                            className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
                          >
                            Revoke Status
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedKycReview({
                            id: u.id,
                            name: u.name,
                            handle: u.handle,
                            avatar: u.avatar,
                            kyc: u.kyc,
                          })}
                          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:border-sky-500 transition-all"
                          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                          title="Inspect full documents & selfie"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KYC Inspection Drawer/Modal */}
          {selectedKycReview && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div 
                className="w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl"
                style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedKycReview.avatar}
                      alt={selectedKycReview.name}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div>
                      <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                        {selectedKycReview.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">{selectedKycReview.handle}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedKycReview(null)} className="text-slate-400 hover:text-white">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl border bg-slate-900/40 space-y-1.5" style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="font-bold text-sky-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Identity Document Proof
                    </div>
                    <div><span className="text-slate-400">Document Type:</span> {selectedKycReview.kyc?.docType?.toUpperCase() || 'PASSPORT'}</div>
                    <div><span className="text-slate-400">Document ID Number:</span> {selectedKycReview.kyc?.docNumber || 'CH-9812498'}</div>
                    <div><span className="text-slate-400">WhatsApp:</span> {selectedKycReview.kyc?.whatsapp || 'Not provided'}</div>
                    <div><span className="text-slate-400">Email:</span> {selectedKycReview.kyc?.email || 'None'}</div>
                  </div>

                  {/* Face Selfie Camera Image */}
                  <div className="p-3 rounded-xl border bg-slate-900/40 space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4" /> Live Camera Biometric Selfie
                    </div>
                    <div className="flex justify-center p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      <img
                        src={selectedKycReview.kyc?.facePhotoUrl || selectedKycReview.avatar}
                        alt="Face Selfie"
                        className="w-36 h-36 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xl"
                      />
                    </div>
                    <p className="text-[10px] text-center text-slate-400">
                      Liveness Verified • Device Camera Feed Authenticated
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleRejectKyc(selectedKycReview.id, selectedKycReview.name, 'Admin inspection rejection')}
                    className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-bold"
                  >
                    Reject Submission
                  </button>
                  <button
                    onClick={() => handleApproveKyc(selectedKycReview.id, selectedKycReview.name)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    Confirm & Approve KYC
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 100,000,000 CPS AIRDROP POOL MANAGER                               */}
      {/* ========================================================================= */}
      {activeTab === 'airdrop' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-6"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Flame className="w-5 h-5 text-amber-400" />
                  100,000,000 CPS Free Airdrop Pool Engine
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Manage pool allocation limits, referral reward share rates, claim lockouts, and target launch benchmarks
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Target: $1.00 - $5.00 / Share
              </span>
            </div>

            {/* Distribution Progress */}
            <div className="p-4 rounded-2xl border bg-slate-900/30 space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-amber-300">Distributed: {platformConfig.airdropClaimed.toLocaleString()} CPS</span>
                <span className="text-slate-400">Total Cap: {platformConfig.airdropTotalPool.toLocaleString()} CPS</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-rose-500 to-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((platformConfig.airdropClaimed / platformConfig.airdropTotalPool) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                <span>Remaining in Pool: {(platformConfig.airdropTotalPool - platformConfig.airdropClaimed).toLocaleString()} CPS</span>
                <span>Claimed: {((platformConfig.airdropClaimed / platformConfig.airdropTotalPool) * 100).toFixed(2)}%</span>
              </div>
            </div>

            {/* Configuration Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                <label className="text-xs font-bold block" style={{ color: 'var(--theme-text-primary)' }}>
                  Total Pool Size (CPS)
                </label>
                <input
                  type="number"
                  value={platformConfig.airdropTotalPool}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdatePlatformConfig((p) => ({ ...p, airdropTotalPool: val }));
                  }}
                  className="w-full p-2 rounded-xl border text-xs font-mono font-bold"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
              </div>

              <div className="p-4 rounded-2xl border space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                <label className="text-xs font-bold block" style={{ color: 'var(--theme-text-primary)' }}>
                  Shares to Inviter (Sponsor)
                </label>
                <input
                  type="number"
                  value={platformConfig.referralSponsorReward}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdatePlatformConfig((p) => ({ ...p, referralSponsorReward: val }));
                  }}
                  className="w-full p-2 rounded-xl border text-xs font-mono font-bold"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Default: 1 share to inviter</p>
              </div>

              <div className="p-4 rounded-2xl border space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                <label className="text-xs font-bold block" style={{ color: 'var(--theme-text-primary)' }}>
                  Shares to Invitee (New User)
                </label>
                <input
                  type="number"
                  value={platformConfig.referralInviteeReward}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdatePlatformConfig((p) => ({ ...p, referralInviteeReward: val }));
                  }}
                  className="w-full p-2 rounded-xl border text-xs font-mono font-bold"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Default: 1 share to new user</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LEDGER & TRADING ENGINE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-4"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Financial Ledger & Spot Trade Manager
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Inspect all platform buys, sells, subscriptions, dividends, and transfer transactions
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onUpdateTransactions(() => []);
                    onAddAuditLog('Ledger Purged', 'trading', 'Admin cleared transaction ledger history');
                    showToast('Ledger cleared');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/10 transition-all"
                >
                  Clear Ledger
                </button>
              </div>
            </div>

            {/* Trading Policy Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border bg-slate-900/30" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                  Platform Trading Fee (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={platformConfig.tradingFeePercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdatePlatformConfig((p) => ({ ...p, tradingFeePercent: val }));
                  }}
                  className="w-full p-2 rounded-xl border text-xs font-mono font-bold"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
                <span className="text-[10px] text-slate-400">Current: {platformConfig.tradingFeePercent}%</span>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                  Min Spot Trade ($ USD)
                </label>
                <input
                  type="number"
                  value={platformConfig.minTradeUsd}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdatePlatformConfig((p) => ({ ...p, minTradeUsd: val }));
                  }}
                  className="w-full p-2 rounded-xl border text-xs font-mono font-bold"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                  Max Spot Trade ($ USD)
                </label>
                <input
                  type="number"
                  value={platformConfig.maxTradeUsd}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdatePlatformConfig((p) => ({ ...p, maxTradeUsd: val }));
                  }}
                  className="w-full p-2 rounded-xl border text-xs font-mono font-bold"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto border rounded-2xl" style={{ borderColor: 'var(--theme-border)' }}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-slate-900/40 text-slate-400 font-bold" style={{ borderColor: 'var(--theme-border)' }}>
                    <th className="p-3">Tx Hash</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Tokens</th>
                    <th className="p-3">USD Value</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 font-mono text-sky-400">
                        {tx.txHash}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                          tx.type === 'buy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : tx.type === 'sell'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {tx.tokenAmount > 0 ? tx.tokenAmount.toLocaleString() : '-'} CPS
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        ${tx.usdTotal.toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            onUpdateTransactions((prev) => prev.filter((t) => t.id !== tx.id));
                            showToast(`Deleted transaction ${tx.txHash}`);
                          }}
                          className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-all"
                          title="Delete transaction record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ANNOUNCEMENTS & CHAT MODERATION                                    */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-6"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Announcements & Community Chat Moderation
              </h3>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Broadcast platform-wide system alerts or dispatch official [ADMIN] messages to the community room
              </p>
            </div>

            {/* Global Sticky Banner Configuration */}
            <div className="p-4 rounded-2xl border bg-slate-900/30 space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Platform Global Sticky Announcement Banner
                </span>
                <button
                  onClick={() => {
                    const next = !platformConfig.globalAnnouncementActive;
                    onUpdatePlatformConfig((p) => ({ ...p, globalAnnouncementActive: next }));
                    showToast(`Global banner set to ${next ? 'ACTIVE' : 'HIDDEN'}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    platformConfig.globalAnnouncementActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {platformConfig.globalAnnouncementActive ? 'Visible to All Users' : 'Hidden'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={platformConfig.globalAnnouncement}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdatePlatformConfig((p) => ({ ...p, globalAnnouncement: val }));
                  }}
                  className="w-full p-2.5 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                  placeholder="Enter platform wide announcement..."
                />
                <select
                  value={platformConfig.globalAnnouncementType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    onUpdatePlatformConfig((p) => ({ ...p, globalAnnouncementType: val }));
                  }}
                  className="p-2.5 rounded-xl border text-xs font-semibold shrink-0"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="critical">Critical (Red)</option>
                  <option value="success">Success (Green)</option>
                </select>
              </div>
            </div>

            {/* Official Admin Chat Broadcast */}
            <form onSubmit={handleSendBroadcast} className="p-4 rounded-2xl border space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Dispatch Official [SYSTEM / ADMIN] Chat Message
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={adminBroadcastText}
                  onChange={(e) => setAdminBroadcastText(e.target.value)}
                  placeholder="Broadcast official update to community chat..."
                  className="w-full p-2.5 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-sky-500 text-slate-950 font-bold text-xs shrink-0 hover:scale-102 transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast</span>
                </button>
              </div>
            </form>

            {/* Live Chat Moderation List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Messages ({chatMessages.length})
                </span>
                <button
                  onClick={() => {
                    onUpdateChatMessages(() => []);
                    showToast('Chat history cleared');
                  }}
                  className="text-xs text-rose-400 hover:underline font-bold"
                >
                  Clear All Messages
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs"
                    style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover border"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{msg.senderHandle}</span>
                          <span className="text-[10px] text-slate-500">• {msg.timestamp}</span>
                          {msg.isAdmin && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-slate-300">{msg.message}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onUpdateChatMessages((prev) => prev.filter((m) => m.id !== msg.id));
                        showToast('Message deleted');
                      }}
                      className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-all shrink-0"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: GOOGLE ADMOB ADS & AD UNITS CONFIGURATION                            */}
      {/* ========================================================================= */}
      {activeTab === 'admob' && (
        <div className="animate-in fade-in duration-200">
          <AdminAdMobTab
            platformConfig={platformConfig}
            onUpdatePlatformConfig={onUpdatePlatformConfig}
            onAddAuditLog={onAddAuditLog}
            onTriggerTestAd={onTriggerTestAd}
            allUsers={allUsersList}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: AUDIT TRAIL & SYSTEM LOGS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-4"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                  <Terminal className="w-5 h-5 text-sky-400" />
                  Immutable Administrative Audit Trail
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Verifiable ledger of all policy updates, KYC approvals, token mints, and system overrides
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                {auditLogs.length} Records
              </span>
            </div>

            <div className="space-y-2 pt-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      log.category === 'pricing'
                        ? 'bg-sky-500/20 text-sky-300'
                        : log.category === 'kyc'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.category === 'trading'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {log.category}
                    </span>
                    <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                      {log.action}
                    </span>
                    <span className="text-slate-400 hidden md:inline">— {log.details}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {log.adminHandle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
