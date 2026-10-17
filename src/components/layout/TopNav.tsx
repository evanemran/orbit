import React, { useState } from 'react';
import {
  Command,
  LayoutGrid,
  Moon,
  Sun,
  Monitor,
  Settings,
  HelpCircle,
  Plus,
  Orbit,
  User,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useUIStore } from '@/stores/useUIStore';
import { ThemeMode } from '@/types';

export const TopNav: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const workspaces = useDashboardStore((s) => s.workspaces);
  const activeWorkspaceId = useDashboardStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useDashboardStore((s) => s.setActiveWorkspace);
  const addWorkspace = useDashboardStore((s) => s.addWorkspace);

  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const openWidgetLibrary = useUIStore((s) => s.openWidgetLibrary);
  const openSettings = useUIStore((s) => s.openSettings);
  const openShortcutsHelp = useUIStore((s) => s.openShortcutsHelp);

  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const cycleTheme = () => {
    const order: ThemeMode[] = ['dark', 'light', 'system'];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    void updateSettings({ theme: next });
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      addWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsAddingWorkspace(false);
    }
  };

  const ThemeIcon =
    settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor;

  const userInitial = settings.userName
    ? settings.userName.trim().charAt(0).toUpperCase()
    : null;

  return (
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-4">
      {/* Left: Brand & Workspaces */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 rounded-orbit-sm bg-orbit-accent/15 border border-orbit-accent/30 flex items-center justify-center text-orbit-accent">
            <Orbit className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-orbit-text hidden sm:inline">
            Orbit
          </span>
        </div>

        <div className="h-4 w-px bg-orbit-border hidden sm:block" />

        {/* Workspace Switcher */}
        <nav
          aria-label="Workspaces"
          className="flex items-center gap-1 p-1 rounded-orbit orbit-glass overflow-x-auto max-w-[260px] sm:max-w-md"
        >
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => setActiveWorkspace(ws.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-orbit-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-orbit-accent text-slate-950 shadow-xs'
                    : 'text-orbit-muted hover:text-orbit-text hover:bg-orbit-elevated/60'
                }`}
              >
                {ws.name}
              </button>
            );
          })}

          {isAddingWorkspace ? (
            <form onSubmit={handleCreateWorkspace} className="flex items-center">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onBlur={() => setIsAddingWorkspace(false)}
                placeholder="Workspace..."
                autoFocus
                className="w-24 px-2 py-0.5 text-xs bg-orbit-secondary border border-orbit-border rounded-orbit-sm text-orbit-text focus:outline-none focus:border-orbit-accent"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingWorkspace(true)}
              title="New workspace"
              aria-label="Create workspace"
              className="p-1 text-orbit-muted hover:text-orbit-text rounded-orbit-sm hover:bg-orbit-elevated/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={openCommandPalette}
          title="Command Palette (Ctrl/Cmd + K)"
          aria-label="Open Command Palette"
          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs text-orbit-muted hover:text-orbit-text rounded-orbit orbit-glass hover:border-orbit-accent/40 transition-colors"
        >
          <Command className="w-3.5 h-3.5 text-orbit-accent" />
          <span className="hidden md:inline">Command</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-orbit-secondary/80 border border-orbit-border rounded-xs text-orbit-muted">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={cycleTheme}
          title={`Theme: ${settings.theme} (click to switch)`}
          aria-label={`Switch theme, current is ${settings.theme}`}
          className="p-2 text-orbit-muted hover:text-orbit-text rounded-orbit orbit-glass hover:border-orbit-accent/40 transition-colors"
        >
          <ThemeIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={openWidgetLibrary}
          title="Manage Widgets"
          aria-label="Open Widget Library"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-orbit-muted hover:text-orbit-text rounded-orbit orbit-glass hover:border-orbit-accent/40 transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-orbit-accent-secondary" />
          <span className="hidden sm:inline">Widgets</span>
        </button>

        <button
          type="button"
          onClick={openShortcutsHelp}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
          className="p-2 text-orbit-muted hover:text-orbit-text rounded-orbit orbit-glass hover:border-orbit-accent/40 transition-colors hidden sm:inline-flex"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => openSettings('appearance')}
          title="Settings"
          aria-label="Open Settings"
          className="p-2 text-orbit-muted hover:text-orbit-text rounded-orbit orbit-glass hover:border-orbit-accent/40 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => openSettings('dashboard')}
          title={settings.userName ? `Profile: ${settings.userName}` : 'Set display name'}
          aria-label="User Profile"
          className="w-8 h-8 rounded-full orbit-glass flex items-center justify-center text-xs font-semibold text-orbit-accent hover:border-orbit-accent/50 transition-colors"
        >
          {userInitial ? userInitial : <User className="w-3.5 h-3.5 text-orbit-muted" />}
        </button>
      </div>
    </header>
  );
};
