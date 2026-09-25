import React, { useState } from 'react';
import { 
  Tv, 
  Check, 
  Copy, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  Layers, 
  Coins, 
  LayoutTemplate, 
  Sliders, 
  ExternalLink,
  Info,
  PlayCircle,
  Eye,
  CheckCircle2,
  Clock,
  Radio,
  FileCode
} from 'lucide-react';
import { PlatformConfig, AdMobConfig } from '../types';

interface AdminAdMobTabProps {
  platformConfig: PlatformConfig;
  onUpdatePlatformConfig: (updater: (prev: PlatformConfig) => PlatformConfig) => void;
  onAddAuditLog: (action: string, category: any, details: string) => void;
  onTriggerTestAd?: (type: 'app_open' | 'interstitial' | 'rewarded') => void;
  allUsers?: Array<{
    id: string;
    uniqueId: string;
    name: string;
    handle: string;
    avatar: string;
    tier: string;
    isOnline: boolean;
    adsWatchedCount?: number;
    isCurrentLoggedInUser?: boolean;
    isAdmin?: boolean;
  }>;
}

// Google AdMob Official Test IDs
const GOOGLE_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const GOOGLE_TEST_APP_OPEN_ID = 'ca-app-pub-3940256099942544/3419832817';
const GOOGLE_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const GOOGLE_TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const GOOGLE_TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

export const AdminAdMobTab: React.FC<AdminAdMobTabProps> = ({
  platformConfig,
  onUpdatePlatformConfig,
  onAddAuditLog,
  onTriggerTestAd,
  allUsers = [],
}) => {
  const currentConfig: AdMobConfig = platformConfig.adMob || {
    enabled: true,
    testMode: true,
    appId: GOOGLE_TEST_APP_ID,
    appOpenAdUnitId: GOOGLE_TEST_APP_OPEN_ID,
    appOpenAdEnabled: true,
    bannerAdUnitId: GOOGLE_TEST_BANNER_ID,
    bannerAdsEnabled: true,
    interstitialAdUnitId: GOOGLE_TEST_INTERSTITIAL_ID,
    interstitialAdsEnabled: true,
    interstitialRateLimitMinutes: 3,
    rewardedVideoAdUnitId: GOOGLE_TEST_REWARDED_ID,
    rewardedVideoAdEnabled: true,
    rewardVideoTokenBonus: 0,
  };

  // Local form state
  const [form, setForm] = useState<AdMobConfig>(currentConfig);
  const [savedToast, setSavedToast] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const totalAdsWatched = allUsers.reduce((sum, u) => sum + (u.adsWatchedCount || 0), 0);
  const activeWatchersCount = allUsers.filter((u) => (u.adsWatchedCount || 0) > 0).length;

  const filteredUserAds = allUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.handle.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const handleCopy = (text: string, fieldId: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleSave = () => {
    onUpdatePlatformConfig((prev) => ({
      ...prev,
      adMob: form,
    }));

    try {
      localStorage.setItem('cps_admob_config', JSON.stringify(form));
    } catch {
      // ignore
    }

    onAddAuditLog(
      'AdMob Configuration Updated',
      'admob',
      `Saved AdMob settings: App ID: ${form.appId.slice(0, 14)}..., TestMode=${form.testMode ? 'ON' : 'OFF'}, Master=${form.enabled ? 'Active' : 'Disabled'}`
    );

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleLoadGoogleTestIds = () => {
    setForm((prev) => ({
      ...prev,
      testMode: true,
      appId: GOOGLE_TEST_APP_ID,
      appOpenAdUnitId: GOOGLE_TEST_APP_OPEN_ID,
      bannerAdUnitId: GOOGLE_TEST_BANNER_ID,
      interstitialAdUnitId: GOOGLE_TEST_INTERSTITIAL_ID,
      rewardedVideoAdUnitId: GOOGLE_TEST_REWARDED_ID,
    }));
  };

  // Helper validation format check
  const isValidAppId = form.appId.includes('~') && form.appId.startsWith('ca-app-pub-');
  const isValidAdUnit = (id: string) => id.includes('/') && id.startsWith('ca-app-pub-');

  return (
    <div className="space-y-6">
      {/* Toast Confirmation */}
      {savedToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>AdMob App ID & Ad Unit IDs successfully applied and synchronized across the platform!</span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
            Active
          </span>
        </div>
      )}

      {/* Header Overview & Controls Card */}
      <div 
        className="p-6 rounded-3xl border relative overflow-hidden transition-all shadow-lg"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Tv className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  Google AdMob Monetization Manager
                </h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  form.enabled 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${form.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {form.enabled ? 'Ad Serving Active' : 'Ad Serving Disabled'}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  form.testMode 
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                    : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                }`}>
                  {form.testMode ? 'Google Test Mode' : 'Live Production'}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Configure your official Google AdMob App ID and granular Ad Unit IDs (App Open, Banner, Interstitial, and Rewarded Video).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleLoadGoogleTestIds}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold hover:border-amber-500/50 hover:text-amber-300 transition-all font-mono"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
              title="Fill fields with standard Google AdMob demo IDs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Google Test IDs</span>
            </button>

            <button
              type="button"
              id="admin-save-admob-btn"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all hover:scale-102 active:scale-98 font-mono cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save AdMob Settings</span>
            </button>
          </div>
        </div>

        {/* Master Toggles Row */}
        <div className="mt-6 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderColor: 'var(--theme-border)' }}>
          {/* Master Toggle */}
          <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <div>
              <div className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                Master Ad Serving Switch
              </div>
              <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Global kill-switch for all banners, interstitials and video ads
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Test Mode Toggle */}
          <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
            <div>
              <div className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                Test Ads Mode
              </div>
              <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Enables official AdMob test banners and test dialogs safely
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.testMode}
                onChange={(e) => setForm((prev) => ({ ...prev, testMode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 1. ADMOB APPLICATION ID (APP ID) */}
      <div 
        className="p-6 rounded-3xl border transition-all shadow-md"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                Google AdMob Application ID (App ID)
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Assigned in your Google AdMob console when creating the application profile
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isValidAppId ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {isValidAppId ? 'Valid Format' : 'Check Format (~)'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="admob-app-id-input"
                value={form.appId}
                onChange={(e) => setForm((prev) => ({ ...prev, appId: e.target.value }))}
                placeholder="ca-app-pub-3940256099942544~3347511713"
                className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border transition-all focus:outline-none focus:border-sky-500"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleCopy(form.appId, 'appId')}
              className="px-3 py-2.5 rounded-xl border text-xs font-semibold hover:border-sky-500 transition-all flex items-center gap-1 shrink-0"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
              title="Copy App ID"
            >
              {copiedField === 'appId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'appId' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-sky-400 shrink-0" />
            <span>Format: <code className="text-sky-300">ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</code> (Contains a tilde ~)</span>
          </p>
        </div>
      </div>

      {/* 2. AD UNITS CONFIGURATION (4 DISTINCT FORMATS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-sky-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Granular Ad Unit IDs & Placement Parameters</span>
          </h3>
          <span className="text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>
            4 Ad Units Configured
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: App Open Ad */}
          <div 
            className="p-5 rounded-3xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      1. App Open Ad Unit
                    </h4>
                    <span className="text-[10px] text-purple-300 font-mono">Launch Splash Overlay</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.appOpenAdEnabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, appOpenAdEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <p className="text-[11px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                Displayed automatically when users open or resume the application. Shows brand header with 3s timer and skip option.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase" style={{ color: 'var(--theme-text-secondary)' }}>
                  Ad Unit ID
                </label>
                <input
                  type="text"
                  value={form.appOpenAdUnitId}
                  onChange={(e) => setForm((prev) => ({ ...prev, appOpenAdUnitId: e.target.value }))}
                  placeholder="ca-app-pub-3940256099942544/3419832817"
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-purple-500"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--theme-border)' }}>
              <span className={`text-[10px] font-mono ${isValidAdUnit(form.appOpenAdUnitId) ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isValidAdUnit(form.appOpenAdUnitId) ? '✓ Valid Unit Format' : 'Notice: Expects ca-app-pub-.../...'}
              </span>
              {onTriggerTestAd && (
                <button
                  type="button"
                  onClick={() => onTriggerTestAd('app_open')}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-[10px] font-bold font-mono transition-all flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Test Ad Dialog</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Banner Ads */}
          <div 
            className="p-5 rounded-3xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <LayoutTemplate className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      2. Banner Ads Unit
                    </h4>
                    <span className="text-[10px] text-sky-300 font-mono">Standard 320x50 & Adaptive</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.bannerAdsEnabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, bannerAdsEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              <p className="text-[11px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                Integrated in 5 strategic locations: Dashboard bottom, Community registry (every 10 users), Airdrop, My Shares, and Wallet.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase" style={{ color: 'var(--theme-text-secondary)' }}>
                  Ad Unit ID
                </label>
                <input
                  type="text"
                  value={form.bannerAdUnitId}
                  onChange={(e) => setForm((prev) => ({ ...prev, bannerAdUnitId: e.target.value }))}
                  placeholder="ca-app-pub-3940256099942544/6300978111"
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-sky-500"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--theme-border)' }}>
              <span className={`text-[10px] font-mono ${isValidAdUnit(form.bannerAdUnitId) ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isValidAdUnit(form.bannerAdUnitId) ? '✓ Valid Unit Format' : 'Notice: Expects ca-app-pub-.../...'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300">
                5 Placements Active
              </span>
            </div>
          </div>

          {/* Card 3: Interstitial Ads */}
          <div 
            className="p-5 rounded-3xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      3. Interstitial Ads Unit
                    </h4>
                    <span className="text-[10px] text-indigo-300 font-mono">Full-Page Transitions & Drive Button</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.interstitialAdsEnabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, interstitialAdsEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>

              <p className="text-[11px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                Triggers on "Drive the price" clicks and view transitions with an anti-spam rate limiter.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase" style={{ color: 'var(--theme-text-secondary)' }}>
                    Ad Unit ID
                  </label>
                  <input
                    type="text"
                    value={form.interstitialAdUnitId}
                    onChange={(e) => setForm((prev) => ({ ...prev, interstitialAdUnitId: e.target.value }))}
                    placeholder="ca-app-pub-3940256099942544/1033173712"
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span style={{ color: 'var(--theme-text-secondary)' }}>View Switch Rate Limiter:</span>
                    <span className="font-mono font-bold text-indigo-300">
                      Once every {form.interstitialRateLimitMinutes} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={form.interstitialRateLimitMinutes}
                    onChange={(e) => setForm((prev) => ({ ...prev, interstitialRateLimitMinutes: parseInt(e.target.value, 10) }))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--theme-border)' }}>
              <span className={`text-[10px] font-mono ${isValidAdUnit(form.interstitialAdUnitId) ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isValidAdUnit(form.interstitialAdUnitId) ? '✓ Valid Unit Format' : 'Notice: Expects ca-app-pub-.../...'}
              </span>
              {onTriggerTestAd && (
                <button
                  type="button"
                  onClick={() => onTriggerTestAd('interstitial')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-[10px] font-bold font-mono transition-all flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Test Ad Dialog</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 4: Rewarded Video Ad */}
          <div 
            className="p-5 rounded-3xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      4. Rewarded Video Ad Unit
                    </h4>
                    <span className="text-[10px] text-amber-300 font-mono">Watch-to-Earn & Daily Active</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rewardedVideoAdEnabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, rewardedVideoAdEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <p className="text-[11px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                Launched by clicking the animated header coin button in the title. Increments user's watch counter (+1) and certifies user as Daily Active.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase" style={{ color: 'var(--theme-text-secondary)' }}>
                    Ad Unit ID
                  </label>
                  <input
                    type="text"
                    value={form.rewardedVideoAdUnitId}
                    onChange={(e) => setForm((prev) => ({ ...prev, rewardedVideoAdUnitId: e.target.value }))}
                    placeholder="ca-app-pub-3940256099942544/5224354917"
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                  />
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                    <span>Reward Incentive:</span>
                    <span>+1 Ad Watch Counter (No CPS Payout)</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Zero token dilution: only increments the user's verifiable Ad Watch Counter and validates Daily Active status. No tokens are added to user wallet.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--theme-border)' }}>
              <span className={`text-[10px] font-mono ${isValidAdUnit(form.rewardedVideoAdUnitId) ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isValidAdUnit(form.rewardedVideoAdUnitId) ? '✓ Valid Unit Format' : 'Notice: Expects ca-app-pub-.../...'}
              </span>
              {onTriggerTestAd && (
                <button
                  type="button"
                  onClick={() => onTriggerTestAd('rewarded')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold font-mono transition-all flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Test Ad Dialog</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. USER-BY-USER AD WATCH COUNTER TELEMETRY DIRECTORY */}
      <div 
        className="p-6 rounded-3xl border transition-all space-y-5"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--theme-text-primary)' }}>
                User Ad Watch Telemetry (Total Ads Watched Per User)
              </h3>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Real-time audit log of how many sponsored video ads each registered user has fully watched to qualify for Daily Active consensus.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Network Total:</span>
              <strong className="text-sm text-white font-black">{totalAdsWatched} Ads</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Active Watchers:</span>
              <strong className="text-sm text-white font-black">{activeWatchersCount} Users</strong>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search user by name or handle..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="w-full max-w-sm px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-amber-500"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            Showing {filteredUserAds.length} Members
          </span>
        </div>

        {/* User Watch Counts Table */}
        <div className="overflow-x-auto border rounded-2xl" style={{ borderColor: 'var(--theme-border)' }}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-slate-900/40 text-slate-400 font-bold" style={{ borderColor: 'var(--theme-border)' }}>
                <th className="p-3">User Member</th>
                <th className="p-3">Network Role</th>
                <th className="p-3">Total Ads Watched</th>
                <th className="p-3">Daily Active Status</th>
                <th className="p-3">Est. Ad Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {filteredUserAds.map((u) => {
                const count = u.adsWatchedCount || 0;
                const isActuator = u.tier !== 'free';
                const estRevenueUsd = (count * 0.02).toFixed(2);

                return (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
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
                          <div className="text-[10px] font-mono text-slate-400">{u.handle}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isActuator
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/40 text-slate-400'
                      }`}>
                        {isActuator ? 'Actuator' : 'Observer'}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-xs font-black shadow-sm">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{count}</span>
                        <span className="text-[10px] text-amber-400/70 font-normal">Watched</span>
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold ${
                        count > 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        {count > 0 ? 'Daily Active ✅' : 'Inactive'}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-xs font-bold text-sky-400">
                      ~${estRevenueUsd} USD
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ANDROID MANIFEST & DEPLOYMENT SNIPPET */}
      <div 
        className="p-6 rounded-3xl border transition-all"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <h4 className="font-extrabold text-xs sm:text-sm" style={{ color: 'var(--theme-text-primary)' }}>
              Native Android Integration (AndroidManifest.xml)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(`<meta-data\n    android:name="com.google.android.gms.ads.APPLICATION_ID"\n    android:value="${form.appId}"/>`, 'manifest')}
            className="px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold hover:border-sky-500 transition-all flex items-center gap-1"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            {copiedField === 'manifest' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedField === 'manifest' ? 'Copied' : 'Copy XML Snippet'}</span>
          </button>
        </div>

        <p className="text-[11px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          When bundling for Android APK/AAB via Capacitor or Android Studio, add your configured App ID inside the <code className="text-sky-300">&lt;application&gt;</code> tag:
        </p>

        <pre 
          className="p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border text-emerald-300 select-all"
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)',
          }}
        >
{`<manifest>
    <application>
        <!-- Sample AdMob App ID: replace with your production ID when releasing -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${form.appId}"/>
    </application>
</manifest>`}
        </pre>
      </div>
    </div>
  );
};
