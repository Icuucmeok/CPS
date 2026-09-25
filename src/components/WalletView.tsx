import React, { useState } from 'react';
import { 
  History, 
  Download, 
  CheckCircle, 
  DollarSign, 
  Share2, 
  Percent,
  Plus,
  Minus
} from 'lucide-react';
import { Transaction, UserProfile, ReferralRecord } from '../types';
import { formatCryptoPrice } from '../utils/pricingEngine';
import { AdMobBanner } from './ads/AdMobBanner';

interface WalletViewProps {
  user: UserProfile;
  currentPrice: number;
  transactions: Transaction[];
  referrals?: ReferralRecord[];
  onExecuteTrade?: (type: 'buy' | 'sell', tokenAmount: number, usdTotal: number) => void;
  onOpenMembership?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  currentPrice,
  transactions,
  referrals = [],
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'buy' | 'sell' | 'subscription' | 'dividend'>('all');

  // Math for Total Shares and Multiplied Worth
  const totalShares = user.sharexBalance;
  const worthOfShares = totalShares * currentPrice; // Multiplied with current dynamic price

  // Referral shares earned
  const referralSharesEarned = referrals.reduce((sum, r) => sum + r.rewardCoinsSponsor, 0) || 3;

  // Market Center Commission earned
  const marketCenterCommissionEarned = 18.45; // USD Commission earned from Market Center

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    return tx.type === activeTab;
  });

  const handleExportCsv = () => {
    const headers = 'ID,Type,TokenAmount,TokenPriceUSD,TotalUSD,Timestamp,Status,TxHash\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.type}",${t.tokenAmount},${t.tokenPrice},${t.usdTotal},"${t.timestamp}","${t.status}","${t.txHash}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cps_transactions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP CARD: Total Shares You Have + Below Worth of Shares (Shares * Price) */}
      {/* ========================================================================= */}
      <div
        id="wallet-top-shares-card"
        className="rounded-3xl border p-6 sm:p-7 relative overflow-hidden transition-all shadow-xl"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="relative z-10 space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
            Total Shares You Have
          </span>

          {/* Big Total Shares Number */}
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-5xl font-black font-mono tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {totalShares.toLocaleString()}
            </h1>
            <span className="text-sm font-bold text-sky-400 font-mono">
              CPS Shares
            </span>
          </div>

          {/* Below Worth of Shares: Multiplied with Current Price */}
          <div 
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              Worth of Shares:
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
              ${worthOfShares.toFixed(4)} USD
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({totalShares.toLocaleString()} × {formatCryptoPrice(currentPrice)})
            </span>
          </div>

          <div className="text-xs pt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Connected Wallet: <span className="font-mono text-sky-400">{user.walletAddress}</span>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* DOWN CARDS (3 CARDS):                                                     */}
      {/* 1. How many shares earned from referrals                                  */}
      {/* 2. How much commission earned from Market Center                          */}
      {/* 3. $ Balance (USD cash balance)                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Shares Earned From Referrals */}
        <div 
          id="card-referral-shares-earned"
          className="p-5 sm:p-6 rounded-2xl border transition-all shadow-md relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-sky-400">
                Shares Earned
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-sky-300 mt-2">
              +{referralSharesEarned.toLocaleString()} Shares
            </div>
          </div>
          <div className="mt-4 pt-3 border-t text-xs flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
            <span style={{ color: 'var(--theme-text-muted)' }}>Reward Model</span>
            <span className="font-semibold text-emerald-400">+1 CP Share per Teammate</span>
          </div>
        </div>

        {/* Card 2: Commission Earned from Market Center */}
        <div 
          id="card-market-center-commission"
          className="p-5 sm:p-6 rounded-2xl border transition-all shadow-md relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                Market Center Commission
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300 mt-2">
              ${marketCenterCommissionEarned.toFixed(2)} USD
            </div>
          </div>
          <div className="mt-4 pt-3 border-t text-xs flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
            <span style={{ color: 'var(--theme-text-muted)' }}>Trading Fee Rebates</span>
            <span className="font-semibold text-sky-400">Market Maker Volume</span>
          </div>
        </div>

        {/* Card 3: $ Balance (USD Cash Balance) */}
        <div 
          id="card-usd-cash-balance"
          className="p-5 sm:p-6 rounded-2xl border transition-all shadow-md relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                $ Balance (USD)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-2">
              ${user.usdCashBalance.toFixed(2)} USD
            </div>
          </div>
          <div className="mt-4 pt-3 border-t text-xs flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
            <span style={{ color: 'var(--theme-text-muted)' }}>Available Cash</span>
            <span className="font-semibold text-emerald-400">Spot Buys Ready</span>
          </div>
        </div>
      </div>

      {/* AdMob Banner Ad: Directly Under the Balance USD Card */}
      <div>
        <AdMobBanner placement="wallet_balance" />
      </div>

      {/* ========================================================================= */}
      {/* Transaction History Section                                               */}
      {/* ========================================================================= */}
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
              Transaction History
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div
              className="flex rounded-lg border p-0.5 text-xs font-medium"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg)',
              }}
            >
              {(['all', 'buy', 'sell', 'subscription', 'dividend'] as const).map((tab) => (
                <button
                  key={tab}
                  id={`tx-filter-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-sky-500 text-white font-bold'
                      : 'hover:text-sky-400'
                  }`}
                  style={{
                    color: activeTab === tab ? '#ffffff' : 'var(--theme-text-muted)',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              id="export-csv-btn"
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs hover:border-sky-500/40 transition-colors"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
              title="Export transaction ledger to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">CPS Tokens</th>
                <th className="pb-3 font-semibold">Execution Price</th>
                <th className="pb-3 font-semibold">Total USD</th>
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {filteredTransactions.map((tx) => {
                const isBuy = tx.type === 'buy';
                const isSell = tx.type === 'sell';
                const isSub = tx.type === 'subscription';

                return (
                  <tr key={tx.id} id={`tx-row-${tx.id}`} className="hover:bg-sky-500/5 transition-colors">
                    {/* Type Badge */}
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isBuy
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isSell
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : isSub
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {isBuy && <Plus className="w-2.5 h-2.5" />}
                        {isSell && <Minus className="w-2.5 h-2.5" />}
                        {tx.type}
                      </span>
                    </td>

                    {/* CPS Tokens */}
                    <td className="py-3 font-mono font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                      {tx.tokenAmount > 0 ? `${tx.tokenAmount.toLocaleString()} CPS` : '-'}
                    </td>

                    {/* Execution Price */}
                    <td className="py-3 font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                      {tx.tokenPrice > 0 ? `$${tx.tokenPrice.toFixed(8)}` : '-'}
                    </td>

                    {/* Total USD */}
                    <td className="py-3 font-mono font-semibold text-sky-400">
                      ${tx.usdTotal.toFixed(2)}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 text-[11px]" style={{ color: 'var(--theme-text-secondary)' }}>
                      {new Date(tx.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })}{' '}
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Status */}
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </td>

                    {/* TxHash */}
                    <td className="py-3 text-right font-mono text-[11px]">
                      <span className="text-sky-400 hover:underline inline-flex items-center gap-0.5">
                        {tx.txHash}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
