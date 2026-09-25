import React from 'react';
import { 
  ShieldAlert, 
  UserCheck, 
  LogOut, 
  ArrowRightLeft, 
  Coins, 
  DollarSign, 
  ShieldCheck,
  Eye
} from 'lucide-react';
import { UserProfile, CommunityMember } from '../types';

interface ImpersonationBannerProps {
  currentUser: UserProfile;
  originalAdmin: UserProfile;
  members: CommunityMember[];
  onExitImpersonation: () => void;
  onSwitchUser: (member: CommunityMember) => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  currentUser,
  originalAdmin,
  members,
  onExitImpersonation,
  onSwitchUser,
}) => {
  return (
    <div
      id="admin-impersonation-banner"
      role="banner"
      className="w-full border-b shadow-md transition-all sticky top-0 z-50 px-4 py-2.5 sm:px-6"
      style={{
        background: 'linear-gradient(90deg, #311042 0%, #1e1b4b 50%, #0f172a 100%)',
        borderColor: '#a855f7',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Mode Badge & Impersonated User Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold shrink-0 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>IMPERSONATION ACTIVE</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="text-slate-400 hidden md:inline">Viewing platform as:</span>
            <div className="flex items-center gap-1.5">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-5 h-5 rounded-full object-cover border border-purple-400/50"
              />
              <span className="font-bold text-white text-sm">
                {currentUser.name}
              </span>
              <span className="font-mono text-purple-300 text-xs">
                {currentUser.handle}
              </span>
            </div>

            {/* User Tier & Balances Badges */}
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              currentUser.tier !== 'free'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {currentUser.tier === 'verified_yearly' ? 'Actuator Yearly' : currentUser.tier === 'verified_monthly' ? 'Actuator Monthly' : 'Observer Free'}
            </span>

            <span className="hidden lg:inline-flex items-center gap-1 font-mono text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 text-[11px]">
              <Coins className="w-3 h-3" />
              {(currentUser.sharexBalance / 1_000_000).toFixed(1)}M CPS
            </span>

            <span className="hidden xl:inline-flex items-center gap-1 font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
              <DollarSign className="w-3 h-3" />
              ${currentUser.usdCashBalance.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Right: Quick Switcher Dropdown & Exit Button */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          {/* Quick Switch Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="impersonate-select" className="text-slate-400 text-[11px] hidden sm:inline flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-purple-400" />
              <span>Switch:</span>
            </label>
            <select
              id="impersonate-select"
              value={currentUser.id}
              onChange={(e) => {
                const targetMember = members.find((m) => m.id === e.target.value);
                if (targetMember) onSwitchUser(targetMember);
              }}
              className="bg-slate-900/90 text-purple-200 border border-purple-500/40 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.handle}) - {m.tier !== 'free' ? 'Actuator' : 'Observer'}
                </option>
              ))}
            </select>
          </div>

          {/* Exit Impersonation Button */}
          <button
            id="exit-impersonation-btn"
            onClick={onExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-md active:scale-95 border border-rose-400/40"
            title={`Exit impersonation and return to Master Admin (${originalAdmin.name})`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Return to Admin ({originalAdmin.handle})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
