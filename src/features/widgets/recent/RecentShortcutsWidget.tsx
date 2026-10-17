import React from 'react';
import { History, ArrowUpRight, Trash2 } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatRelativeTime } from '@/lib/formatting/utils';
import { getFaviconUrl, validateAndNormalizeUrl } from '@/lib/validation/url';

export const RecentShortcutsWidget: React.FC = () => {
  const shortcuts = useDashboardStore((s) => s.shortcuts);
  const recordShortcutLaunch = useDashboardStore((s) => s.recordShortcutLaunch);
  const clearRecentLaunches = useDashboardStore((s) => s.clearRecentLaunches);
  const tabOpenBehavior = useSettingsStore((s) => s.settings.tabOpenBehavior);

  const recentItems = shortcuts
    .filter((s) => (s.launchCount || 0) > 0 || Boolean(s.lastUsedAt))
    .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
    .slice(0, 6);

  const handleOpen = (id: string, url: string) => {
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
      <div className="flex items-center justify-between text-[11px] text-orbit-muted">
        <span>Orbit-launched shortcuts only (private & local)</span>
        {recentItems.length > 0 && (
          <button
            type="button"
            onClick={clearRecentLaunches}
            title="Clear activity count"
            className="inline-flex items-center gap-1 hover:text-orbit-text"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {recentItems.length === 0 ? (
        <div className="py-5 text-center text-xs text-orbit-muted">
          <History className="w-4 h-4 mx-auto mb-1 opacity-60" />
          Shortcuts opened from Orbit will appear here.
        </div>
      ) : (
        <div className="space-y-1.5">
          {recentItems.map((item) => {
            const fav = getFaviconUrl(item.url);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpen(item.id, item.url)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border hover:border-orbit-accent/40 text-left transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {fav && <img src={fav} alt="" className="w-3.5 h-3.5 shrink-0" />}
                  <span className="text-xs font-medium text-orbit-text truncate">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px] text-orbit-muted tabular-nums">
                  {item.lastUsedAt && (
                    <span>{formatRelativeTime(item.lastUsedAt)}</span>
                  )}
                  <span className="px-1.5 py-0.2 rounded-xs bg-orbit-main">
                    {item.launchCount}×
                  </span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
