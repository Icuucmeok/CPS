import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Palette, 
  Check, 
  ShieldCheck, 
  Code2, 
  Database, 
  Play, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Sparkles, 
  Layers, 
  Cpu, 
  Radio,
  Shield,
  Trash2,
  AlertTriangle,
  UserX,
  Smartphone,
  Globe
} from 'lucide-react';
import { ThemeMode, UserProfile, UserTier } from '../types';
import { runPricingEngineTests, UnitTestResult } from '../utils/pricingEngine';
import { POSTGRESQL_TRANSACTION_SCHEMA, REALTIME_API_INTEGRATION_STRATEGY } from '../data/architectureDocs';
import { isAdminPortalSupported, getCurrentPlatform } from '../utils/platform';
import { DeleteAccountModal } from './DeleteAccountModal';

interface SettingsViewProps {
  user: UserProfile;
  theme: ThemeMode;
  referralCount?: number;
  isAdminSupported?: boolean;
  isSimulatedMobile?: boolean;
  onToggleSimulatedMobile?: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  onUpdateUserProfile: (name: string, handle: string) => void;
  onUpgradeTier: (tier: UserTier) => void;
  onOpenKycModal?: () => void;
  onOpenAdmin?: () => void;
  onOpenAdminAuth?: () => void;
  onDeleteAccount: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  theme,
  referralCount = 0,
  isAdminSupported,
  isSimulatedMobile = false,
  onToggleSimulatedMobile,
  onThemeChange,
  onUpdateUserProfile,
  onUpgradeTier,
  onOpenKycModal,
  onOpenAdmin,
  onOpenAdminAuth,
  onDeleteAccount,
}) => {
  const effectiveAdminSupported = isAdminSupported !== undefined ? isAdminSupported : isAdminPortalSupported();
  const currentPlatform = getCurrentPlatform();
  const [displayName, setDisplayName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [profileSaved, setProfileSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Test Runner state
  const [testResults, setTestResults] = useState<UnitTestResult[] | null>(null);
  const [testsRunning, setTestsRunning] = useState(false);

  // Architecture viewer state
  const [activeArchTab, setActiveArchTab] = useState<'tests' | 'schema' | 'realtime_api'>('tests');
  const [copiedCode, setCopiedCode] = useState(false);

  const isVerified = user.tier !== 'free';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile(displayName, handle);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleRunTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      const suite = runPricingEngineTests();
      setTestResults(suite.results);
      setTestsRunning(false);
    }, 400);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b pb-4" style={{ borderColor: 'var(--theme-border)' }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
          Profile & System Settings
        </h1>
        <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
          Customize your appearance, manage Actuator subscription status, and inspect engine architecture
        </p>
      </div>

      {/* 1. Theme Selector (Crucial Requirement) */}
      <div
        id="theme-selection-panel"
        className="rounded-2xl border p-5 sm:p-6 transition-all"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-5 h-5 text-sky-400" />
          <h2 className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
            Application Theme
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
          Smoothly toggle between dark blue (default), clean light white mode, or soft graphite dark mode.
        </p>

        {/* 3 Visual Theme Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Theme 1: Dark Blue (DEFAULT) */}
          <div
            id="theme-card-dark-blue"
            onClick={() => onThemeChange('dark-blue')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
              theme === 'dark-blue'
                ? 'border-sky-400 ring-2 ring-sky-400/30 shadow-lg shadow-sky-500/10'
                : 'border-slate-700/50 hover:border-slate-600'
            }`}
            style={{ backgroundColor: '#090e24' }}
          >
            {theme === 'dark-blue' && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-sky-400"></span>
              <h3 className="font-bold text-sm text-white">Midnight Navy</h3>
            </div>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-2">
              DEFAULT MODE
            </span>
            <p className="text-[11px] text-slate-300">
              Rich deep blue backdrop with electric cyan accents and navy cards.
            </p>
            {/* Visual Color swatches */}
            <div className="flex gap-1.5 mt-3">
              <div className="w-5 h-5 rounded bg-[#090e24] border border-slate-700"></div>
              <div className="w-5 h-5 rounded bg-[#111d44] border border-slate-700"></div>
              <div className="w-5 h-5 rounded bg-[#38bdf8]"></div>
              <div className="w-5 h-5 rounded bg-[#10b981]"></div>
            </div>
          </div>

          {/* Theme 2: White Mode */}
          <div
            id="theme-card-white"
            onClick={() => onThemeChange('white')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
              theme === 'white'
                ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-lg'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            style={{ backgroundColor: '#f8fafc' }}
          >
            {theme === 'white' && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <h3 className="font-bold text-sm text-slate-900">Pure Light</h3>
            </div>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 mb-2">
              WHITE MODE
            </span>
            <p className="text-[11px] text-slate-600">
              Crisp off-white canvas with high-contrast slate typography and clean borders.
            </p>
            <div className="flex gap-1.5 mt-3">
              <div className="w-5 h-5 rounded bg-[#f8fafc] border border-slate-300"></div>
              <div className="w-5 h-5 rounded bg-[#ffffff] border border-slate-300"></div>
              <div className="w-5 h-5 rounded bg-[#2563eb]"></div>
              <div className="w-5 h-5 rounded bg-[#0f172a]"></div>
            </div>
          </div>

          {/* Theme 3: Graphite Dark (Soft Dark, NOT pitch black) */}
          <div
            id="theme-card-dark"
            onClick={() => onThemeChange('dark')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
              theme === 'dark'
                ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-lg'
                : 'border-slate-800 hover:border-slate-700'
            }`}
            style={{ backgroundColor: '#111520' }}
          >
            {theme === 'dark' && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-slate-400"></span>
              <h3 className="font-bold text-sm text-slate-200">Graphite Dark</h3>
            </div>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 mb-2">
              DARK MODE
            </span>
            <p className="text-[11px] text-slate-400">
              Comfortable charcoal slate (no blinding pitch-black screen).
            </p>
            <div className="flex gap-1.5 mt-3">
              <div className="w-5 h-5 rounded bg-[#111520] border border-slate-800"></div>
              <div className="w-5 h-5 rounded bg-[#1a202c] border border-slate-700"></div>
              <div className="w-5 h-5 rounded bg-[#60a5fa]"></div>
              <div className="w-5 h-5 rounded bg-[#94a3b8]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. User Profile Management */}
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
              Account & Wallet Identity
            </h2>
          </div>
          <button
            type="button"
            id="profile-delete-account-badge-btn"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500 transition-all"
            title="Permanently delete your account and all associated records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2"
              style={{ borderColor: 'var(--theme-border)' }}
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                  {user.name}
                </span>
                {isVerified && (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Wallet: <span className="font-mono text-sky-400">{user.walletAddress}</span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-300'
                }`}>
                  {isVerified ? 'ACTUATOR' : 'OBSERVER'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                  user.kyc?.status === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  KYC: {user.kyc?.status === 'verified' ? 'VERIFIED' : 'UNVERIFIED'}
                </span>
                {onOpenKycModal && (
                  <button
                    type="button"
                    onClick={onOpenKycModal}
                    className="text-[10px] font-bold text-sky-400 hover:underline"
                  >
                    {user.kyc?.status === 'verified' ? 'View KYC' : 'Verify KYC &rarr;'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
                Display Name:
              </label>
              <input
                id="profile-name-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
                Community Handle:
              </label>
              <input
                id="profile-handle-input"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="profile-card-delete-account-btn"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors hover:underline"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Delete Account & Purge Data</span>
              </button>
              <span className="text-xs text-emerald-400">
                {profileSaved ? 'Profile details updated!' : ''}
              </span>
            </div>
            <button
              type="submit"
              id="save-profile-btn"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* 2b. Danger Zone: Permanent Account Deletion */}
      <div
        id="danger-zone-account-deletion"
        className="rounded-2xl border p-5 sm:p-6 transition-all relative overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'rgba(244, 63, 94, 0.4)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                DANGER ZONE
              </span>
              <h3 className="font-bold text-base text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Permanently Delete Account
              </h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              Permanently delete your account and all associated personal information. All records—including your profile, wallet authorization, KYC verification documents & camera biometrics, CPS tokens ({user.sharexBalance.toLocaleString()} CPS), USD cash balance (${(user.usdCashBalance || 0).toFixed(2)}), and referral downline tree—will be completely purged and <strong>cannot be recovered back</strong>.
            </p>
          </div>

          <button
            type="button"
            id="danger-zone-delete-btn"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/25 shrink-0 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account Permanently</span>
          </button>
        </div>
      </div>

      {/* Master Admin Controls Card & Authentication Entry (EXCLUSIVELY ACTIVE ON WEB PLATFORM) */}
      {effectiveAdminSupported ? (
        <div
          id="settings-admin-panel-card"
          className="rounded-2xl border p-5 sm:p-6 relative overflow-hidden"
          style={{
            background: user.isAdmin
              ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.08) 50%, var(--theme-card) 100%)'
              : 'var(--theme-card)',
            borderColor: user.isAdmin ? 'var(--theme-border)' : 'rgba(148, 163, 184, 0.15)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0 ${
                user.isAdmin 
                  ? 'bg-gradient-to-tr from-sky-500 to-indigo-500 text-slate-950 shadow-sky-500/20' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Shield className={`w-5 h-5 ${user.isAdmin ? 'text-slate-950' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                    Administrator Portal (Web Only)
                  </h3>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                    user.isAdmin 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {user.isAdmin ? 'ROOT SESSION ACTIVE' : 'STANDARD USER'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold hidden sm:inline-flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Web Portal
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {user.isAdmin 
                    ? 'Manage the dynamic bonding curve, user balances, KYC verification, 100M airdrop & emergency controls.'
                    : 'System administrators can authenticate with the Master Passkey to unlock Root controls. (Stripped from mobile app APK/AAB builds).'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user.isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 hover:scale-102 active:scale-98 transition-all shrink-0 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Launch Admin Panel</span>
                  </button>
                  {onOpenAdminAuth && (
                    <button
                      type="button"
                      onClick={onOpenAdminAuth}
                      className="px-3 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
                      title="Lock down admin session"
                    >
                      Lock Session
                    </button>
                  )}
                </>
              ) : (
                onOpenAdminAuth && (
                  <button
                    type="button"
                    onClick={onOpenAdminAuth}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold text-xs transition-all shrink-0 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Authenticate Admin Passkey</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Platform Architecture & Build Segregation Card */}
      <div
        id="platform-build-target-card"
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0 ${
              isSimulatedMobile || !effectiveAdminSupported
                ? 'bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950'
                : 'bg-gradient-to-tr from-sky-500 to-indigo-500 text-slate-950'
            }`}>
              {isSimulatedMobile || !effectiveAdminSupported ? (
                <Smartphone className="w-5 h-5 text-slate-950" />
              ) : (
                <Globe className="w-5 h-5 text-slate-950" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                  Platform Target & App Store Compliance
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                  isSimulatedMobile || !effectiveAdminSupported
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                }`}>
                  {isSimulatedMobile 
                    ? 'SIMULATED MOBILE (APK/AAB)' 
                    : !effectiveAdminSupported 
                    ? `NATIVE ${currentPlatform.toUpperCase()}` 
                    : 'WEB PLATFORM (PRODUCTION)'}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {isSimulatedMobile || !effectiveAdminSupported
                  ? 'Active in Mobile App Mode: Admin Panel, Passkey authenticators, and ROOT header buttons are completely stripped and inaccessible to users.'
                  : 'Web browser mode: Full Master Admin portal is enabled with passkey authentication. When compiling Android APK, AAB, or iOS packages, Admin controls are excluded.'}
              </p>
            </div>
          </div>

          {onToggleSimulatedMobile && (
            <button
              type="button"
              onClick={onToggleSimulatedMobile}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSimulatedMobile
                  ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 border-sky-400'
                  : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
              title="Toggle preview between Web and Mobile App (APK/AAB/iOS) view"
            >
              {isSimulatedMobile ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Return to Web Platform</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Preview Mobile App (APK/iOS) Mode</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3. Developer & Engine Verification Console (Unit Tests & Schema & API docs) */}
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                Engine Verification, Schemas & API
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Mathematical verification suite, PostgreSQL partition DDL, and real-time WebSocket protocol
              </p>
            </div>
          </div>

          {/* Subtabs */}
          <div
            className="flex rounded-lg border p-0.5 text-xs font-medium"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg)',
            }}
          >
            <button
              id="subtab-tests"
              onClick={() => setActiveArchTab('tests')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeArchTab === 'tests'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'hover:text-sky-400'
              }`}
              style={{
                color: activeArchTab === 'tests' ? '#ffffff' : 'var(--theme-text-muted)',
              }}
            >
              Unit Tests
            </button>
            <button
              id="subtab-schema"
              onClick={() => setActiveArchTab('schema')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeArchTab === 'schema'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'hover:text-sky-400'
              }`}
              style={{
                color: activeArchTab === 'schema' ? '#ffffff' : 'var(--theme-text-muted)',
              }}
            >
              Database Schema (PostgreSQL)
            </button>
            <button
              id="subtab-realtime"
              onClick={() => setActiveArchTab('realtime_api')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeArchTab === 'realtime_api'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'hover:text-sky-400'
              }`}
              style={{
                color: activeArchTab === 'realtime_api' ? '#ffffff' : 'var(--theme-text-muted)',
              }}
            >
              Real-Time Market API
            </button>
          </div>
        </div>

        {/* TAB 1: PRICING ENGINE UNIT TESTS */}
        {activeArchTab === 'tests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border text-xs" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
              <div>
                <span className="font-bold block" style={{ color: 'var(--theme-text-primary)' }}>
                  Community Power Share (CPS) Mathematical Engine Test Suite
                </span>
                <span style={{ color: 'var(--theme-text-secondary)' }}>
                  Tests baseline $0.0000001, 2-user proportional symmetry, Observer exclusion, and 1M stress tests.
                </span>
              </div>
              <button
                id="run-pricing-tests-btn"
                onClick={handleRunTests}
                disabled={testsRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{testsRunning ? 'Running Assertions...' : 'Execute Unit Tests'}</span>
              </button>
            </div>

            {testResults ? (
              <div className="space-y-2">
                {testResults.map((test, idx) => (
                  <div
                    key={idx}
                    id={`test-result-row-${idx}`}
                    className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: test.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.4)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {test.passed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                          {test.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-700/40 text-slate-400">
                          {test.category}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 ml-6" style={{ color: 'var(--theme-text-secondary)' }}>
                        {test.details}
                      </p>
                    </div>

                    <div className="text-right ml-6 sm:ml-0 shrink-0">
                      <span className="font-mono text-[11px] text-emerald-400">
                        {test.received}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        {test.durationMs}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border rounded-xl" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                <p className="text-xs">
                  Click <strong>"Execute Unit Tests"</strong> above to run verification assertions against the pricing formula.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POSTGRESQL DATABASE SCHEMA */}
        {activeArchTab === 'schema' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--theme-text-secondary)' }}>
                PostgreSQL Monthly Range Partitioning Schema with Indexing Strategy & Audit Trail:
              </span>
              <button
                id="copy-schema-btn"
                onClick={() => handleCopyCode(POSTGRESQL_TRANSACTION_SCHEMA)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs hover:border-sky-400 transition-colors"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copied DDL!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre
              className="p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[400px] border leading-relaxed"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: '#38bdf8',
              }}
            >
              {POSTGRESQL_TRANSACTION_SCHEMA}
            </pre>
          </div>
        )}

        {/* TAB 3: REAL-TIME MARKET API STRATEGY */}
        {activeArchTab === 'realtime_api' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--theme-text-secondary)' }}>
                WebSocket Protocol, Sliding Window Heartbeat & Presence Engine:
              </span>
              <button
                id="copy-api-docs-btn"
                onClick={() => handleCopyCode(REALTIME_API_INTEGRATION_STRATEGY)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs hover:border-sky-400 transition-colors"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copied Specs!' : 'Copy Specs'}</span>
              </button>
            </div>
            <pre
              className="p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[400px] border leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: '#e2e8f0',
              }}
            >
              {REALTIME_API_INTEGRATION_STRATEGY}
            </pre>
          </div>
        )}
      </div>

      {/* 4. Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={user}
        referralCount={referralCount}
        onConfirmDelete={() => {
          setShowDeleteModal(false);
          onDeleteAccount();
        }}
      />
    </div>
  );
};
