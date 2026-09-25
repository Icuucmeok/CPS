import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Clock,
  DollarSign,
  AlertCircle,
  X,
  Share2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { ActuatorCard, ActuatorPlanDuration, CommunityMember, UserProfile, AdminAuditLog } from '../types';
import { ACTUATOR_PLANS, generateActuatorCard } from '../utils/cardGenerator';

interface AdminCardsTabProps {
  cards: ActuatorCard[];
  members: CommunityMember[];
  currentUser: UserProfile;
  onUpdateCards: (updater: (prev: ActuatorCard[]) => ActuatorCard[]) => void;
  onAddAuditLog: (action: string, category: AdminAuditLog['category'], details: string) => void;
  onDirectActivateCard?: (card: ActuatorCard, targetUserId: string) => void;
}

export const AdminCardsTab: React.FC<AdminCardsTabProps> = ({
  cards,
  members,
  currentUser,
  onUpdateCards,
  onAddAuditLog,
  onDirectActivateCard,
}) => {
  // Generator states
  const [selectedDuration, setSelectedDuration] = useState<ActuatorPlanDuration>(30);
  const [targetUserId, setTargetUserId] = useState<string>('open');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [memoInput, setMemoInput] = useState<string>('');
  const [lastGeneratedCards, setLastGeneratedCards] = useState<ActuatorCard[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'redeemed' | 'revoked'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | '30' | '180' | '360'>('all');
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [batchCopySuccess, setBatchCopySuccess] = useState<boolean>(false);

  // Quick activate modal state
  const [assigningCard, setAssigningCard] = useState<ActuatorCard | null>(null);
  const [assignTargetUserId, setAssignTargetUserId] = useState<string>('me');

  // Combined users list
  const allUsers = useMemo(() => {
    return [
      { id: 'me', name: `${currentUser.name} (Master Admin)`, handle: currentUser.handle, tier: currentUser.tier, uniqueId: currentUser.uniqueId },
      ...members.map((m) => ({ id: m.id, name: m.name, handle: m.handle, tier: m.tier, uniqueId: m.uniqueId })),
    ];
  }, [currentUser, members]);

  // Statistics
  const stats = useMemo(() => {
    const total = cards.length;
    const active = cards.filter((c) => c.status === 'active').length;
    const redeemed = cards.filter((c) => c.status === 'redeemed').length;
    const totalValue = cards.reduce((sum, c) => sum + c.priceUsd, 0);
    const redeemedValue = cards.filter((c) => c.status === 'redeemed').reduce((sum, c) => sum + c.priceUsd, 0);
    return { total, active, redeemed, totalValue, redeemedValue };
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().replace(/\s+/g, '');
        const cardClean = c.cardNumber.toLowerCase();
        const assignedName = (c.assignedToName || '').toLowerCase();
        const redeemedName = (c.redeemedByName || '').toLowerCase();
        const memo = (c.memo || '').toLowerCase();
        if (
          !cardClean.includes(q) &&
          !assignedName.includes(q) &&
          !redeemedName.includes(q) &&
          !memo.includes(q)
        ) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Duration
      if (durationFilter !== 'all' && c.days.toString() !== durationFilter) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, statusFilter, durationFilter]);

  // Handle Generate Cards
  const handleGenerateCards = () => {
    const target = allUsers.find((u) => u.id === targetUserId);
    const newCards: ActuatorCard[] = [];

    for (let i = 0; i < batchCount; i++) {
      const card = generateActuatorCard({
        days: selectedDuration,
        assignedToUserId: targetUserId !== 'open' ? targetUserId : undefined,
        assignedToName: targetUserId !== 'open' && target ? `${target.name} (${target.handle})` : undefined,
        memo: memoInput.trim() || undefined,
      });
      newCards.push(card);
    }

    onUpdateCards((prev) => [...newCards, ...prev]);
    setLastGeneratedCards(newCards);

    const plan = ACTUATOR_PLANS[selectedDuration];
    onAddAuditLog(
      `Generated ${batchCount} Actuator Card(s)`,
      'system',
      `Admin generated ${batchCount}x 16-digit card(s) for ${plan.label} ($${plan.priceUsd}). Assigned to: ${
        target ? target.name : 'Open / Unassigned'
      }.`
    );

    // Auto reveal newly generated
    const newRevealed: Record<string, boolean> = { ...revealedIds };
    newCards.forEach((c) => {
      newRevealed[c.id] = true;
    });
    setRevealedIds(newRevealed);
  };

  // Copy 16-digit number to clipboard
  const handleCopyCard = (card: ActuatorCard) => {
    navigator.clipboard.writeText(card.formattedCardNumber);
    setCopiedCardId(card.id);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  // Copy all active numbers
  const handleCopyAllActive = () => {
    const activeCards = cards.filter((c) => c.status === 'active');
    if (activeCards.length === 0) return;

    const text = activeCards
      .map((c) => `${c.formattedCardNumber}  |  ${c.label} ($${c.priceUsd.toFixed(2)})`)
      .join('\n');

    navigator.clipboard.writeText(text);
    setBatchCopySuccess(true);
    setTimeout(() => setBatchCopySuccess(false), 2500);
  };

  // Revoke / Delete Card
  const handleToggleRevoke = (cardId: string) => {
    onUpdateCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const nextStatus = c.status === 'revoked' ? 'active' : 'revoked';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleDeleteCard = (cardId: string) => {
    onUpdateCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="p-4 rounded-2xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <div>
            <span className="text-xs block font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              Total 16-Digit Cards
            </span>
            <span className="text-xl font-black font-mono" style={{ color: 'var(--theme-text-primary)' }}>
              {stats.total}
            </span>
            <span className="text-[10px] text-sky-400 block mt-0.5">
              Protocol Treasury Registry
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <div>
            <span className="text-xs block font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              Active (Unused)
            </span>
            <span className="text-xl font-black font-mono text-emerald-400">
              {stats.active}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              Ready for User Activation
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <div>
            <span className="text-xs block font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              Redeemed Cards
            </span>
            <span className="text-xl font-black font-mono text-indigo-400">
              {stats.redeemed}
            </span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">
              ${stats.redeemedValue.toFixed(2)} USD Collected
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <div>
            <span className="text-xs block font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              Total Card Value
            </span>
            <span className="text-xl font-black font-mono text-amber-400">
              ${stats.totalValue.toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-300 block mt-0.5">
              Across 30d, 180d, 360d Plans
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card Generator Tool */}
      <div
        className="p-5 sm:p-6 rounded-3xl border space-y-4 shadow-xl"
        style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                Generate 16-Digit Actuator Cards
              </h3>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Mint valid 16-digit credit card voucher numbers that users input to activate 30, 180, or 360 days of Actuator node status
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/20 self-start sm:self-auto flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authorized Admin Mint
          </span>
        </div>

        {/* Plan Duration Selector (30 Days / 180 Days / 360 Days) */}
        <div>
          <label className="text-xs font-bold block mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Select Card Duration & Price Plan:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { days: 30, price: 1.70, label: '30 Days (1 Month)', desc: 'Standard node heartbeat', badge: '$1.70' },
                { days: 180, price: 10.20, label: '180 Days (6 Months)', desc: 'Half-year continuous node', badge: '$10.20' },
                { days: 360, price: 20.40, label: '360 Days (1 Year)', desc: 'Full-year protocol node', badge: '$20.40' },
              ] as const
            ).map((plan) => {
              const isSelected = selectedDuration === plan.days;
              return (
                <button
                  key={plan.days}
                  type="button"
                  onClick={() => setSelectedDuration(plan.days)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10 shadow-md shadow-sky-500/10 ring-1 ring-sky-500'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ backgroundColor: isSelected ? undefined : 'var(--theme-bg)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm" style={{ color: isSelected ? '#38bdf8' : 'var(--theme-text-primary)' }}>
                      {plan.label}
                    </span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {plan.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs: Target User, Batch Quantity, Memo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Assigned Recipient (Optional)
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none focus:border-sky-500"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              <option value="open">Open / Any User (Unassigned Voucher)</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.handle}) • UID: {u.uniqueId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Batch Quantity
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 5, 10].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setBatchCount(qty)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    batchCount === qty
                      ? 'border-sky-500 bg-sky-500 text-slate-950 font-black'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  style={batchCount !== qty ? { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)' } : undefined}
                >
                  {qty} {qty === 1 ? 'Card' : 'Cards'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Memo / Accounting Note
            </label>
            <input
              type="text"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              placeholder="e.g. Cash received at office, VIP grant..."
              className="w-full p-2.5 rounded-xl border text-xs outline-none focus:border-sky-500"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Creating <strong className="text-sky-400">{batchCount}x</strong> card(s) of <strong className="text-emerald-400">{selectedDuration} Days ($ {ACTUATOR_PLANS[selectedDuration].priceUsd.toFixed(2)})</strong>
          </div>

          <button
            type="button"
            onClick={handleGenerateCards}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate {batchCount > 1 ? `${batchCount} Cards` : '16-Digit Actuator Card'}</span>
          </button>
        </div>

        {/* Recently Generated Cards Preview */}
        {lastGeneratedCards.length > 0 && (
          <div className="p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Successfully Created {lastGeneratedCards.length} Card(s)!
              </span>
              <button
                type="button"
                onClick={() => setLastGeneratedCards([])}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lastGeneratedCards.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl border bg-slate-950/80 border-emerald-500/30 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-xs font-mono font-black text-emerald-300 tracking-wider block">
                      {c.formattedCardNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {c.label} • ${c.priceUsd.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCard(c)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1 shrink-0"
                    title="Copy 16 digits"
                  >
                    {copiedCardId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by 16-digit card number, recipient name, or memo..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none focus:border-sky-500"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <button
            type="button"
            onClick={handleCopyAllActive}
            className="px-3.5 py-2 rounded-xl border text-xs font-semibold hover:border-sky-400 transition-all flex items-center justify-center gap-1.5 shrink-0"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            title="Copy all active card numbers to clipboard"
          >
            {batchCopySuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Active Cards!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copy All Active ({stats.active})</span>
              </>
            )}
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          {/* Status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold mr-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Status:
            </span>
            {(['all', 'active', 'redeemed', 'revoked'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                  statusFilter === status
                    ? 'bg-sky-500 text-slate-950 font-black'
                    : 'border text-slate-400 hover:text-white'
                }`}
                style={statusFilter !== status ? { borderColor: 'var(--theme-border)' } : undefined}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Duration filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold mr-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Duration:
            </span>
            {(['all', '30', '180', '360'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDurationFilter(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  durationFilter === d
                    ? 'bg-indigo-500 text-white font-black'
                    : 'border text-slate-400 hover:text-white'
                }`}
                style={durationFilter !== d ? { borderColor: 'var(--theme-border)' } : undefined}
              >
                {d === 'all' ? 'All Plans' : d === '30' ? '30 Days ($1.70)' : d === '180' ? '180 Days ($10.20)' : '360 Days ($20.40)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Table & Registry */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              16-Digit Actuator Cards Directory
            </h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Showing {filteredCards.length} of {cards.length}
            </span>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CreditCard className="w-10 h-10 mx-auto text-slate-600" />
            <h5 className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
              No Actuator Cards Found
            </h5>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Try adjusting your search terms or generate new 16-digit cards using the tool above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="text-[11px] font-bold uppercase tracking-wider border-b"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-muted)',
                }}
              >
                <tr>
                  <th className="py-3 px-4">16-Digit Card Number</th>
                  <th className="py-3 px-4">Duration & Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned / Redeemed By</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {filteredCards.map((card) => {
                  const isRevealed = revealedIds[card.id] ?? false;
                  const displayDigits = isRevealed
                    ? card.formattedCardNumber
                    : `${card.cardNumber.slice(0, 4)} •••• •••• ${card.cardNumber.slice(12)}`;

                  return (
                    <tr
                      key={card.id}
                      className="hover:bg-slate-800/20 transition-colors"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      {/* 16-Digit Number with reveal & copy */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-sky-400 tracking-wider">
                            {displayDigits}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedIds((prev) => ({
                                ...prev,
                                [card.id]: !isRevealed,
                              }))
                            }
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title={isRevealed ? 'Mask card number' : 'Reveal full 16 digits'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCard(card)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Copy 16 digits"
                          >
                            {copiedCardId === card.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {card.memo && (
                          <span className="text-[10px] block mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                            {card.memo}
                          </span>
                        )}
                      </td>

                      {/* Duration & Value */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              card.days === 360
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : card.days === 180
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {card.days} Days
                          </span>
                          <span className="font-mono font-black text-emerald-400">
                            ${card.priceUsd.toFixed(2)} USD
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {card.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active (Unused)
                          </span>
                        ) : card.status === 'redeemed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            <Check className="w-3 h-3" />
                            Redeemed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Revoked
                          </span>
                        )}
                      </td>

                      {/* Assigned / Redeemed By */}
                      <td className="py-3 px-4">
                        {card.status === 'redeemed' ? (
                          <div>
                            <span className="font-bold text-sky-300 block">
                              {card.redeemedByName || 'Redeemed by User'}
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                              On: {card.redeemedAt?.slice(0, 10) || 'Recently'}
                            </span>
                          </div>
                        ) : card.assignedToName ? (
                          <span className="text-amber-300 font-medium">
                            Reserved: {card.assignedToName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Open (Anyone can redeem)
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                        {card.createdAt.slice(0, 10)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {card.status === 'active' && onDirectActivateCard && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningCard(card);
                                setAssignTargetUserId('me');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 font-bold text-[11px] transition-all"
                              title="Directly activate this card for a user"
                            >
                              Direct Activate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleRevoke(card.id)}
                            className="p-1 rounded text-slate-400 hover:text-amber-400"
                            title={card.status === 'revoked' ? 'Restore card' : 'Revoke card'}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400"
                            title="Delete card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Activate Modal for Admin */}
      {assigningCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl relative"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                  Directly Activate Actuator Card
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningCard(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl border bg-sky-500/10 border-sky-500/20 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Card Number:</span>
                <span className="font-mono font-bold text-sky-300">{assigningCard.formattedCardNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration & Value:</span>
                <span className="font-bold text-emerald-400">{assigningCard.days} Days (${assigningCard.priceUsd.toFixed(2)} USD)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
                Select User to Activate:
              </label>
              <select
                value={assignTargetUserId}
                onChange={(e) => setAssignTargetUserId(e.target.value)}
                className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none focus:border-sky-500"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.handle}) • UID: {u.uniqueId}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssigningCard(null)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-400 hover:text-white"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDirectActivateCard && assigningCard) {
                    onDirectActivateCard(assigningCard, assignTargetUserId);
                    setAssigningCard(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/20"
              >
                Confirm Direct Activation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
