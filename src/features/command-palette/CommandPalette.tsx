import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Command,
  Bookmark,
  FileText,
  CheckSquare,
  Settings,
  LayoutGrid,
  Moon,
  Play,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { validateAndNormalizeUrl } from '@/lib/validation/url';

interface PaletteItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  icon: React.FC<{ className?: string }>;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const openSettings = useUIStore((s) => s.openSettings);
  const openWidgetLibrary = useUIStore((s) => s.openWidgetLibrary);
  const openShortcutModal = useUIStore((s) => s.openShortcutModal);
  const openShortcutsHelp = useUIStore((s) => s.openShortcutsHelp);

  const shortcuts = useDashboardStore((s) => s.shortcuts);
  const notes = useDashboardStore((s) => s.notes);
  const tasks = useDashboardStore((s) => s.tasks);
  const recordShortcutLaunch = useDashboardStore((s) => s.recordShortcutLaunch);
  const startFocusTimer = useDashboardStore((s) => s.startFocusTimer);
  const createNote = useDashboardStore((s) => s.createNote);
  const setActiveNote = useDashboardStore((s) => s.setActiveNote);
  const toggleTask = useDashboardStore((s) => s.toggleTask);

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [
      {
        id: 'act_add_shortcut',
        title: 'Add New Quick Link Shortcut',
        category: 'Actions',
        icon: Plus,
        action: () => {
          closeCommandPalette();
          openShortcutModal(null);
        },
      },
      {
        id: 'act_new_note',
        title: 'Create New Note',
        category: 'Actions',
        shortcut: 'N',
        icon: FileText,
        action: () => {
          closeCommandPalette();
          const n = createNote('Quick Note', '');
          setActiveNote(n.id);
        },
      },
      {
        id: 'act_new_task',
        title: 'Create New Task',
        category: 'Actions',
        shortcut: 'T',
        icon: CheckSquare,
        action: () => {
          closeCommandPalette();
          window.dispatchEvent(new CustomEvent('orbit:new-task'));
        },
      },
      {
        id: 'act_start_focus',
        title: 'Start Focus Timer Session',
        category: 'Actions',
        icon: Play,
        action: () => {
          startFocusTimer();
          closeCommandPalette();
        },
      },
      {
        id: 'act_toggle_theme',
        title: `Switch Theme (Current: ${settings.theme})`,
        category: 'Preferences',
        icon: Moon,
        action: () => {
          const next = settings.theme === 'dark' ? 'light' : 'dark';
          void updateSettings({ theme: next });
          closeCommandPalette();
        },
      },
      {
        id: 'act_widgets',
        title: 'Open Widget Library & Presets',
        category: 'Navigation',
        icon: LayoutGrid,
        action: () => {
          closeCommandPalette();
          openWidgetLibrary();
        },
      },
      {
        id: 'act_settings',
        title: 'Open Orbit Settings',
        category: 'Navigation',
        icon: Settings,
        action: () => {
          closeCommandPalette();
          openSettings('appearance');
        },
      },
      {
        id: 'act_help',
        title: 'View Keyboard Shortcuts',
        category: 'Navigation',
        shortcut: '?',
        icon: Command,
        action: () => {
          closeCommandPalette();
          openShortcutsHelp();
        },
      },
    ];

    shortcuts.forEach((sc) => {
      items.push({
        id: `sc_${sc.id}`,
        title: `Open ${sc.title}`,
        category: 'Shortcuts',
        icon: Bookmark,
        action: () => {
          const valid = validateAndNormalizeUrl(sc.url);
          if (!valid.isValid) return;
          recordShortcutLaunch(sc.id);
          closeCommandPalette();
          if (settings.tabOpenBehavior === 'new') {
            window.open(valid.normalizedUrl, '_blank', 'noopener,noreferrer');
          } else {
            window.location.assign(valid.normalizedUrl);
          }
        },
      });
    });

    notes.forEach((n) => {
      items.push({
        id: `note_${n.id}`,
        title: `Note: ${n.title}`,
        category: 'Notes',
        icon: FileText,
        action: () => {
          setActiveNote(n.id);
          closeCommandPalette();
        },
      });
    });

    tasks
      .filter((t) => !t.completed)
      .forEach((t) => {
        items.push({
          id: `task_${t.id}`,
          title: `Complete Task: ${t.title}`,
          category: 'Tasks',
          icon: CheckSquare,
          action: () => {
            toggleTask(t.id);
            closeCommandPalette();
          },
        });
      });

    return items;
  }, [
    shortcuts,
    notes,
    tasks,
    settings.theme,
    settings.tabOpenBehavior,
    closeCommandPalette,
    openShortcutModal,
    createNote,
    setActiveNote,
    startFocusTimer,
    updateSettings,
    openWidgetLibrary,
    openSettings,
    openShortcutsHelp,
    recordShortcutLaunch,
    toggleTask,
  ]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 12);
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
        );
      }
      return;
    }
    if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4 bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCommandPalette();
      }}
    >
      <div
        className="w-full max-w-xl rounded-orbit-lg orbit-elevated shadow-orbit overflow-hidden border border-orbit-border"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 py-3 border-b border-orbit-border">
          <Search className="w-4 h-4 text-orbit-accent mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, shortcut, note, or task..."
            aria-label="Command Palette Search"
            className="w-full bg-transparent text-sm text-orbit-text placeholder:text-orbit-muted focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-orbit-secondary border border-orbit-border rounded-xs text-orbit-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5" role="listbox">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-orbit-muted">
              No matching commands or items found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => item.action()}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-orbit-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-orbit-accent/20 text-orbit-text'
                      : 'text-orbit-muted hover:bg-orbit-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-orbit-accent shrink-0" />
                    <span className="text-xs font-medium text-orbit-text truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-orbit-secondary text-orbit-muted">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-orbit-secondary border border-orbit-border rounded-xs text-orbit-muted">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
