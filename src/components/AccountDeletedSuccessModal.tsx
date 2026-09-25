import React, { useState } from 'react';
import { 
  CheckCircle2, 
  UserPlus, 
  RotateCcw, 
  ShieldCheck, 
  Trash2, 
  Sparkles,
  X,
  Lock,
  FileX
} from 'lucide-react';

interface AccountDeletedSuccessModalProps {
  isOpen: boolean;
  deletedName: string;
  deletedHandle: string;
  onClose: () => void;
  onRegisterNewAccount: (name: string, handle: string) => void;
  onRestoreDemo: () => void;
}

export const AccountDeletedSuccessModal: React.FC<AccountDeletedSuccessModalProps> = ({
  isOpen,
  deletedName,
  deletedHandle,
  onClose,
  onRegisterNewAccount,
  onRestoreDemo,
}) => {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');

  if (!isOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const formattedHandle = newHandle.trim().startsWith('@') 
      ? newHandle.trim() 
      : `@${newHandle.trim() || newName.trim().toLowerCase().replace(/\s+/g, '_')}`;
    onRegisterNewAccount(newName.trim(), formattedHandle);
    setShowRegisterForm(false);
    onClose();
  };

  return (
    <div 
      id="account-deleted-success-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {/* Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 p-6 text-white text-center relative overflow-hidden border-b border-rose-500/20">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-rose-500/20">
            <Trash2 className="w-8 h-8 text-rose-400" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30">
            DATA PURGED PERMANENTLY
          </span>
          <h3 className="text-xl font-black mt-2 tracking-tight text-white">
            Account Permanently Deleted
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            All records for <strong className="text-white">{deletedName}</strong> ({deletedHandle}) have been permanently destroyed and cannot be recovered back.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!showRegisterForm ? (
            <>
              <div 
                className="p-3.5 rounded-2xl border space-y-2 text-xs"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Personal information completely erased</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>KYC documents & camera biometric scans destroyed</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Wallet disconnected & CPS token balances zeroed</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Affiliate network lineage severed</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  id="create-new-account-btn"
                  onClick={() => setShowRegisterForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register a Fresh Profile / Create New Account</span>
                </button>

                <button
                  id="restore-demo-profile-btn"
                  onClick={() => {
                    onRestoreDemo();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold hover:border-sky-500 transition-all"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  <RotateCcw className="w-4 h-4 text-sky-400" />
                  <span>Restore Demo Profile (Alex Rivera)</span>
                </button>

                <button
                  id="dismiss-deleted-modal-btn"
                  onClick={onClose}
                  className="w-full py-2 text-xs text-center transition-colors hover:underline"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Browse as Guest Observer
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                <h4 className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                  Create New Account
                </h4>
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="text-xs text-sky-400 hover:underline"
                >
                  &larr; Back
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
                    Your Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
                    Community Handle:
                  </label>
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="e.g. @jordan_h"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  Start Fresh
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
