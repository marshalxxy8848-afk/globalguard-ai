'use client';

import { useState } from 'react';
import type { StoredAudit } from '@/lib/client-storage';
import { useLocale } from '@/lib/i18n';

interface Props {
  audits: StoredAudit[];
  selectedId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (audit: StoredAudit) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  favorites?: string[];
}

function RiskDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: 'bg-green-400',
    medium: 'bg-amber-400',
    high: 'bg-red-400',
  };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[level] || 'bg-white/20'}`} />;
}

export default function HistorySidebar({
  audits, selectedId, isOpen, onToggle, onSelect, onDelete, onClearAll, favorites,
}: Props) {
  const { t } = useLocale();
  const [showFavOnly, setShowFavOnly] = useState(false);
  const filtered = showFavOnly && favorites ? audits.filter((a) => favorites.includes(a.id)) : audits;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed left-3 top-20 z-40 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        title={isOpen ? t('sidebar.close') : t('sidebar.open')}
      >
        <svg className="w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={onToggle} />
      )}

      {/* Panel */}
      <aside
        className={`fixed left-0 top-0 z-30 h-full w-72 bg-[#0a0a0f] border-r border-white/10 transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white/70">{t('sidebar.title')}</h2>
            {favorites && favorites.length > 0 && (
              <button onClick={() => setShowFavOnly((v) => !v)}
                className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                  showFavOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-transparent text-white/20 hover:text-white/40'
                }`}
              >
                ☆ {favorites.length}
              </button>
            )}
          </div>
          <span className="text-[10px] text-white/20">{t('sidebar.records', { n: filtered.length })}</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <svg className="w-8 h-8 text-white/10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-xs text-white/20">{t('sidebar.empty')}</p>
              <p className="text-[10px] text-white/10 mt-1">{t('sidebar.empty_hint')}</p>
            </div>
          ) : (
            filtered.map((a) => (
              <div
                key={a.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  selectedId === a.id
                    ? 'bg-cyan-500/10 border border-cyan-500/20'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
                onClick={() => onSelect(a)}
              >
                <RiskDot level={a.riskLevel} />
                {favorites?.includes(a.id) && (
                  <svg className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 truncate">{a.productName}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {t('sidebar.hs', { code: a.hsCode })} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-all text-white/20 hover:text-white/50"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-3 py-3 border-t border-white/5 shrink-0">
            <button
              onClick={onClearAll}
              className="w-full py-1.5 rounded-lg text-[10px] text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-colors"
            >
              {t('sidebar.clear_all')}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
