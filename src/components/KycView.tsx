import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  Upload, 
  FileText, 
  Phone, 
  Mail, 
  CreditCard, 
  UserCheck, 
  RefreshCw, 
  Lock, 
  Sparkles, 
  ExternalLink,
  Info,
  Check,
  Building2,
  Globe2
} from 'lucide-react';
import { KycData, UserProfile } from '../types';

interface KycViewProps {
  user: UserProfile;
  onOpenKycModal: () => void;
  onResetKyc?: () => void;
}

export const KycView: React.FC<KycViewProps> = ({
  user,
  onOpenKycModal,
  onResetKyc,
}) => {
  const kyc = user.kyc || {
    status: 'unverified',
    whatsapp: '',
    email: 'alex.rivera@cps.network',
    docType: 'passport',
    docNumber: '',
  };

  const isVerified = kyc.status === 'verified';

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Title / Banner */}
      <div 
        className="rounded-3xl p-6 sm:p-8 border relative overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-sky-400 uppercase">
                  FINANCIAL REGULATORY COMPLIANCE
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  Know Your Customer (KYC)
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm max-w-xl" style={{ color: 'var(--theme-text-secondary)' }}>
              To ensure platform security and anti-money laundering compliance, every user must verify their identity using WhatsApp, verified email, official Government ID (Passport or Driving License), and a live facial camera selfie.
            </p>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isVerified ? (
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>KYC Certified & Active</span>
              </div>
            ) : (
              <button
                id="kyc-page-verify-now-btn"
                onClick={onOpenKycModal}
                className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 animate-pulse"
              >
                <Camera className="w-4 h-4" />
                <span>Verify KYC Now</span>
              </button>
            )}

            {isVerified && onResetKyc && (
              <button
                onClick={onResetKyc}
                className="px-4 py-3 rounded-2xl border text-xs font-semibold hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                Re-submit Documents
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KYC Status Card */}
      <div 
        className="rounded-3xl border p-6 transition-all"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isVerified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                Account Verification Status
              </h3>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Associated Unique ID: <span className="font-mono text-sky-400">{user.uniqueId}</span>
              </p>
            </div>
          </div>

          <span 
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
              isVerified 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
            }`}
          >
            {isVerified ? 'VERIFIED PASSED' : 'UNVERIFIED / PENDING'}
          </span>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* 1. WhatsApp */}
          <div 
            className="p-4 rounded-2xl border relative overflow-hidden"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Phone className="w-4 h-4" />
              </div>
              {isVerified ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-amber-400 font-bold">Required</span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-400">WhatsApp Channel</p>
            <p className="text-sm font-bold mt-1 font-mono truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {kyc.whatsapp || 'Not linked'}
            </p>
          </div>

          {/* 2. Email Address */}
          <div 
            className="p-4 rounded-2xl border relative overflow-hidden"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Mail className="w-4 h-4" />
              </div>
              {isVerified ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-amber-400 font-bold">Required</span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-400">Email Address</p>
            <p className="text-sm font-bold mt-1 font-mono truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {kyc.email || 'alex.rivera@cps.network'}
            </p>
          </div>

          {/* 3. Government ID / Passport / DL */}
          <div 
            className="p-4 rounded-2xl border relative overflow-hidden"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <CreditCard className="w-4 h-4" />
              </div>
              {isVerified ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-amber-400 font-bold">Required</span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-400">Government ID / Passport</p>
            <p className="text-sm font-bold mt-1 uppercase font-mono truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {isVerified ? `${kyc.docType.replace('_', ' ')} (${kyc.docNumber || 'Verified'})` : 'Passport or Driving License'}
            </p>
          </div>

          {/* 4. Live Camera Face Selfie */}
          <div 
            className="p-4 rounded-2xl border relative overflow-hidden"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <Camera className="w-4 h-4" />
              </div>
              {isVerified ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-amber-400 font-bold">Required</span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-400">Live Face Camera</p>
            <p className="text-sm font-bold mt-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {isVerified ? 'Biometric Face Match' : 'Selfie with Webcam'}
            </p>
          </div>
        </div>

        {/* Action Prompt if not verified */}
        {!isVerified && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200">
                You have not completed identity verification yet. Complete verification now to claim full airdrop share withdrawals and activate permanent dynamic pricing rights.
              </p>
            </div>
            <button
              onClick={onOpenKycModal}
              className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-md"
            >
              Start KYC Process
            </button>
          </div>
        )}
      </div>

      {/* Verification Evidence Cards */}
      {isVerified && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Preview Card */}
          <div 
            className="p-6 rounded-3xl border space-y-3"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Submitted Official ID Photo</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                ENCRYPTED AES-256
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
              <img 
                src={kyc.docPhotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'} 
                alt="Government ID" 
                className="max-h-48 rounded-xl object-cover"
              />
            </div>
            <div className="text-[11px] flex justify-between" style={{ color: 'var(--theme-text-muted)' }}>
              <span>ID Type: <b className="text-white uppercase">{kyc.docType}</b></span>
              <span>Serial: <b className="font-mono text-sky-400">{kyc.docNumber || 'A948201948'}</b></span>
            </div>
          </div>

          {/* Face Camera Selfie Preview Card */}
          <div 
            className="p-6 rounded-3xl border space-y-3"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Live Camera Face Verification</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                99.8% MATCH
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-4">
              <div className="relative">
                <img 
                  src={kyc.facePhotoUrl || user.avatar} 
                  alt="Face Selfie" 
                  className="w-36 h-36 rounded-full object-cover border-4 border-emerald-400 shadow-xl"
                />
                <span className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                  <Check className="w-4 h-4" />
                </span>
              </div>
            </div>
            <div className="text-[11px] flex justify-between" style={{ color: 'var(--theme-text-muted)' }}>
              <span>Biometric ID: <b className="font-mono text-emerald-400">PASS_CERT_OK</b></span>
              <span>Timestamp: <b className="text-white">{kyc.verifiedAt ? new Date(kyc.verifiedAt).toLocaleDateString() : 'Active'}</b></span>
            </div>
          </div>
        </div>
      )}

      {/* Regulatory & Security Compliance info */}
      <div 
        className="p-6 rounded-3xl border text-xs space-y-2"
        style={{
          backgroundColor: 'var(--theme-bg)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-secondary)',
        }}
      >
        <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
          <Lock className="w-4 h-4 text-sky-400" />
          <span>Privacy & Data Protection Notice</span>
        </div>
        <p>
          All biometric face photographs, government identification documents (passport, driving license, national ID), phone numbers, and emails are securely encrypted with AES-256 standard protocols. No identity data is shared with external ad networks or third parties.
        </p>
      </div>
    </div>
  );
};
