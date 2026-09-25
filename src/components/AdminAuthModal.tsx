import React, { useState } from 'react';
import { Shield, KeyRound, Lock, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (success: boolean) => void;
  currentIsAdmin: boolean;
  onExitAdminSession: () => void;
}

// Master Admin Security Passkey (Can be customized by the owner)
export const MASTER_ADMIN_PASSKEY = '992811';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  currentIsAdmin,
  onExitAdminSession,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passkeyInput.trim() === MASTER_ADMIN_PASSKEY) {
      setSuccess(true);
      setTimeout(() => {
        onAuthenticate(true);
        setSuccess(false);
        setPasskeyInput('');
        onClose();
      }, 700);
    } else {
      setError('Access Denied: Invalid Master Admin Passkey. Please verify your administrator credentials.');
      setPasskeyInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl border border-sky-500/40 p-6 sm:p-7 shadow-2xl relative space-y-5"
        style={{ backgroundColor: '#090e1a' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20 shrink-0">
            <Shield className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Master Admin Authentication
            </h2>
            <p className="text-xs text-slate-400">
              Role-Based Access Control (RBAC) Gate
            </p>
          </div>
        </div>

        {currentIsAdmin ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold">Active Root Session</div>
                <div className="text-[11px] text-emerald-400/80">You are currently authenticated with Super Admin privileges.</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onExitAdminSession();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Exit Admin Session (Lock Down Access)</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center justify-between">
                <span>Enter Master Passkey / PIN:</span>
                <span className="text-[10px] text-sky-400 font-mono">Owner Security Key</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  maxLength={12}
                  value={passkeyInput}
                  onChange={(e) => {
                    setPasskeyInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter 6-digit Master PIN..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm tracking-widest focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Passkey Accepted. Elevating privileges to Super Admin...</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard users cannot view or manipulate pricing algorithms, treasury tokens, user records, or platform kill-switches without this cryptographic authorization.
            </p>

            <button
              type="submit"
              disabled={!passkeyInput || success}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-slate-950" />
              <span>Verify & Unlock Master Admin Control</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
