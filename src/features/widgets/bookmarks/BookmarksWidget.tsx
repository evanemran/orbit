import React, { useState } from 'react';
import { Bookmark, ExternalLink, Maximize2, Minimize2, Pin } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getFaviconUrl, validateAndNormalizeUrl } from '@/lib/validation/url';

export const BookmarksWidget: React.FC = () => {
  const shortcuts = useDashboardStore((s) => s.shortcuts);
  const recordShortcutLaunch = useDashboardStore((s) => s.recordShortcutLaunch);
  const tabOpenBehavior = useSettingsStore((s) => s.settings.tabOpenBehavior);

  const [mode, setMode] = useState<'compact' | 'expanded'>('compact');
  const [onlyPinned, setOnlyPinned] = useState(true);

  const filtered = shortcuts
    .filter((s) => (onlyPinned ? s.pinned : true))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order);

  const openItem = (id: string, url: string) => {
    const valid = validateAndNormalizeUrl(url);
    if (!valid.isValid) return;
    recordShortcutLaunch(id);
    if (tabOpenBehavior === 'new') {
      window.open(valid.normalizedUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(valid.normalizedUrl);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOnlyPinned(true)}
            className={`px-2 py-0.5 rounded-xs ${
              onlyPinned
                ? 'bg-orbit-accent/20 text-orbit-accent font-medium'
                : 'text-orbit-muted hover:text-orbit-text'
            }`}
          >
            Pinned
          </button>
          <button
            type="button"
            onClick={() => setOnlyPinned(false)}
            className={`px-2 py-0.5 rounded-xs ${
              !onlyPinned
                ? 'bg-orbit-accent/20 text-orbit-accent font-medium'
                : 'text-orbit-muted hover:text-orbit-text'
            }`}
          >
            All Links
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMode((m) => (m === 'compact' ? 'expanded' : 'compact'))}
          title={mode === 'compact' ? 'Switch to expanded view' : 'Switch to compact view'}
          aria-label="Toggle compact or expanded bookmark view"
          className="inline-flex items-center gap-1 text-orbit-muted hover:text-orbit-text"
        >
          {mode === 'compact' ? (
            <>
              <Maximize2 className="w-3 h-3" />
              <span>Expanded</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3 h-3" />
              <span>Compact</span>
            </>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-5 text-center text-xs text-orbit-muted">
          <Bookmark className="w-4 h-4 mx-auto mb-1 opacity-60" />
          No {onlyPinned ? 'pinned ' : ''}favorites yet.
        </div>
      ) : mode === 'compact' ? (
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((item) => {
            const fav = getFaviconUrl(item.url);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item.id, item.url)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border hover:border-orbit-accent/40 text-xs text-orbit-text transition-colors"
              >
                {fav && <img src={fav} alt="" className="w-3.5 h-3.5" />}
                <span className="truncate max-w-[110px]">{item.title}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
          {filtered.map((item) => {
            const fav = getFaviconUrl(item.url);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item.id, item.url)}
                className="w-full flex items-center justify-between gap-2 p-2 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border hover:border-orbit-accent/40 text-left transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {fav && <img src={fav} alt="" className="w-4 h-4 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-orbit-text truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-orbit-muted truncate">{item.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.pinned && <Pin className="w-3 h-3 text-orbit-accent" />}
                  <ExternalLink className="w-3 h-3 text-orbit-muted" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
