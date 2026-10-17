import React, { useState } from 'react';
import { Zap, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { validateAndNormalizeUrl } from '@/lib/validation/url';
import { QuickCommandItem } from '@/types';

export const QuickCommandsWidget: React.FC = () => {
  const quickCommands = useDashboardStore((s) => s.quickCommands);
  const addQuickCommand = useDashboardStore((s) => s.addQuickCommand);
  const deleteQuickCommand = useDashboardStore((s) => s.deleteQuickCommand);
  const startFocusTimer = useDashboardStore((s) => s.startFocusTimer);
  const createNote = useDashboardStore((s) => s.createNote);

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const addToast = useUIStore((s) => s.addToast);

  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [urlPayload, setUrlPayload] = useState('');

  const runCommand = (cmd: QuickCommandItem) => {
    switch (cmd.actionType) {
      case 'open-url': {
        if (!cmd.payload) return;
        const valid = validateAndNormalizeUrl(cmd.payload);
        if (!valid.isValid) {
          addToast({ title: 'Invalid command URL', type: 'error' });
          return;
        }
        if (settings.tabOpenBehavior === 'new') {
          window.open(valid.normalizedUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.assign(valid.normalizedUrl);
        }
        break;
      }
      case 'toggle-theme': {
        const next = settings.theme === 'dark' ? 'light' : 'dark';
        void updateSettings({ theme: next });
        addToast({ title: `Switched to ${next} mode`, type: 'info' });
        break;
      }
      case 'start-focus': {
        startFocusTimer();
        addToast({ title: 'Focus timer started', type: 'success' });
        break;
      }
      case 'new-note': {
        createNote('Command Note', '');
        addToast({ title: 'Created new note', type: 'success' });
        break;
      }
      case 'new-task': {
        window.dispatchEvent(new CustomEvent('orbit:new-task'));
        break;
      }
      default:
        break;
    }
  };

  const handleAddCustomCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateAndNormalizeUrl(urlPayload);
    if (!label.trim() || !v.isValid) {
      addToast({
        title: 'Enter a valid label and URL',
        type: 'error',
      });
      return;
    }
    addQuickCommand({
      label: label.trim(),
      category: 'navigation',
      actionType: 'open-url',
      payload: v.normalizedUrl,
    });
    setLabel('');
    setUrlPayload('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-orbit-muted">
          Instant actions & workflow triggers
        </span>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-orbit-accent hover:underline"
        >
          <Plus className="w-3 h-3" />
          Add Command
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddCustomCommand}
          className="p-2 rounded-orbit-sm bg-orbit-secondary/80 border border-orbit-border space-y-2"
        >
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Command label (e.g. Open Staging)"
            required
            className="w-full px-2 py-1 text-xs rounded-xs bg-orbit-main border border-orbit-border text-orbit-text"
          />
          <input
            type="text"
            value={urlPayload}
            onChange={(e) => setUrlPayload(e.target.value)}
            placeholder="https://staging.example.com"
            required
            className="w-full px-2 py-1 text-xs rounded-xs bg-orbit-main border border-orbit-border text-orbit-text"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-0.5 text-[11px] text-orbit-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-[11px] font-medium rounded-xs bg-orbit-accent text-slate-950"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
        {quickCommands.map((cmd) => (
          <div
            key={cmd.id}
            className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border hover:border-orbit-accent/40 transition-colors"
          >
            <button
              type="button"
              onClick={() => runCommand(cmd)}
              className="flex-1 flex items-center justify-between gap-2 text-left min-w-0"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Zap className="w-3.5 h-3.5 text-orbit-accent shrink-0" />
                <span className="text-xs text-orbit-text truncate">{cmd.label}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                {cmd.shortcutHint && (
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-orbit-main/80 border border-orbit-border rounded-xs text-orbit-muted">
                    {cmd.shortcutHint}
                  </kbd>
                )}
                <ArrowUpRight className="w-3 h-3 text-orbit-muted" />
              </span>
            </button>

            {cmd.isCustom && (
              <button
                type="button"
                onClick={() => deleteQuickCommand(cmd.id)}
                aria-label={`Delete command ${cmd.label}`}
                className="p-0.5 text-orbit-muted hover:text-rose-400 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
