import React, { useState, useRef } from 'react';
import { 
  Users, 
  Send, 
  MessageSquare, 
  Search, 
  Sparkles, 
  Lock, 
  Radio, 
  Coins, 
  Copy, 
  Check, 
  Zap, 
  Eye
} from 'lucide-react';
import { CommunityMember, ChatMessage, UserProfile } from '../types';
import { AdMobBanner } from './ads/AdMobBanner';

interface CommunityViewProps {
  members: CommunityMember[];
  chatMessages: ChatMessage[];
  user: UserProfile;
  activeVerifiedCount: number;
  onSendMessage: (text: string) => void;
  onOpenMembership: () => void;
}

// Fallback generator for a 15-digit Unique ID if a member doesn't already have one
const getMember15DigitUid = (member: CommunityMember, index: number): string => {
  if (member.uniqueId && /^\d{15}$/.test(member.uniqueId)) {
    return member.uniqueId;
  }
  // Deterministic 15-digit fallback
  const baseSeed = (member.id || `mem_${index + 1}`).split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000);
  const raw = `${baseSeed * 8291048291 + (index + 1) * 739102948172}`;
  return raw.replace(/\D/g, '').slice(0, 15).padStart(15, '8');
};

export const CommunityView: React.FC<CommunityViewProps> = ({
  members,
  chatMessages,
  user,
  activeVerifiedCount,
  onSendMessage,
  onOpenMembership,
}) => {
  const [filter, setFilter] = useState<'all' | 'actuators' | 'observers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [chatRateError, setChatRateError] = useState<string | null>(null);
  const lastMsgTimeRef = useRef<number>(0);

  const isVerified = user.tier !== 'free';

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => {
      setCopiedUid(null);
    }, 2000);
  };

  // Sort members in descending order by coins/shares held (highest on top)
  const sortedMembers = [...members].sort((a, b) => b.tokensHeld - a.tokensHeld);

  const filteredMembers = sortedMembers.filter((member, index) => {
    const serialNum = index + 1;
    const uid = getMember15DigitUid(member, index);
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      uid.toLowerCase().includes(query) ||
      `#${serialNum}`.includes(query) ||
      `${serialNum}` === query ||
      (member.tier !== 'free' && 'actuator'.includes(query)) ||
      (member.tier === 'free' && 'observer'.includes(query));
    
    if (!matchesSearch) return false;

    if (filter === 'actuators') {
      return member.tier !== 'free';
    }
    if (filter === 'observers') {
      return member.tier === 'free';
    }
    return true;
  });

  const actuatorsCount = members.filter(m => m.tier !== 'free').length;
  const observersCount = members.filter(m => m.tier === 'free').length;
  const totalHoldings = filteredMembers.reduce((sum, m) => sum + m.tokensHeld, 0);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;
    const cleanText = newMessageText.trim();
    if (!cleanText) return;

    const now = Date.now();
    if (now - lastMsgTimeRef.current < 2500) {
      setChatRateError('Transmission rate limit: Please wait 2 seconds between broadcasts.');
      setTimeout(() => setChatRateError(null), 3000);
      return;
    }

    lastMsgTimeRef.current = now;
    setChatRateError(null);
    onSendMessage(cleanText.slice(0, 280));
    setNewMessageText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verified Network Influence Stats */}
      <div
        className="rounded-2xl border p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Community Network: Actuators & Observers
            </h2>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              {activeVerifiedCount} Actuators online driving the real-time dynamic pricing engine (+$0.0000001 each)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">{activeVerifiedCount} Online Actuators</span>
          </div>

          {!isVerified && (
            <button
              id="community-upgrade-btn"
              onClick={onOpenMembership}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Become an Actuator ($1/mo)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Member Directory, Right Community Chat/Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* MEMBER DIRECTORY (7 Cols on desktop)                    */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="rounded-2xl border p-4 sm:p-5"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--theme-text-primary)' }}>
                  User Registry ({filteredMembers.length})
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Serial numbers, 15-digit Unique IDs, holding shares (descending order), and online status
                </p>
              </div>

              {/* Filter Tabs & Total Holdings */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  className="flex rounded-lg border p-0.5 text-xs font-medium"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-bg)',
                  }}
                >
                  <button
                    id="filter-all-btn"
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      filter === 'all'
                        ? 'bg-sky-500 text-white font-bold shadow-sm'
                        : 'hover:text-sky-400'
                    }`}
                    style={{
                      color: filter === 'all' ? '#ffffff' : 'var(--theme-text-muted)',
                    }}
                  >
                    All ({members.length})
                  </button>
                  <button
                    id="filter-actuators-btn"
                    onClick={() => setFilter('actuators')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      filter === 'actuators'
                        ? 'bg-emerald-500 text-white font-bold shadow-sm'
                        : 'hover:text-emerald-400'
                    }`}
                    style={{
                      color: filter === 'actuators' ? '#ffffff' : 'var(--theme-text-muted)',
                    }}
                  >
                    <Zap className="w-3 h-3 text-emerald-300" />
                    Actuators ({actuatorsCount})
                  </button>
                  <button
                    id="filter-observers-btn"
                    onClick={() => setFilter('observers')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      filter === 'observers'
                        ? 'bg-slate-700 text-white font-bold shadow-sm'
                        : 'hover:text-slate-400'
                    }`}
                    style={{
                      color: filter === 'observers' ? '#ffffff' : 'var(--theme-text-muted)',
                    }}
                  >
                    <Eye className="w-3 h-3 text-slate-300" />
                    Observers ({observersCount})
                  </button>
                </div>

                {/* Total Holdings means Total Shares Badge */}
                <div
                  id="total-holdings-badge"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono shadow-sm transition-all"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                  title="Total holdings of Community Power Shares"
                >
                  <Coins className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                      Total Holdings:
                    </span>
                    <span className="font-bold text-sky-300">
                      {totalHoldings.toLocaleString()} Shares
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {(totalHoldings / 1_000_000).toFixed(1)}M CP Shares
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--theme-text-muted)' }} />
              <input
                id="member-search-input"
                type="text"
                placeholder="Search by 15-digit Unique ID, serial number (#01), or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />
            </div>

            {/* Single Header on Top: SR, UID, HOLDINGS */}
            <div 
              className="flex items-center justify-between px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border mb-2.5"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
              }}
            >
              <div className="flex items-center gap-4">
                <span className="w-9 text-center">SR</span>
                <span className="w-3 text-center"></span>
                <span>UID</span>
              </div>
              <div className="text-right">
                <span>HOLDINGS</span>
              </div>
            </div>

            {/* Members List - Showing ONLY Serial Number, Status Dot, 15-Digit UID, and Holding Coins */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredMembers.map((member, index) => {
                const rankIndex = sortedMembers.findIndex((m) => m.id === member.id);
                const serialNum = rankIndex + 1;
                const uid = getMember15DigitUid(member, rankIndex);

                return (
                  <React.Fragment key={member.id}>
                    <div
                      id={`member-item-${member.id}`}
                      className="p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all hover:border-sky-500/40"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                    {/* Left: Serial Number, Status Dot, and 15-Digit Unique ID */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Serial Number */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border"
                        style={{
                          backgroundColor: 'var(--theme-card)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-primary)',
                        }}
                        title={`Serial Number #${serialNum}`}
                      >
                        #{String(serialNum).padStart(2, '0')}
                      </div>

                      {/* Online / Offline Status Dot (Red or Green) */}
                      <div 
                        className="flex items-center justify-center shrink-0"
                        title={member.isOnline ? 'Online' : 'Offline'}
                      >
                        {member.isOnline ? (
                          <span className="relative flex h-3 w-3" title="Online">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
                          </span>
                        ) : (
                          <span 
                            className="inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" 
                            title="Offline"
                          />
                        )}
                      </div>

                      {/* 15-Digit Unique ID */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-mono font-bold text-xs sm:text-sm tracking-wider select-all"
                          style={{ color: 'var(--theme-text-primary)' }}
                        >
                          {uid}
                        </span>
                        <button
                          id={`copy-uid-${member.id}`}
                          onClick={() => handleCopyUid(uid)}
                          className="p-1 rounded hover:bg-sky-500/15 text-slate-400 hover:text-sky-400 transition-colors"
                          title="Copy 15-digit UID"
                        >
                          {copiedUid === uid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right: Holding of Community Power Shares */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs sm:text-sm text-sky-300">
                          {member.tokensHeld.toLocaleString()} Shares
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400">
                          {(member.tokensHeld / 1_000_000).toFixed(1)}M CP Shares
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirement 3: After each 10 users should have banner ad in all tabs */}
                  {(index + 1) % 10 === 0 && (
                    <div className="py-1">
                      <AdMobBanner
                        placement="community_feed"
                        index={Math.floor((index + 1) / 10)}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

              {filteredMembers.length === 0 && (
                <div 
                  className="p-8 text-center rounded-xl border border-dashed"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  <p className="text-sm">No members found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COMMUNITY CHAT & FEED (5 Cols on desktop)                */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="rounded-2xl border p-4 sm:p-5 flex flex-col h-[600px]"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-3 border-b mb-2" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                    Actuator Feed
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300">
                  Fee: 0 CPS
                </span>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real-Time Node Feed
                </span>
              </div>
            </div>

            {/* Permission banner */}
            <div className="flex items-center justify-between px-1 mb-2 text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <Zap className="w-3 h-3" />
                Actuators Post
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3 text-sky-400" />
                Observers View Fees & Msgs
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatMessages.map((msg, index) => {
                const msgVerified = msg.senderTier !== 'free';
                // Deterministic 15-digit UID for message sender
                const senderUid = `84920194820194${(index % 9) + 1}`;
                const feeText = msg.feeDisplay || (msgVerified ? '0 CPS (Actuator Node)' : 'Read-Only View');
                return (
                  <div
                    key={msg.id}
                    id={`chat-msg-${msg.id}`}
                    className="p-3 rounded-xl border transition-all text-xs"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: msgVerified ? 'rgba(56, 189, 248, 0.25)' : 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status dot */}
                        <span 
                          className={`w-2 h-2 rounded-full ${
                            msgVerified ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-slate-400'
                          }`} 
                        />
                        <span className="font-mono font-bold text-[11px] text-sky-300">
                          UID: {senderUid}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ACTUATOR
                        </span>
                        <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-emerald-300/90 border border-emerald-500/20">
                          Fee: {feeText}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                        {msg.timestamp}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                      {msg.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Chat Input or Gate */}
            <div className="pt-3 border-t mt-3" style={{ borderColor: 'var(--theme-border)' }}>
              {isVerified ? (
                /* Actuators can transmit messages */
                <div className="space-y-1.5">
                  {chatRateError && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] animate-in fade-in">
                      {chatRateError}
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      id="community-chat-input"
                      type="text"
                      maxLength={280}
                      placeholder="Transmit message as an Actuator (max 280 chars)..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                    <button
                      id="community-chat-send-btn"
                      type="submit"
                      disabled={!newMessageText.trim()}
                      className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center transition-all shadow-md shadow-sky-500/20"
                      title="Transmit message as Actuator"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                  <div className="flex items-center justify-between text-[10px] px-1" style={{ color: 'var(--theme-text-muted)' }}>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Actuator Network Fee: 0 CPS ($0.00 Included)
                    </span>
                    <span>Live broadcast to all nodes</span>
                  </div>
                </div>
              ) : (
                /* Observers are Read-Only (Cannot msg, only see fees and messages) */
                <div className="space-y-2">
                  <div 
                    className="p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                            Actuator-Only Messaging
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold">
                            OBSERVER READ-ONLY
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                          Only Actuators can message here. Observers can view all live messages & fees.
                        </p>
                      </div>
                    </div>

                    <button
                      id="chat-gate-upgrade-btn"
                      onClick={onOpenMembership}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shrink-0 shadow transition-all hover:scale-105 flex items-center gap-1.5 w-full sm:w-auto justify-center"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Become an Actuator ($1/mo)</span>
                    </button>
                  </div>

                  <div className="flex gap-2 opacity-60">
                    <input
                      id="community-chat-input-disabled"
                      disabled
                      type="text"
                      placeholder="Messaging locked — Observers can only view messages & fees..."
                      className="flex-1 px-3 py-2 rounded-xl text-xs border cursor-not-allowed select-none"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-muted)',
                      }}
                    />
                    <button
                      disabled
                      className="px-3 py-2 rounded-xl border opacity-50 text-slate-400 text-xs flex items-center justify-center cursor-not-allowed"
                      style={{ borderColor: 'var(--theme-border)' }}
                      title="Transmissions restricted to Actuators"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
