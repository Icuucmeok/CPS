import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Users, 
  Coins, 
  Gift, 
  Sparkles,
  Share2
} from 'lucide-react';
import { ReferralRecord, UserProfile } from '../types';
import { AdMobBanner } from './ads/AdMobBanner';

interface MySharesViewProps {
  user: UserProfile;
  referrals: ReferralRecord[];
  onOpenMembership: () => void;
}

export const MySharesView: React.FC<MySharesViewProps> = ({
  user,
  referrals,
  onOpenMembership: _onOpenMembership,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Generate unique referral link using user's uniqueId or handle
  const referralCode = `CPS-${user.handle.replace('@', '').toUpperCase()}-${user.uniqueId.slice(-4)}`;
  const referralLink = `https://cps.network/join?ref=${referralCode}`;

  const totalReferralSharesEarned = referrals.reduce((sum, r) => sum + r.rewardCoinsSponsor, 0);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Community Power Share (CPS)',
          text: 'Join CPS network with my referral link to claim your 1 Free CP Share!',
          url: referralLink,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    handleCopyLink();
    setRewardToast('📋 Referral link copied to clipboard! Share it with your team.');
    setTimeout(() => setRewardToast(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification for Referral Reward */}
      {rewardToast && (
        <div 
          className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 shadow-xl"
        >
          <div className="flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <span className="font-medium">{rewardToast}</span>
          </div>
          <button 
            onClick={() => setRewardToast(null)}
            className="text-emerald-400 hover:text-white text-xs underline font-bold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP CARD: Copy Referral Link + Promo Message */}
      <div 
        id="my-shares-copy-link-card"
        className="rounded-3xl border p-6 sm:p-7 relative overflow-hidden transition-all shadow-xl"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            {/* Motivational Banner / Reward Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Share & Earn: 1 CPS Share for you + 1 CPS Share for your friend (worth $1 each)!</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              My Shares & Referral Program
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              Invite teammates with your unique referral link. When they join, you earn <strong className="text-emerald-400 font-bold">1 Free CP Share ($1 Value)</strong>, and your friend also receives <strong className="text-amber-300 font-bold">1 Free CP Share ($1 Value)</strong> directly in their wallet! Bring more users to multiply community power and drive token valuation!
            </p>
          </div>

          {/* Action to share link */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="share-referral-btn"
              onClick={handleShareLink}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Invite Link</span>
            </button>
          </div>
        </div>

        {/* Copy Referral Link Input Bar */}
        <div className="mt-5 pt-5 border-t relative z-10" style={{ borderColor: 'var(--theme-border)' }}>
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Your Personal Referral Link:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div 
              className="flex-1 px-4 py-3 rounded-xl border text-xs sm:text-sm font-mono truncate select-all flex items-center justify-between"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            >
              <span className="truncate">{referralLink}</span>
            </div>

            <button
              id="copy-my-shares-link-btn"
              onClick={handleCopyLink}
              className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 shadow-md shadow-sky-500/20"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>

        {/* Background glow accent */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* AdMob Banner Ad: Directly Under 1st Card in My Shares */}
      <div>
        <AdMobBanner placement="my_shares_top" />
      </div>

      {/* TWO STATS CARDS: 1) Total Referrals and 2) Total Coins Earned by Referral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Total Referrals */}
        <div 
          id="card-total-referrals"
          className="p-6 rounded-2xl border transition-all shadow-md relative overflow-hidden flex items-center justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              Total Referrals
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black text-sky-300 mt-2">
              {referrals.length}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Team members who signed up with your link
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* Card 2: Total CP Shares Earned by Referral */}
        <div 
          id="card-total-shares-earned"
          className="p-6 rounded-2xl border transition-all shadow-md relative overflow-hidden flex items-center justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              Total Shares Earned by Referral
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 mt-2 flex items-baseline gap-2">
              <span>+{totalReferralSharesEarned} Shares</span>
              <span className="text-xs font-normal text-slate-400">({totalReferralSharesEarned} CPS)</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              1 CP Share reward credited per successful registration
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Coins className="w-7 h-7 text-amber-300" />
          </div>
        </div>
      </div>

      {/* DOWNSIDE CARD: Referrals Users Data (Who Refers / Who Joined) */}
      <div 
        id="my-shares-referrals-list"
        className="rounded-2xl border p-6 transition-all shadow-md"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base sm:text-lg" style={{ color: 'var(--theme-text-primary)' }}>
              Referred Users Data ({referrals.length})
            </h3>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              List of people who joined through your referral link and claimed their free share.
            </p>
          </div>

          <button
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </button>
        </div>

        {referrals.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
              No Referrals Yet
            </h4>
            <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
              Copy your share link and invite your team. Each signup will automatically award 1 free CP Share to you and 1 free CP Share to them.
            </p>
            <button
              onClick={handleShareLink}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs shadow transition-all hover:bg-sky-400"
            >
              Copy & Share Invite Link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Unique ID</th>
                  <th className="pb-3 font-semibold">Date Joined</th>
                  <th className="pb-3 font-semibold">Sponsor Reward</th>
                  <th className="pb-3 font-semibold">User Reward</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {referrals.map((item) => (
                  <tr key={item.id} id={`referral-row-${item.id}`} className="hover:bg-sky-500/5 transition-colors">
                    {/* User Info */}
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.userAvatar}
                          alt={item.userName}
                          className="w-8 h-8 rounded-full object-cover border border-sky-500/30"
                        />
                        <div>
                          <div className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                            {item.userName}
                          </div>
                          <div className="text-[11px] font-mono text-sky-400">
                            {item.userHandle}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Unique ID */}
                    <td className="py-3 font-mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      {item.userUniqueId}
                    </td>

                    {/* Date Joined */}
                    <td className="py-3 text-[11px]" style={{ color: 'var(--theme-text-secondary)' }}>
                      {new Date(item.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Sponsor Reward */}
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        +{item.rewardCoinsSponsor} Share
                      </span>
                    </td>

                    {/* Invitee Reward */}
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        +{item.rewardCoinsInvitee} Share
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
                        <Check className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>

                    {/* Tier */}
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.tier !== 'free'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.tier !== 'free' ? 'Actuator' : 'Observer'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
