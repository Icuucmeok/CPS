import React, { useState } from 'react';
import { X, Database, Radio, Code2, Copy, Check, ExternalLink } from 'lucide-react';
import { POSTGRESQL_TRANSACTION_SCHEMA, REALTIME_API_INTEGRATION_STRATEGY } from '../data/architectureDocs';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'schema' | 'realtime'>('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentContent = tab === 'schema' ? POSTGRESQL_TRANSACTION_SCHEMA : REALTIME_API_INTEGRATION_STRATEGY;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div
        id="architecture-modal-dialog"
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl border flex flex-col shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                System Architecture: Database & Real-Time API
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                PostgreSQL partitioned schema & WebSocket market data distribution strategy
              </p>
            </div>
          </div>

          <button
            id="close-arch-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs & Copy action */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)' }}>
          <div className="flex gap-2">
            <button
              id="arch-tab-schema"
              onClick={() => setTab('schema')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'schema'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Scalable Database Schema (PostgreSQL)</span>
            </button>
            <button
              id="arch-tab-realtime"
              onClick={() => setTab('realtime')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'realtime'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Real-Time Market Data Strategy</span>
            </button>
          </div>

          <button
            id="copy-current-arch-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:border-sky-400 transition-colors"
            style={{
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
              backgroundColor: 'var(--theme-card)',
            }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copy Specification</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-xs leading-relaxed" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <pre className="whitespace-pre-wrap" style={{ color: tab === 'schema' ? '#38bdf8' : '#e2e8f0' }}>
            {currentContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
