import React, { useState, useRef } from 'react';
import {
  Palette,
  LayoutDashboard,
  Search,
  Sliders,
  Download,
  Upload,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { BACKGROUND_PRESETS } from '@/lib/storage/defaults';
import { SEARCH_ENGINES } from '@/lib/search/searchEngines';
import { validateAndNormalizeUrl } from '@/lib/validation/url';
import {
  BackgroundType,
  BorderRadiusPreset,
  FontSizeScale,
  LayoutPresetId,
  SearchEngineId,
  SpacingDensity,
  ThemeMode,
} from '@/types';

const ACCENT_PALETTE = [
  { name: 'Orbit Indigo', value: '#8B9CFF' },
  { name: 'Aurora Mint', value: '#72E0C1' },
  { name: 'Sky Cyan', value: '#38BDF8' },
  { name: 'Solar Amber', value: '#F59E0B' },
  { name: 'Rose Quartz', value: '#F43F5E' },
  { name: 'Violet Pulse', value: '#A855F7' },
];

const TIMEZONES = [
  { label: 'System Local Timezone', value: 'local' },
  { label: 'UTC', value: 'UTC' },
  { label: 'New York (America/New_York)', value: 'America/New_York' },
  { label: 'Los Angeles (America/Los_Angeles)', value: 'America/Los_Angeles' },
  { label: 'London (Europe/London)', value: 'Europe/London' },
  { label: 'Berlin (Europe/Berlin)', value: 'Europe/Berlin' },
  { label: 'Tokyo (Asia/Tokyo)', value: 'Asia/Tokyo' },
  { label: 'Singapore (Asia/Singapore)', value: 'Asia/Singapore' },
  { label: 'Sydney (Australia/Sydney)', value: 'Australia/Sydney' },
];

export const SettingsModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.isSettingsOpen);
  const activeTab = useUIStore((s) => s.settingsTab);
  const openSettings = useUIStore((s) => s.openSettings);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const addToast = useUIStore((s) => s.addToast);

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  const dashboardState = useDashboardStore();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [customBgUrlInput, setCustomBgUrlInput] = useState(
    settings.backgroundType === 'custom-url' ? settings.backgroundValue : ''
  );

  const backupInputRef = useRef<HTMLInputElement>(null);
  const bgUploadInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      addToast({
        title: 'Image file too large',
        description: 'Please choose an image under 2.5 MB to fit within local storage.',
        type: 'error',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      void updateSettings({
        backgroundType: 'custom-upload',
        backgroundValue: dataUrl,
      });
      addToast({ title: 'Custom background applied', type: 'success' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExportFullBackup = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      dashboard: {
        workspaces: dashboardState.workspaces,
        activeWorkspaceId: dashboardState.activeWorkspaceId,
        shortcuts: dashboardState.shortcuts,
        widgets: dashboardState.widgets,
        tasks: dashboardState.tasks,
        notes: dashboardState.notes,
        activeNoteId: dashboardState.activeNoteId,
        focusTimer: dashboardState.focusTimer,
        quickCommands: dashboardState.quickCommands,
        devSnippets: dashboardState.devSnippets,
        weatherConfig: dashboardState.weatherConfig,
        quotes: dashboardState.quotes,
        customMotto: dashboardState.customMotto,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'Exported full Orbit backup', type: 'success' });
  };

  const handleImportFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure.');
        }
        if (parsed.settings && typeof parsed.settings === 'object') {
          await updateSettings(parsed.settings);
        }
        if (parsed.dashboard && typeof parsed.dashboard === 'object') {
          await dashboardState.importDashboardSnapshot(parsed.dashboard);
        }
        addToast({
          title: 'Backup restored successfully',
          type: 'success',
        });
      } catch {
        addToast({
          title: 'Backup import failed',
          description: 'Please select a valid Orbit JSON backup file.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navItems: Array<{
    id: 'appearance' | 'dashboard' | 'search' | 'general';
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'general', label: 'General & Data', icon: Sliders },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={closeSettings}
        title="Orbit Settings"
        subtitle="Customize appearance, dashboard layout, search, and data"
        maxWidthClass="max-w-3xl"
      >
        <div className="flex flex-col md:flex-row gap-6 min-h-[420px]">
          {/* Sidebar */}
          <aside className="md:w-48 shrink-0 flex md:flex-col gap-1 border-b md:border-b-0 md:border-r border-orbit-border pb-3 md:pb-0 md:pr-4 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSettings(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-orbit-sm transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-orbit-accent text-slate-950'
                      : 'text-orbit-muted hover:text-orbit-text hover:bg-orbit-secondary/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Settings Content */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            {/* TAB 1: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                {/* Theme */}
                <div>
                  <label className="block text-xs font-semibold text-orbit-text mb-2">
                    Theme Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'light', 'system'] as ThemeMode[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => void updateSettings({ theme: t })}
                        className={`py-2 px-3 text-xs font-medium rounded-orbit-sm border capitalize transition-colors ${
                          settings.theme === t
                            ? 'bg-orbit-accent/20 border-orbit-accent text-orbit-text'
                            : 'bg-orbit-secondary border-orbit-border text-orbit-muted hover:text-orbit-text'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-xs font-semibold text-orbit-text mb-2">
                    Primary Accent Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {ACCENT_PALETTE.map((swatch) => (
                      <button
                        key={swatch.value}
                        type="button"
                        onClick={() =>
                          void updateSettings({ accentColor: swatch.value })
                        }
                        title={swatch.name}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-orbit-sm border text-xs ${
                          settings.accentColor === swatch.value
                            ? 'border-white bg-orbit-secondary text-orbit-text'
                            : 'border-orbit-border text-orbit-muted'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: swatch.value }}
                        />
                        <span>{swatch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Type & Presets */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-orbit-text">
                    Background Style
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'gradient', label: 'Gradients' },
                        { id: 'solid', label: 'Solid Colors' },
                        { id: 'landscape', label: 'Built-in Art' },
                        { id: 'unsplash', label: 'Unsplash Photos' },
                        { id: 'custom-url', label: 'Custom URL' },
                        { id: 'custom-upload', label: 'Upload Image' },
                      ] as Array<{ id: BackgroundType; label: string }>
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          let defaultVal = settings.backgroundValue;
                          if (b.id === 'solid') defaultVal = BACKGROUND_PRESETS.solid[0].value;
                          if (b.id === 'gradient') defaultVal = BACKGROUND_PRESETS.gradient[0].id;
                          if (b.id === 'landscape') defaultVal = BACKGROUND_PRESETS.landscape[0].id;
                          if (b.id === 'unsplash') defaultVal = BACKGROUND_PRESETS.unsplash[0].id;
                          void updateSettings({
                            backgroundType: b.id,
                            backgroundValue: defaultVal,
                          });
                        }}
                        className={`px-2.5 py-1 text-xs rounded-orbit-sm border ${
                          settings.backgroundType === b.id
                            ? 'bg-orbit-accent text-slate-950 border-orbit-accent font-medium'
                            : 'bg-orbit-secondary border-orbit-border text-orbit-muted hover:text-orbit-text'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  {settings.backgroundType === 'solid' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {BACKGROUND_PRESETS.solid.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            void updateSettings({ backgroundValue: item.value })
                          }
                          className={`p-2 rounded-orbit-sm border text-xs text-left ${
                            settings.backgroundValue === item.value
                              ? 'border-orbit-accent text-orbit-text'
                              : 'border-orbit-border text-orbit-muted'
                          }`}
                        >
                          <div
                            className="w-full h-6 rounded-xs mb-1 border border-white/10"
                            style={{ backgroundColor: item.value }}
                          />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {settings.backgroundType === 'gradient' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {BACKGROUND_PRESETS.gradient.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            void updateSettings({ backgroundValue: item.id })
                          }
                          className={`p-2 rounded-orbit-sm border text-xs text-left ${
                            settings.backgroundValue === item.id
                              ? 'border-orbit-accent text-orbit-text'
                              : 'border-orbit-border text-orbit-muted'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded-xs mb-1 border border-white/10"
                            style={{ background: item.css }}
                          />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {settings.backgroundType === 'landscape' && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {BACKGROUND_PRESETS.landscape.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            void updateSettings({ backgroundValue: item.id })
                          }
                          className={`p-2 rounded-orbit-sm border text-xs text-left ${
                            settings.backgroundValue === item.id
                              ? 'border-orbit-accent text-orbit-text'
                              : 'border-orbit-border text-orbit-muted'
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-12 object-cover rounded-xs mb-1"
                          />
                          <span className="truncate block">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {settings.backgroundType === 'unsplash' && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {BACKGROUND_PRESETS.unsplash.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            void updateSettings({ backgroundValue: item.id })
                          }
                          className={`p-2 rounded-orbit-sm border text-xs text-left ${
                            settings.backgroundValue === item.id
                              ? 'border-orbit-accent text-orbit-text'
                              : 'border-orbit-border text-orbit-muted'
                          }`}
                        >
                          <div className="text-xs font-medium text-orbit-text">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-orbit-muted mt-0.5">
                            {item.credit}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {settings.backgroundType === 'custom-url' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        value={customBgUrlInput}
                        onChange={(e) => setCustomBgUrlInput(e.target.value)}
                        placeholder="https://example.com/wallpaper.jpg"
                        className="flex-1 px-3 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = validateAndNormalizeUrl(customBgUrlInput);
                          if (!v.isValid) {
                            addToast({
                              title: 'Invalid image URL',
                              description: v.error,
                              type: 'error',
                            });
                            return;
                          }
                          void updateSettings({
                            backgroundType: 'custom-url',
                            backgroundValue: v.normalizedUrl,
                          });
                          addToast({ title: 'Background URL updated', type: 'success' });
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {settings.backgroundType === 'custom-upload' && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => bgUploadInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text hover:border-orbit-accent"
                      >
                        <ImageIcon className="w-4 h-4 text-orbit-accent" />
                        Choose Local Image (Max 2.5 MB)
                      </button>
                      <input
                        ref={bgUploadInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Sliders: Blur, Overlay, Brightness, Card Transparency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-orbit-border/60">
                  <label className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-orbit-text">Background Overlay</span>
                      <span className="text-orbit-muted tabular-nums">
                        {settings.backgroundOverlay}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={85}
                      value={settings.backgroundOverlay}
                      onChange={(e) =>
                        void updateSettings({
                          backgroundOverlay: Number(e.target.value),
                        })
                      }
                      className="w-full accent-orbit-accent"
                    />
                  </label>

                  <label className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-orbit-text">Background Blur</span>
                      <span className="text-orbit-muted tabular-nums">
                        {settings.backgroundBlur}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={settings.backgroundBlur}
                      onChange={(e) =>
                        void updateSettings({
                          backgroundBlur: Number(e.target.value),
                        })
                      }
                      className="w-full accent-orbit-accent"
                    />
                  </label>

                  <label className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-orbit-text">Background Brightness</span>
                      <span className="text-orbit-muted tabular-nums">
                        {settings.backgroundBrightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={120}
                      value={settings.backgroundBrightness}
                      onChange={(e) =>
                        void updateSettings({
                          backgroundBrightness: Number(e.target.value),
                        })
                      }
                      className="w-full accent-orbit-accent"
                    />
                  </label>

                  <label className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-orbit-text">Card Opacity</span>
                      <span className="text-orbit-muted tabular-nums">
                        {settings.cardTransparency}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={45}
                      max={100}
                      value={settings.cardTransparency}
                      onChange={(e) =>
                        void updateSettings({
                          cardTransparency: Number(e.target.value),
                        })
                      }
                      className="w-full accent-orbit-accent"
                    />
                  </label>
                </div>

                {/* Radius, Font Size, Density */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-orbit-border/60">
                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Corner Radius
                    </label>
                    <select
                      value={settings.borderRadius}
                      onChange={(e) =>
                        void updateSettings({
                          borderRadius: e.target.value as BorderRadiusPreset,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="sharp">Sharp</option>
                      <option value="default">Default</option>
                      <option value="rounded">Rounded</option>
                      <option value="pill">Generous</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Font Size
                    </label>
                    <select
                      value={settings.fontSize}
                      onChange={(e) =>
                        void updateSettings({
                          fontSize: e.target.value as FontSizeScale,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="sm">Compact (94%)</option>
                      <option value="md">Standard (100%)</option>
                      <option value="lg">Large (108%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Spacing Density
                    </label>
                    <select
                      value={settings.density}
                      onChange={(e) =>
                        void updateSettings({
                          density: e.target.value as SpacingDensity,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>

                <Switch
                  id="reduced-motion-switch"
                  checked={settings.reducedMotion}
                  onChange={(v) => void updateSettings({ reducedMotion: v })}
                  label="Reduced Motion"
                  description="Minimize UI transitions and animations across Orbit."
                />
              </div>
            )}

            {/* TAB 2: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="orbit-user-name-input"
                    className="block text-xs font-medium text-orbit-text mb-1"
                  >
                    Display Name (for Greeting)
                  </label>
                  <input
                    id="orbit-user-name-input"
                    type="text"
                    value={settings.userName}
                    onChange={(e) =>
                      void updateSettings({ userName: e.target.value })
                    }
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                  />
                </div>

                <div className="space-y-1 border-t border-orbit-border/60 pt-3">
                  <Switch
                    id="show-greeting-switch"
                    checked={settings.showGreeting}
                    onChange={(v) => void updateSettings({ showGreeting: v })}
                    label="Show Greeting"
                  />
                  <Switch
                    id="show-clock-switch"
                    checked={settings.showClock}
                    onChange={(v) => void updateSettings({ showClock: v })}
                    label="Show Digital Clock"
                  />
                  <Switch
                    id="show-seconds-switch"
                    checked={settings.showSeconds}
                    onChange={(v) => void updateSettings({ showSeconds: v })}
                    label="Show Seconds in Clock"
                  />
                  <Switch
                    id="show-date-switch"
                    checked={settings.showDate}
                    onChange={(v) => void updateSettings({ showDate: v })}
                    label="Show Current Date"
                  />
                  <Switch
                    id="show-quicklinks-switch"
                    checked={settings.showQuickLinks}
                    onChange={(v) => void updateSettings({ showQuickLinks: v })}
                    label="Show Quick Links Grid"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orbit-border/60">
                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Quick-Link Columns
                    </label>
                    <select
                      value={settings.quickLinksColumns}
                      onChange={(e) =>
                        void updateSettings({
                          quickLinksColumns: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      {[3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n} Columns
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Widget Canvas Columns
                    </label>
                    <select
                      value={settings.widgetColumns}
                      onChange={(e) =>
                        void updateSettings({
                          widgetColumns: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Search Bar Placement
                    </label>
                    <select
                      value={settings.searchBarPlacement}
                      onChange={(e) =>
                        void updateSettings({
                          searchBarPlacement: e.target.value as 'center' | 'top',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="center">Below Clock (Center)</option>
                      <option value="top">Above Clock (Top)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Layout Preset
                    </label>
                    <select
                      value={settings.activePreset}
                      onChange={(e) => {
                        const preset = e.target.value as LayoutPresetId;
                        dashboardState.applyLayoutPreset(preset);
                        void updateSettings({ activePreset: preset });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="minimal">Minimal</option>
                      <option value="productivity">Productivity</option>
                      <option value="developer">Developer</option>
                      <option value="personal">Personal Dashboard</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SEARCH */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="default-search-engine-select"
                    className="block text-xs font-medium text-orbit-text mb-1"
                  >
                    Default Search Engine
                  </label>
                  <select
                    id="default-search-engine-select"
                    value={settings.defaultSearchEngine}
                    onChange={(e) =>
                      void updateSettings({
                        defaultSearchEngine: e.target.value as SearchEngineId,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                  >
                    {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((id) => (
                      <option key={id} value={id}>
                        {SEARCH_ENGINES[id].name}
                      </option>
                    ))}
                  </select>
                </div>

                {settings.defaultSearchEngine === 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Custom Search URL Template (use {'{query}'} placeholder)
                    </label>
                    <input
                      type="text"
                      value={settings.customSearchUrlTemplate}
                      onChange={(e) =>
                        void updateSettings({
                          customSearchUrlTemplate: e.target.value,
                        })
                      }
                      placeholder="https://kagi.com/search?q={query}"
                      className="w-full px-3 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    />
                  </div>
                )}

                <div className="space-y-1 pt-2 border-t border-orbit-border/60">
                  <Switch
                    id="search-suggestions-switch"
                    checked={settings.enableSearchSuggestions}
                    onChange={(v) =>
                      void updateSettings({ enableSearchSuggestions: v })
                    }
                    label="Show Local Workspace Suggestions"
                    description="Include matching shortcuts, notes, and tasks while typing."
                  />

                  <Switch
                    id="search-history-switch"
                    checked={settings.enableSearchHistory}
                    onChange={(v) =>
                      void updateSettings({ enableSearchHistory: v })
                    }
                    label="Save Local Search History"
                    description="Store recent searches locally for quick re-running."
                  />
                </div>
              </div>
            )}

            {/* TAB 4: GENERAL & DATA */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Clock Format
                    </label>
                    <select
                      value={settings.clockFormat}
                      onChange={(e) =>
                        void updateSettings({
                          clockFormat: e.target.value as '12h' | '24h',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="24h">24-hour (14:30)</option>
                      <option value="12h">12-hour (02:30 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Temperature Unit
                    </label>
                    <select
                      value={settings.temperatureUnit}
                      onChange={(e) =>
                        void updateSettings({
                          temperatureUnit: e.target.value as 'celsius' | 'fahrenheit',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="celsius">Celsius (°C)</option>
                      <option value="fahrenheit">Fahrenheit (°F)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Open Links In
                    </label>
                    <select
                      value={settings.tabOpenBehavior}
                      onChange={(e) =>
                        void updateSettings({
                          tabOpenBehavior: e.target.value as 'current' | 'new',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="current">Current Tab</option>
                      <option value="new">New Tab</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-orbit-text mb-1">
                      Week Starts On
                    </label>
                    <select
                      value={settings.weekStartDay}
                      onChange={(e) =>
                        void updateSettings({
                          weekStartDay: e.target.value as 'monday' | 'sunday',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                    >
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-orbit-text mb-1">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      void updateSettings({ timezone: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Backup & Restore */}
                <div className="pt-3 border-t border-orbit-border/60 space-y-2.5">
                  <h4 className="text-xs font-semibold text-orbit-text">
                    Backup, Restore & Reset
                  </h4>
                  <p className="text-[11px] text-orbit-muted">
                    Export all settings, shortcuts, notes, tasks, and widgets to a portable JSON file.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportFullBackup}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text hover:border-orbit-accent"
                    >
                      <Download className="w-3.5 h-3.5 text-orbit-accent" />
                      Export Backup JSON
                    </button>

                    <button
                      type="button"
                      onClick={() => backupInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text hover:border-orbit-accent"
                    >
                      <Upload className="w-3.5 h-3.5 text-orbit-accent-secondary" />
                      Import Backup JSON
                    </button>
                    <input
                      ref={backupInputRef}
                      type="file"
                      accept="application/json"
                      onChange={handleImportFullBackup}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-orbit-sm bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset All Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmingReset}
        onClose={() => setIsConfirmingReset(false)}
        onConfirm={() => {
          void resetSettings();
          void dashboardState.resetDashboardData();
          addToast({
            title: 'Orbit reset to factory defaults',
            type: 'info',
          });
        }}
        title="Reset Orbit to Defaults?"
        description="This will restore all settings, shortcuts, notes, tasks, and widgets back to their default state. Export a backup first if you wish to keep your current data."
        confirmLabel="Reset Everything"
      />
    </>
  );
};
