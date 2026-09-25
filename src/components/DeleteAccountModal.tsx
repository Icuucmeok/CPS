import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  UserX, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Coins, 
  FileText, 
  Wallet, 
  Users,
  Lock,
  ArrowRight
} from 'lucide-react';
import { UserProfile } from '../types';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  referralCount?: number;
  onConfirmDelete: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  referralCount = 0,
  onConfirmDelete,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStepText, setDeleteStepText] = useState('Purging user credentials...');

  if (!isOpen) return null;

  const requiredCode = 'DELETE';
  const isMatch = 
    confirmationText.trim().toUpperCase() === requiredCode || 
    confirmationText.trim().toLowerCase() === user.handle.toLowerCase();

  const canProceed = isMatch && hasAcknowledged && !isDeleting;

  const handleDelete = () => {
    if (!canProceed) return;
    setIsDeleting(true);

    // Realistic progress animation showing explicit destruction of all data
    setDeleteStepText('Purging personal profile & unique ID...');
    setTimeout(() => {
      setDeleteStepText('Shredding KYC identity records & biometric camera captures...');
    }, 400);

    setTimeout(() => {
      setDeleteStepText('Zeroing CPS token holdings & clearing wallet connections...');
    }, 800);

    setTimeout(() => {
      setDeleteStepText('Severing affiliate downline tree & active subscriptions...');
    }, 1200);

    setTimeout(() => {
      setIsDeleting(false);
      onConfirmDelete();
    }, 1600);
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmationText('');
    setHasAcknowledged(false);
    onClose();
  };

  return (
    <div 
      id="delete-account-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: '#f43f5e',
        }}
      >
        {/* Header with high-urgency red/rose danger banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 p-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base tracking-tight">
                    Permanent Account Deletion
                  </h3>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-white/25 text-white">
                    Irreversible
                  </span>
                </div>
                <p className="text-xs text-rose-100 mt-0.5">
                  All personal info will be permanently deleted and cannot be recovered back.
                </p>
              </div>
            </div>

            {!isDeleting && (
              <button
                id="close-delete-modal-btn"
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* User Being Deleted Badge */}
          <div 
            className="p-3.5 rounded-2xl border flex items-center justify-between"
            style={{ 
              backgroundColor: 'var(--theme-bg)', 
              borderColor: 'var(--theme-border)' 
            }}
          >
            <div className="flex items-center gap-3">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-11 h-11 rounded-xl object-cover border"
                style={{ borderColor: 'var(--theme-border)' }}
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                  {user.name}
                </div>
                <div className="text-xs font-mono text-rose-400">
                  {user.handle} • ID: {user.uniqueId}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                PENDING PURGE
              </span>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-rose-300">
                Are you absolutely sure you want to delete your account?
              </span>
              <p className="text-[11px] leading-relaxed text-rose-300/90">
                This action is <strong>permanent</strong>. Once your profile is deleted, there is no way to undo it. You will forfeit all wallet shares, verification badges, cash balances, and referral commissions permanently.
              </p>
            </div>
          </div>

          {/* Detailed Itemized Purge Checklist */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              The following information will be completely and permanently erased:
            </span>
            <div className="space-y-2 text-xs">
              <div 
                className="p-2.5 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <UserX className="w-4 h-4 text-rose-400 shrink-0" />
                  <span style={{ color: 'var(--theme-text-secondary)' }}>
                    Personal Profile, Display Name & Community Handle
                  </span>
                </div>
                <span className="font-mono text-[11px] text-rose-400 font-bold">WIPED</span>
              </div>

              <div 
                className="p-2.5 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <span style={{ color: 'var(--theme-text-secondary)' }}>
                    KYC Compliance, Documents, WhatsApp & Camera Biometrics
                  </span>
                </div>
                <span className="font-mono text-[11px] text-rose-400 font-bold">SHREDDED</span>
              </div>

              <div 
                className="p-2.5 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-rose-400 shrink-0" />
                  <span style={{ color: 'var(--theme-text-secondary)' }}>
                    {user.sharexBalance.toLocaleString()} CP Shares & ${(user.usdCashBalance || 0).toFixed(2)} USD Cash
                  </span>
                </div>
                <span className="font-mono text-[11px] text-rose-400 font-bold">FORFEITED</span>
              </div>

              <div 
                className="p-2.5 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-rose-400 shrink-0" />
                  <span style={{ color: 'var(--theme-text-secondary)' }}>
                    Wallet Address ({user.walletAddress.slice(0, 10)}...) & History
                  </span>
                </div>
                <span className="font-mono text-[11px] text-rose-400 font-bold">DISCONNECTED</span>
              </div>

              <div 
                className="p-2.5 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-rose-400 shrink-0" />
                  <span style={{ color: 'var(--theme-text-secondary)' }}>
                    Referral Network & Affiliate Commissions ({referralCount} leads)
                  </span>
                </div>
                <span className="font-mono text-[11px] text-rose-400 font-bold">TERMINATED</span>
              </div>
            </div>
          </div>

          {/* Deletion In Progress Animation */}
          {isDeleting ? (
            <div 
              className="p-5 rounded-2xl border text-center space-y-3 animate-pulse"
              style={{ 
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                borderColor: '#f43f5e'
              }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/20 text-rose-400">
                <Trash2 className="w-6 h-6 animate-bounce" />
              </div>
              <h4 className="font-bold text-sm text-rose-400">
                Permanently Deleting Account...
              </h4>
              <p className="text-xs text-rose-300/80 font-mono">
                {deleteStepText}
              </p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-1.5 rounded-full animate-[shimmer_1.5s_infinite] w-full" />
              </div>
            </div>
          ) : (
            /* Safety Confirmation Inputs */
            <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              {/* Checkbox acknowledgement */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="acknowledge-account-deletion-check"
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                  I explicitly acknowledge and confirm that <strong>all my account information, token balances, and KYC documents will be permanently wiped</strong> and will never be recovered back.
                </span>
              </label>

              {/* Text Confirmation Input */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="delete-confirmation-input"
                  className="block text-xs font-semibold"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Type <span className="font-mono text-rose-400 font-black px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">DELETE</span> or your handle <span className="font-mono text-rose-400 font-black px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">{user.handle}</span> to confirm:
                </label>
                <input
                  id="delete-confirmation-input"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`Type DELETE to confirm`}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: isMatch ? '#f43f5e' : 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              id="cancel-delete-account-btn"
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            >
              Cancel & Keep Account
            </button>

            <button
              id="confirm-delete-account-btn"
              type="button"
              onClick={handleDelete}
              disabled={!canProceed}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canProceed ? '#e11d48' : '#9f1239',
                boxShadow: canProceed ? '0 10px 25px -5px rgba(225, 29, 72, 0.4)' : 'none',
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span>Permanently Delete All Account Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
