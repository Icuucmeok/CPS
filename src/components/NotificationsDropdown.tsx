import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Megaphone, 
  ShieldAlert, 
  ShieldCheck, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Trash2, 
  Check, 
  AlertTriangle,
  Info,
  Sparkles,
  Flame,
  ArrowRight
} from 'lucide-react';
import { AppNotification, PlatformConfig, ActiveTab } from '../types';

interface NotificationsDropdownProps {
  notifications: AppNotification[];
  platformConfig: PlatformConfig;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenKycModal: () => void;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  platformConfig,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onNavigateTab,
  onOpenKycModal,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'admin' | 'kyc' | 'rewards'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'admin') return n.type === 'admin_announcement';
    if (filter === 'kyc') return n.type === 'kyc' || n.type === 'system';
    if (filter === 'rewards') return n.type === 'reward' || n.type === 'price';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleActionClick = (notification: AppNotification) => {
    onMarkAsRead(notification.id);
    if (notification.actionTab === 'kyc') {
      onOpenKycModal();
    } else if (notification.actionTab) {
      onNavigateTab(notification.actionTab);
    }
    onClose();
  };

  const getNotificationIcon = (notification: AppNotification) => {
    switch (notification.type) {
      case 'admin_announcement':
        return (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/25 to-rose-500/25 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
            <Megaphone className="w-4 h-4" />
          </div>
        );
      case 'kyc':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
      case 'reward':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
        );
      case 'price':
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={dropdownRef}
      id="notifications-dropdown-menu"
      className="absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div 
        className="p-3.5 border-b flex items-center justify-between"
        style={{ 
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              Announcements & Notifications
            </h3>
            <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
              Admin broadcasts & account notices
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white ml-1 shadow-sm">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1 rounded-lg hover:bg-slate-800 text-[11px] text-sky-400 font-semibold transition-colors"
              title="Mark all as read"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-0.5"
            title="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Active Admin Announcement (if active in platform config) */}
      {platformConfig.globalAnnouncementActive && platformConfig.globalAnnouncement && (
        <div 
          className={`p-3 border-b text-xs relative ${
            platformConfig.globalAnnouncementType === 'critical'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : platformConfig.globalAnnouncementType === 'warning'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : platformConfig.globalAnnouncementType === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <Megaphone className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/20 text-white font-mono">
                  LIVE ADMIN ANNOUNCEMENT
                </span>
                <span className="text-[10px] opacity-75 font-mono">Pinned</span>
              </div>
              <p className="text-xs font-semibold leading-snug">
                {platformConfig.globalAnnouncement}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div 
        className="flex items-center gap-1 p-2 border-b overflow-x-auto text-[11px]"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
            filter === 'all'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('admin')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
            filter === 'admin'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40'
          }`}
        >
          <Megaphone className="w-3 h-3" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => setFilter('kyc')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
            filter === 'kyc'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/40'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>KYC & System</span>
        </button>

        <button
          onClick={() => setFilter('rewards')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
            filter === 'rewards'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/40'
          }`}
        >
          <Coins className="w-3 h-3" />
          <span>Rewards</span>
        </button>
      </div>

      {/* Notification Items List */}
      <div className="max-h-[350px] overflow-y-auto divide-y" style={{ borderColor: 'var(--theme-border)' }}>
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500">
              <Bell className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              No notifications in this filter
            </p>
            <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
              New admin broadcasts and rewards will show here instantly.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 transition-colors relative flex items-start gap-2.5 hover:bg-slate-800/30 ${
                !notification.isRead ? 'bg-sky-500/5' : ''
              }`}
            >
              {/* Unread indicator dot */}
              {!notification.isRead && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              )}

              {/* Icon */}
              {getNotificationIcon(notification)}

              {/* Text info */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                    {notification.title}
                  </span>
                  {notification.type === 'admin_announcement' && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </div>

                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                  {notification.message}
                </p>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                    {notification.timestamp}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Action Button */}
                    {notification.actionLabel && (
                      <button
                        onClick={() => handleActionClick(notification)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all active:scale-95"
                      >
                        <span>{notification.actionLabel}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}

                    {/* Dismiss Button */}
                    <button
                      onClick={() => onDeleteNotification(notification.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div 
        className="p-2.5 border-t text-center bg-slate-950/20 flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
          Real-time network events
        </span>
        <button
          onClick={() => {
            onNavigateTab('community');
            onClose();
          }}
          className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1"
        >
          <span>Open Community Chat</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
