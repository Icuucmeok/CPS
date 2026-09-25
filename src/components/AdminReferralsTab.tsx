import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  DollarSign,
  Search,
  Filter,
  ShoppingCart,
  Tag,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  TrendingUp,
  FileText,
  Camera,
  Mail,
  Phone,
  UserCheck,
  UserX,
  ExternalLink,
  Award,
  Sparkles,
  Layers,
  Percent
} from 'lucide-react';
import { 
  UserProfile, 
  CommunityMember, 
  ReferralRecord, 
  Transaction, 
  AdminAuditLog, 
  UserTier, 
  KycStatus, 
  KycData 
} from '../types';
import { formatCryptoPrice } from '../utils/pricingEngine';

interface AdminReferralsTabProps {
  user: UserProfile;
  members: CommunityMember[];
  referrals: ReferralRecord[];
  transactions: Transaction[];
  currentPrice: number;
  initialSponsorFilter?: string;
  onUpdateReferrals: (updater: (prev: ReferralRecord[]) => ReferralRecord[]) => void;
  onUpdateUser: (updater: (prev: UserProfile) => UserProfile) => void;
  onUpdateMembers: (updater: (prev: CommunityMember[]) => CommunityMember[]) => void;
  onUpdateTransactions: (updater: (prev: Transaction[]) => Transaction[]) => void;
  onAddAuditLog: (action: string, category: AdminAuditLog['category'], details: string) => void;
  showToast: (msg: string) => void;
}

export const AdminReferralsTab: React.FC<AdminReferralsTabProps> = ({
  user,
  members,
  referrals,
  transactions,
  currentPrice,
  initialSponsorFilter = 'all',
  onUpdateReferrals,
  onUpdateUser,
  onUpdateMembers,
  onUpdateTransactions,
  onAddAuditLog,
  showToast,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sponsorFilter, setSponsorFilter] = useState<string>(initialSponsorFilter);
  const [kycFilter, setKycFilter] = useState<'all' | KycStatus>('all');
  const [saleFilter, setSaleFilter] = useState<'all' | 'sold' | 'available'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | UserTier>('all');

  // Modals state
  const [selectedKycReferral, setSelectedKycReferral] = useState<ReferralRecord | null>(null);
  
  // Selling Referral Modal state
  const [sellingReferral, setSellingReferral] = useState<ReferralRecord | null>(null);
  const [salePriceInput, setSalePriceInput] = useState<number>(25);
  const [saleBuyerId, setSaleBuyerId] = useState<string>('mem_02'); // Default to Marcus Chen or another member
  const [transferLineageOnSale, setTransferLineageOnSale] = useState<boolean>(true);
  const [creditOriginalSponsor, setCreditOriginalSponsor] = useState<boolean>(false);
  const [saleNotesInput, setSaleNotesInput] = useState<string>('Verified Actuator Lead sold by Master Admin');

  // Transfer Lineage Modal state
  const [transferringReferral, setTransferringReferral] = useState<ReferralRecord | null>(null);
  const [newSponsorTargetId, setNewSponsorTargetId] = useState<string>('usr_me_001');

  // Add Referral Modal state
  const [isAddingReferral, setIsAddingReferral] = useState<boolean>(false);
  const [newRefForm, setNewRefForm] = useState<{
    sponsorId: string;
    userName: string;
    userHandle: string;
    tier: UserTier;
    kycStatus: KycStatus;
    whatsapp: string;
    email: string;
    docType: 'passport' | 'driving_license' | 'national_id';
  }>({
    sponsorId: 'usr_me_001',
    userName: '',
    userHandle: '',
    tier: 'verified_monthly',
    kycStatus: 'verified',
    whatsapp: '+1 555-0188',
    email: 'new.member@cps.network',
    docType: 'passport',
  });

  // All potential sponsors list (Current user + all community members)
  const allSponsorsList = useMemo(() => {
    return [
      {
        id: user.id,
        name: `${user.name} (You / Admin)`,
        handle: user.handle,
        avatar: user.avatar,
        tier: user.tier,
        kycStatus: user.kyc?.status || 'unverified',
      },
      ...members.map((m) => ({
        id: m.id,
        name: m.name,
        handle: m.handle,
        avatar: m.avatar,
        tier: m.tier,
        kycStatus: m.kyc?.status || (m.isKycVerified ? 'verified' : 'unverified'),
      })),
    ];
  }, [user, members]);

  // Aggregate stats by sponsor
  const sponsorTeamsStats = useMemo(() => {
    const map: Record<string, {
      sponsorId: string;
      sponsorName: string;
      sponsorHandle: string;
      sponsorAvatar?: string;
      sponsorTier?: UserTier;
      totalReferrals: number;
      verifiedKycCount: number;
      pendingKycCount: number;
      unverifiedKycCount: number;
      soldCount: number;
      totalCoinsEarned: number;
      totalSaleVolumeUsd: number;
    }> = {};

    // Initialize map for all sponsors that currently have referrals
    referrals.forEach((ref) => {
      const sId = ref.sponsorId || 'usr_me_001';
      if (!map[sId]) {
        const foundSponsor = allSponsorsList.find((s) => s.id === sId);
        map[sId] = {
          sponsorId: sId,
          sponsorName: ref.sponsorName || foundSponsor?.name || 'Alex Rivera',
          sponsorHandle: ref.sponsorHandle || foundSponsor?.handle || '@alex_rivera',
          sponsorAvatar: foundSponsor?.avatar || user.avatar,
          sponsorTier: foundSponsor?.tier || 'verified_yearly',
          totalReferrals: 0,
          verifiedKycCount: 0,
          pendingKycCount: 0,
          unverifiedKycCount: 0,
          soldCount: 0,
          totalCoinsEarned: 0,
          totalSaleVolumeUsd: 0,
        };
      }

      map[sId].totalReferrals += 1;
      map[sId].totalCoinsEarned += (ref.rewardCoinsSponsor || 1);

      const kStatus = ref.kycStatus || (ref.kycData?.status) || 'unverified';
      if (kStatus === 'verified') {
        map[sId].verifiedKycCount += 1;
      } else if (kStatus === 'pending') {
        map[sId].pendingKycCount += 1;
      } else {
        map[sId].unverifiedKycCount += 1;
      }

      if (ref.isSold) {
        map[sId].soldCount += 1;
        map[sId].totalSaleVolumeUsd += (ref.salePriceUsd || 0);
      }
    });

    return Object.values(map);
  }, [referrals, allSponsorsList, user.avatar]);

  // Global referral metrics
  const globalMetrics = useMemo(() => {
    const total = referrals.length;
    let verifiedCount = 0;
    let pendingCount = 0;
    let unverifiedCount = 0;
    let soldCount = 0;
    let totalSaleRevenue = 0;

    referrals.forEach((r) => {
      const status = r.kycStatus || r.kycData?.status || 'unverified';
      if (status === 'verified') verifiedCount++;
      else if (status === 'pending') pendingCount++;
      else unverifiedCount++;

      if (r.isSold) {
        soldCount++;
        totalSaleRevenue += (r.salePriceUsd || 0);
      }
    });

    return {
      total,
      verifiedCount,
      pendingCount,
      unverifiedCount,
      soldCount,
      availableCount: total - soldCount,
      totalSaleRevenue,
      verificationRate: total > 0 ? Math.round((verifiedCount / total) * 100) : 0,
    };
  }, [referrals]);

  // Filtered referrals list
  const filteredReferrals = useMemo(() => {
    return referrals.filter((ref) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ref.userName.toLowerCase().includes(q);
        const matchesHandle = ref.userHandle.toLowerCase().includes(q);
        const matchesUnique = ref.userUniqueId.toLowerCase().includes(q);
        const matchesSponsor = (ref.sponsorName || '').toLowerCase().includes(q) || 
                               (ref.sponsorHandle || '').toLowerCase().includes(q);
        const matchesDoc = (ref.kycData?.docNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesHandle && !matchesUnique && !matchesSponsor && !matchesDoc) {
          return false;
        }
      }

      // Sponsor filter
      if (sponsorFilter !== 'all') {
        const sId = ref.sponsorId || 'usr_me_001';
        if (sId !== sponsorFilter && ref.sponsorHandle !== sponsorFilter) {
          return false;
        }
      }

      // KYC filter
      if (kycFilter !== 'all') {
        const status = ref.kycStatus || ref.kycData?.status || 'unverified';
        if (status !== kycFilter) return false;
      }

      // Sale filter
      if (saleFilter === 'sold' && !ref.isSold) return false;
      if (saleFilter === 'available' && ref.isSold) return false;

      // Tier filter
      if (tierFilter !== 'all' && ref.tier !== tierFilter) return false;

      return true;
    });
  }, [referrals, searchQuery, sponsorFilter, kycFilter, saleFilter, tierFilter]);

  // Execute Sale of Referral Lead
  const handleExecuteSellReferral = () => {
    if (!sellingReferral) return;

    const buyer = allSponsorsList.find((s) => s.id === saleBuyerId);
    const buyerName = buyer?.name || 'Private OTC Syndicate';
    const buyerHandle = buyer?.handle || '@syndicate_fund';

    const price = Number(salePriceInput) || 0;

    // Update referral record
    onUpdateReferrals((prev) =>
      prev.map((r) => {
        if (r.id === sellingReferral.id) {
          return {
            ...r,
            isSold: true,
            salePriceUsd: price,
            saleDate: new Date().toISOString(),
            saleNotes: saleNotesInput,
            commissionStatus: 'transferred',
            // If transfer lineage is checked, reassign sponsor to buyer
            ...(transferLineageOnSale
              ? {
                  sponsorId: saleBuyerId,
                  sponsorName: buyerName,
                  sponsorHandle: buyerHandle,
                }
              : {}),
          };
        }
        return r;
      })
    );

    // If credit original sponsor is selected, credit their cash balance
    if (creditOriginalSponsor) {
      if (sellingReferral.sponsorId === user.id || sellingReferral.sponsorId === 'usr_me_001') {
        onUpdateUser((prev) => ({
          ...prev,
          usdCashBalance: prev.usdCashBalance + price,
        }));
      }
    }

    // Create a transaction in the platform ledger
    const leadSaleTx: Transaction = {
      id: `tx_ref_sale_${Date.now()}`,
      type: 'dividend',
      tokenAmount: Math.round(price / currentPrice),
      tokenPrice: currentPrice,
      usdTotal: price,
      timestamp: new Date().toISOString(),
      status: 'completed',
      txHash: `0xREF_SALE_${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      note: `Admin Lead Sale: Sold ${sellingReferral.userName} (${sellingReferral.kycStatus === 'verified' ? 'Verified KYC' : 'Unverified'}) to ${buyerName} for $${price.toFixed(2)} USD`,
    };
    onUpdateTransactions((prev) => [leadSaleTx, ...prev]);

    // Audit log
    onAddAuditLog(
      'Referral Lead Sold',
      'referrals',
      `Master Admin sold referral ${sellingReferral.userName} (${sellingReferral.userHandle}) for $${price.toFixed(2)} USD to ${buyerName}. Lineage Transferred: ${transferLineageOnSale ? 'YES' : 'NO'}`
    );

    showToast(`Successfully sold referral ${sellingReferral.userName} for $${price.toFixed(2)} USD!`);
    setSellingReferral(null);
  };

  // Direct KYC Verification or Rejection from Referral Card
  const handleVerifyReferralKyc = (referralId: string, approve: boolean) => {
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return;

    onUpdateReferrals((prev) =>
      prev.map((r) => {
        if (r.id === referralId) {
          const updatedKyc: KycData = {
            ...(r.kycData || {
              whatsapp: '+1 555-0100',
              email: `${r.userHandle.replace('@', '')}@cps.network`,
              docType: 'passport',
              docNumber: `ID-${r.userUniqueId.slice(-6)}`,
            }),
            status: approve ? 'verified' : 'unverified',
            verifiedAt: approve ? new Date().toISOString() : undefined,
          };
          return {
            ...r,
            kycStatus: approve ? 'verified' : 'unverified',
            kycData: updatedKyc,
          };
        }
        return r;
      })
    );

    // Also update community members if handle matches
    onUpdateMembers((prev) =>
      prev.map((m) => {
        if (m.handle === ref.userHandle || m.uniqueId === ref.userUniqueId) {
          return {
            ...m,
            isKycVerified: approve,
            kyc: {
              ...(m.kyc || {
                whatsapp: '+1 555-0100',
                email: `${m.handle.replace('@', '')}@cps.network`,
                docType: 'passport',
                docNumber: `ID-${m.uniqueId.slice(-6)}`,
              }),
              status: approve ? 'verified' : 'unverified',
              verifiedAt: approve ? new Date().toISOString() : undefined,
            },
          };
        }
        return m;
      })
    );

    onAddAuditLog(
      approve ? 'Referral KYC Verified' : 'Referral KYC Rejected',
      'referrals',
      `Admin ${approve ? 'approved and verified' : 'rejected'} KYC compliance for referred member ${ref.userName} (${ref.userHandle}) under sponsor ${ref.sponsorName}`
    );

    showToast(
      approve 
        ? `KYC for ${ref.userName} is now VERIFIED!` 
        : `KYC for ${ref.userName} marked as REJECTED`
    );

    if (selectedKycReferral?.id === referralId) {
      setSelectedKycReferral(null);
    }
  };

  // Reassign / Transfer Lineage to another Sponsor
  const handleExecuteTransferLineage = () => {
    if (!transferringReferral) return;

    const targetSponsor = allSponsorsList.find((s) => s.id === newSponsorTargetId);
    if (!targetSponsor) return;

    onUpdateReferrals((prev) =>
      prev.map((r) => {
        if (r.id === transferringReferral.id) {
          return {
            ...r,
            sponsorId: targetSponsor.id,
            sponsorName: targetSponsor.name,
            sponsorHandle: targetSponsor.handle,
            commissionStatus: 'transferred',
          };
        }
        return r;
      })
    );

    onAddAuditLog(
      'Referral Lineage Transferred',
      'referrals',
      `Transferred downline member ${transferringReferral.userName} from previous sponsor to ${targetSponsor.name} (${targetSponsor.handle})`
    );

    showToast(`Transferred ${transferringReferral.userName} to sponsor ${targetSponsor.name}`);
    setTransferringReferral(null);
  };

  // Add a new referral record manually
  const handleAddNewReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefForm.userName || !newRefForm.userHandle) return;

    const sponsor = allSponsorsList.find((s) => s.id === newRefForm.sponsorId) || allSponsorsList[0];

    const uniqueId = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    const handleClean = newRefForm.userHandle.startsWith('@') ? newRefForm.userHandle : `@${newRefForm.userHandle}`;

    const newRecord: ReferralRecord = {
      id: `ref_${Date.now()}`,
      sponsorId: sponsor.id,
      sponsorName: sponsor.name,
      sponsorHandle: sponsor.handle,
      userName: newRefForm.userName,
      userHandle: handleClean,
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      userUniqueId: uniqueId,
      joinedAt: new Date().toISOString(),
      rewardCoinsSponsor: 1,
      rewardCoinsInvitee: 1,
      status: 'completed',
      tier: newRefForm.tier,
      kycStatus: newRefForm.kycStatus,
      kycData: {
        status: newRefForm.kycStatus,
        whatsapp: newRefForm.whatsapp,
        email: newRefForm.email,
        docType: newRefForm.docType,
        docNumber: `ID-${uniqueId.slice(-6)}`,
        facePhotoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
        verifiedAt: newRefForm.kycStatus === 'verified' ? new Date().toISOString() : undefined,
      },
      commissionStatus: 'paid',
    };

    onUpdateReferrals((prev) => [newRecord, ...prev]);

    onAddAuditLog(
      'New Referral Registered',
      'referrals',
      `Admin manually added referral ${newRefForm.userName} (${handleClean}) under sponsor ${sponsor.name}`
    );

    showToast(`Added ${newRefForm.userName} under ${sponsor.name}!`);
    setIsAddingReferral(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP METRICS BANNER */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(14, 165, 233, 0.08) 50%, var(--theme-card) 100%)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  User Referral Teams & Lead Monetization
                </h2>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Inspect downline trees for every user, verify referral KYC proofs, reassign sponsors, and monetize verified leads
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAddingReferral(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Downline Lead</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
          <div 
            className="p-3.5 rounded-2xl border backdrop-blur-sm"
            style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
          >
            <div className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Network Downline</span>
            </div>
            <div className="text-xl font-black mt-1 font-mono" style={{ color: 'var(--theme-text-primary)' }}>
              {globalMetrics.total}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              across {sponsorTeamsStats.length} active sponsors
            </div>
          </div>

          <div 
            className="p-3.5 rounded-2xl border backdrop-blur-sm"
            style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
          >
            <div className="text-[11px] font-semibold flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KYC Verified Referrals</span>
            </div>
            <div className="text-xl font-black mt-1 font-mono text-emerald-400">
              {globalMetrics.verifiedCount}
            </div>
            <div className="text-[10px] mt-0.5 text-emerald-400/80 font-semibold">
              {globalMetrics.verificationRate}% network compliance
            </div>
          </div>

          <div 
            className="p-3.5 rounded-2xl border backdrop-blur-sm"
            style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
          >
            <div className="text-[11px] font-semibold flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending KYC Review</span>
            </div>
            <div className="text-xl font-black mt-1 font-mono text-amber-400">
              {globalMetrics.pendingCount}
            </div>
            <div className="text-[10px] mt-0.5 text-amber-400/80">
              {globalMetrics.unverifiedCount} unverified leads
            </div>
          </div>

          <div 
            className="p-3.5 rounded-2xl border backdrop-blur-sm"
            style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
          >
            <div className="text-[11px] font-semibold flex items-center gap-1.5 text-sky-400">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Sold Referral Leads</span>
            </div>
            <div className="text-xl font-black mt-1 font-mono text-sky-400">
              {globalMetrics.soldCount}
            </div>
            <div className="text-[10px] mt-0.5 text-sky-300 font-mono">
              ${globalMetrics.totalSaleRevenue.toFixed(2)} USD volume
            </div>
          </div>

          <div 
            className="p-3.5 rounded-2xl border backdrop-blur-sm col-span-2 sm:col-span-4 lg:col-span-1"
            style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
          >
            <div className="text-[11px] font-semibold flex items-center gap-1.5 text-indigo-300">
              <Tag className="w-3.5 h-3.5" />
              <span>Available to Monetize</span>
            </div>
            <div className="text-xl font-black mt-1 font-mono" style={{ color: 'var(--theme-text-primary)' }}>
              {globalMetrics.availableCount}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              Ready for OTC broker sale
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPONSOR TEAMS BREAKDOWN (CAROUSEL / SUMMARY CARDS) */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border space-y-4"
        style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <Layers className="w-4 h-4 text-sky-400" />
              Sponsor Downline Teams ({sponsorTeamsStats.length})
            </h3>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Click on any sponsor card to isolate and inspect their full downline team
            </p>
          </div>

          {sponsorFilter !== 'all' && (
            <button
              onClick={() => setSponsorFilter('all')}
              className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Show All Sponsors</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {sponsorTeamsStats.map((sp) => {
            const isSelected = sponsorFilter === sp.sponsorId || sponsorFilter === sp.sponsorHandle;
            return (
              <div
                key={sp.sponsorId}
                onClick={() => setSponsorFilter(isSelected ? 'all' : sp.sponsorId)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-101 ${
                  isSelected 
                    ? 'ring-2 ring-sky-500 bg-sky-500/10 border-sky-500/50' 
                    : 'hover:border-slate-500/50'
                }`}
                style={{ 
                  backgroundColor: isSelected ? undefined : 'var(--theme-bg)',
                  borderColor: isSelected ? undefined : 'var(--theme-border)' 
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={sp.sponsorAvatar} 
                      alt={sp.sponsorName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                        {sp.sponsorName}
                      </div>
                      <div className="text-[11px] font-mono text-sky-400 truncate">
                        {sp.sponsorHandle}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30 shrink-0">
                    {sp.totalReferrals} Ref
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-1 text-center" style={{ borderColor: 'var(--theme-border)' }}>
                  <div>
                    <div className="text-[10px] font-semibold text-emerald-400">Verified</div>
                    <div className="text-xs font-black font-mono text-emerald-400">{sp.verifiedKycCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-amber-400">Pending</div>
                    <div className="text-xs font-black font-mono text-amber-400">{sp.pendingKycCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-sky-400">Sold</div>
                    <div className="text-xs font-black font-mono text-sky-400">{sp.soldCount}</div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  <span>Rewards: +{sp.totalCoinsEarned} CPS</span>
                  {sp.totalSaleVolumeUsd > 0 && (
                    <span className="font-mono text-emerald-400 font-bold">${sp.totalSaleVolumeUsd.toFixed(2)} Sold</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. REFERRAL REGISTRY & MANAGEMENT TABLE */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border space-y-4"
        style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <Users className="w-5 h-5 text-sky-400" />
              Referral Registry & KYC Inspector ({filteredReferrals.length})
            </h3>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Inspect live KYC documents, face photos, contact data, and execute OTC downline sales
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, handle, sponsor, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs outline-none focus:border-sky-500"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            />
          </div>

          {/* Filter by Sponsor */}
          <div>
            <select
              value={sponsorFilter}
              onChange={(e) => setSponsorFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              <option value="all">All Sponsors ({allSponsorsList.length})</option>
              {allSponsorsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.handle})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by KYC Status */}
          <div>
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              <option value="all">All KYC Statuses</option>
              <option value="verified">KYC Verified Only</option>
              <option value="pending">KYC Pending Review</option>
              <option value="unverified">KYC Unverified</option>
            </select>
          </div>

          {/* Filter by Sale Status */}
          <div>
            <select
              value={saleFilter}
              onChange={(e) => setSaleFilter(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              <option value="all">All Sale Statuses</option>
              <option value="available">Available to Sell ({globalMetrics.availableCount})</option>
              <option value="sold">Sold Leads Only ({globalMetrics.soldCount})</option>
            </select>
          </div>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--theme-border)' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
                <th className="p-3.5 font-bold" style={{ color: 'var(--theme-text-secondary)' }}>Referred Member</th>
                <th className="p-3.5 font-bold" style={{ color: 'var(--theme-text-secondary)' }}>Sponsor / Team</th>
                <th className="p-3.5 font-bold" style={{ color: 'var(--theme-text-secondary)' }}>Tier</th>
                <th className="p-3.5 font-bold" style={{ color: 'var(--theme-text-secondary)' }}>KYC Status & Proof</th>
                <th className="p-3.5 font-bold" style={{ color: 'var(--theme-text-secondary)' }}>Monetization / Sale</th>
                <th className="p-3.5 font-bold text-right" style={{ color: 'var(--theme-text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    No referrals match the current search filters.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => {
                  const kycStatus = ref.kycStatus || ref.kycData?.status || 'unverified';
                  return (
                    <tr key={ref.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* Referred member details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={ref.userAvatar} 
                            alt={ref.userName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0" 
                          />
                          <div>
                            <div className="font-extrabold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                              {ref.userName}
                            </div>
                            <div className="text-[11px] font-mono text-sky-400">
                              {ref.userHandle}
                            </div>
                            <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                              UID: {ref.userUniqueId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sponsor / Team */}
                      <td className="p-3.5">
                        <div>
                          <div className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                            {ref.sponsorName || 'Alex Rivera'}
                          </div>
                          <div className="text-[11px] font-mono text-indigo-400">
                            {ref.sponsorHandle || '@alex_rivera'}
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700/40 text-slate-300 font-mono">
                            Joined {new Date(ref.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                          ref.tier === 'verified_yearly'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : ref.tier === 'verified_monthly'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-700/50'
                        }`}>
                          {ref.tier === 'verified_yearly' ? 'Pioneer' : ref.tier === 'verified_monthly' ? 'Actuator' : 'Observer'}
                        </span>
                      </td>

                      {/* KYC Status & Proof */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {kycStatus === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                Verified KYC
                              </span>
                            ) : kycStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                <Clock className="w-3 h-3" />
                                Review Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/30 text-slate-400 border border-slate-700/50">
                                <ShieldAlert className="w-3 h-3" />
                                Unverified
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedKycReferral(ref)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Dossier & Proof</span>
                          </button>
                        </div>
                      </td>

                      {/* Monetization / Sale status */}
                      <td className="p-3.5">
                        {ref.isSold ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                              <Tag className="w-3 h-3" />
                              SOLD (${(ref.salePriceUsd || 0).toFixed(2)})
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 max-w-[160px] truncate" title={ref.saleNotes}>
                              {ref.saleNotes || 'Sold by Master Admin'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Available
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Est: {kycStatus === 'verified' ? '$25.00' : '$10.00'} USD
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Quick KYC Verify / Reject Toggle */}
                          {kycStatus !== 'verified' ? (
                            <button
                              onClick={() => handleVerifyReferralKyc(ref.id, true)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="Approve KYC documentation"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifyReferralKyc(ref.id, false)}
                              className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="Revoke KYC verification"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          )}

                          {/* Sell Referral Lead Button */}
                          <button
                            onClick={() => {
                              setSellingReferral(ref);
                              setSalePriceInput(kycStatus === 'verified' ? 25 : 10);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                              ref.isSold
                                ? 'bg-slate-700/40 hover:bg-slate-700 text-slate-300 border border-slate-600'
                                : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 hover:brightness-110 shadow-sm shadow-sky-500/20'
                            }`}
                            title={ref.isSold ? 'Re-sell or modify lead terms' : 'Sell this verified downline lead'}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>{ref.isSold ? 'Re-sell' : 'Sell Lead'}</span>
                          </button>

                          {/* Transfer Sponsor Lineage */}
                          <button
                            onClick={() => {
                              setTransferringReferral(ref);
                              setNewSponsorTargetId(ref.sponsorId || 'usr_me_001');
                            }}
                            className="p-1 rounded-lg border hover:border-sky-500 text-slate-400 hover:text-sky-300 transition-all text-xs"
                            title="Transfer this referral to another sponsor"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SELL REFERRAL LEAD / DOWNLINE                                    */}
      {/* ========================================================================= */}
      {sellingReferral && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                    Sell Referral Lead / Downline Member
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    Monetize verified member downlines by transferring commission rights or team lineage
                  </p>
                </div>
              </div>
              <button onClick={() => setSellingReferral(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Target Referral Summary Box */}
            <div 
              className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center gap-3">
                <img 
                  src={sellingReferral.userAvatar} 
                  alt={sellingReferral.userName}
                  className="w-11 h-11 rounded-full object-cover border border-slate-700" 
                />
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                    {sellingReferral.userName}
                  </div>
                  <div className="text-xs font-mono text-sky-400">
                    {sellingReferral.userHandle}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Current Sponsor: {sellingReferral.sponsorName} ({sellingReferral.sponsorHandle})
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (sellingReferral.kycStatus === 'verified' || sellingReferral.kycData?.status === 'verified')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {(sellingReferral.kycStatus === 'verified' || sellingReferral.kycData?.status === 'verified')
                    ? '✓ Verified KYC'
                    : '⏳ KYC Pending'}
                </span>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  {sellingReferral.tier === 'verified_yearly' ? 'Pioneer Member' : 'Actuator Member'}
                </div>
              </div>
            </div>

            {/* Price Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold block" style={{ color: 'var(--theme-text-primary)' }}>
                Sale Price (USD)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={salePriceInput}
                    onChange={(e) => setSalePriceInput(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border text-sm font-mono font-bold outline-none focus:border-sky-500"
                    style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                  />
                </div>

                {/* Quick Presets */}
                {[10, 15, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSalePriceInput(preset)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      salePriceInput === preset 
                        ? 'bg-sky-500 text-slate-950 border-sky-400' 
                        : 'border-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Benchmark: Verified Actuators typically trade between $15 to $50 depending on activity multiplier.
              </p>
            </div>

            {/* Buyer Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold block" style={{ color: 'var(--theme-text-primary)' }}>
                Assign Lead to Buyer (Sponsor / Investor)
              </label>
              <select
                value={saleBuyerId}
                onChange={(e) => setSaleBuyerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              >
                {allSponsorsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.handle}) — Tier: {s.tier}
                  </option>
                ))}
              </select>
            </div>

            {/* Options Toggles */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={transferLineageOnSale}
                  onChange={(e) => setTransferLineageOnSale(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 w-4 h-4"
                />
                <span style={{ color: 'var(--theme-text-primary)' }}>
                  Transfer Sponsor Lineage to Buyer (buyer receives all ongoing referral rewards)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={creditOriginalSponsor}
                  onChange={(e) => setCreditOriginalSponsor(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 w-4 h-4"
                />
                <span style={{ color: 'var(--theme-text-primary)' }}>
                  Credit sale proceeds to original sponsor wallet (otherwise retained in Admin Treasury)
                </span>
              </label>
            </div>

            {/* Notes / Reason */}
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                Sale Ledger Notes & Verification Hash
              </label>
              <input
                type="text"
                value={saleNotesInput}
                onChange={(e) => setSaleNotesInput(e.target.value)}
                className="w-full p-2 rounded-xl border text-xs"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                placeholder="e.g. Sold as verified high-activity actuator lead"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <button
                onClick={() => setSellingReferral(null)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-800/40"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSellReferral}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 hover:scale-102 active:scale-98 transition-all"
              >
                <DollarSign className="w-4 h-4" />
                <span>Confirm Sale for ${Number(salePriceInput).toFixed(2)} USD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KYC DOSSIER & PROOF INSPECTOR                                    */}
      {/* ========================================================================= */}
      {selectedKycReferral && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-xl rounded-3xl border p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-150"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center text-slate-950 font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                    Referral KYC Dossier: {selectedKycReferral.userName}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    Verification proofs, Government ID document, and live face camera capture
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedKycReferral(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Status overview */}
            <div 
              className="p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-2"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
            >
              <div>
                <div className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Compliance Status: {selectedKycReferral.kycStatus === 'verified' ? 'APPROVED' : selectedKycReferral.kycStatus === 'pending' ? 'PENDING AUDIT' : 'UNVERIFIED'}
                </div>
                <div className="text-[11px] font-mono text-sky-400">
                  Sponsor Lineage: {selectedKycReferral.sponsorName} ({selectedKycReferral.sponsorHandle})
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerifyReferralKyc(selectedKycReferral.id, true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approve KYC</span>
                </button>
                <button
                  onClick={() => handleVerifyReferralKyc(selectedKycReferral.id, false)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {/* Document Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>WhatsApp Contact</span>
                </div>
                <div className="font-mono font-bold mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                  {selectedKycReferral.kycData?.whatsapp || '+1 555-0199'}
                </div>
              </div>

              <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Mail className="w-3 h-3 text-sky-400" />
                  <span>Verified Email</span>
                </div>
                <div className="font-mono font-bold mt-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>
                  {selectedKycReferral.kycData?.email || `${selectedKycReferral.userHandle.replace('@', '')}@cps.network`}
                </div>
              </div>

              <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>ID Document Type</span>
                </div>
                <div className="font-bold mt-1 uppercase" style={{ color: 'var(--theme-text-primary)' }}>
                  {selectedKycReferral.kycData?.docType?.replace('_', ' ') || 'PASSPORT'}
                </div>
              </div>

              <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Document Identification #</span>
                </div>
                <div className="font-mono font-bold mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                  {selectedKycReferral.kycData?.docNumber || `PASS-${selectedKycReferral.userUniqueId.slice(-6)}`}
                </div>
              </div>
            </div>

            {/* Visual Proofs Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Face Photo / Live Camera */}
              <div className="p-3 rounded-2xl border text-center space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <span>Live Face Camera Capture</span>
                </div>
                <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-sky-500/50 relative shadow-inner">
                  <img 
                    src={selectedKycReferral.kycData?.facePhotoUrl || selectedKycReferral.userAvatar} 
                    alt="Face Capture"
                    className="w-full h-full object-cover" 
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-slate-950/80 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                    LIVENESS OK
                  </span>
                </div>
              </div>

              {/* ID Document Scan */}
              <div className="p-3 rounded-2xl border text-center space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Official Government ID Proof</span>
                </div>
                <div className="w-48 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/50 relative bg-slate-900 flex items-center justify-center p-2 shadow-inner">
                  <div className="text-center space-y-1">
                    <FileText className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                    <div className="text-[10px] font-mono font-bold text-slate-300">
                      {selectedKycReferral.kycData?.docType?.toUpperCase() || 'PASSPORT'}
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400">
                      {selectedKycReferral.kycData?.docNumber || 'DOC-VERIFIED'}
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 text-[9px] bg-slate-950/80 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                    VALIDATED
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <button
                onClick={() => setSelectedKycReferral(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TRANSFER SPONSOR LINEAGE                                         */}
      {/* ========================================================================= */}
      {transferringReferral && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                  Reassign Sponsor Lineage
                </h3>
              </div>
              <button onClick={() => setTransferringReferral(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Transfer downline member <strong className="text-sky-300">{transferringReferral.userName}</strong> ({transferringReferral.userHandle}) to a new sponsor network.
            </p>

            <div>
              <label className="text-xs font-bold block mb-1">Select New Sponsor</label>
              <select
                value={newSponsorTargetId}
                onChange={(e) => setNewSponsorTargetId(e.target.value)}
                className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              >
                {allSponsorsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.handle})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <button
                onClick={() => setTransferringReferral(null)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransferLineage}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
              >
                Execute Lineage Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD NEW REFERRAL LEAD                                            */}
      {/* ========================================================================= */}
      {isAddingReferral && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddNewReferral}
            className="w-full max-w-md rounded-3xl border p-6 space-y-3 shadow-2xl animate-in fade-in duration-150"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                Add New Downline Lead
              </h3>
              <button type="button" onClick={() => setIsAddingReferral(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Select Sponsor Team</label>
              <select
                value={newRefForm.sponsorId}
                onChange={(e) => setNewRefForm({ ...newRefForm, sponsorId: e.target.value })}
                className="w-full p-2 rounded-xl border text-xs"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                {allSponsorsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.handle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Member Full Name</label>
              <input
                type="text"
                required
                value={newRefForm.userName}
                onChange={(e) => setNewRefForm({ ...newRefForm, userName: e.target.value })}
                className="w-full p-2 rounded-xl border text-xs"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                placeholder="e.g. Satoshi Nakamoto"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Handle</label>
              <input
                type="text"
                required
                value={newRefForm.userHandle}
                onChange={(e) => setNewRefForm({ ...newRefForm, userHandle: e.target.value })}
                className="w-full p-2 rounded-xl border text-xs font-mono"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                placeholder="@satoshi"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1">Tier</label>
                <select
                  value={newRefForm.tier}
                  onChange={(e) => setNewRefForm({ ...newRefForm, tier: e.target.value as UserTier })}
                  className="w-full p-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                >
                  <option value="verified_monthly">Actuator ($1/mo)</option>
                  <option value="verified_yearly">Pioneer ($10/yr)</option>
                  <option value="free">Observer (Free)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">KYC Status</label>
                <select
                  value={newRefForm.kycStatus}
                  onChange={(e) => setNewRefForm({ ...newRefForm, kycStatus: e.target.value as KycStatus })}
                  className="w-full p-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                >
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1">WhatsApp Phone</label>
                <input
                  type="text"
                  value={newRefForm.whatsapp}
                  onChange={(e) => setNewRefForm({ ...newRefForm, whatsapp: e.target.value })}
                  className="w-full p-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">ID Document Type</label>
                <select
                  value={newRefForm.docType}
                  onChange={(e) => setNewRefForm({ ...newRefForm, docType: e.target.value as any })}
                  className="w-full p-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                >
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <button
                type="button"
                onClick={() => setIsAddingReferral(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
              >
                Register Referral
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
