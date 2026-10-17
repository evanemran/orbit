import React, { useState } from 'react';
import {
  Orbit,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { WIDGET_CATALOG } from '@/lib/storage/defaults';
import { LayoutPresetId, ThemeMode, WidgetType } from '@/types';

export const OnboardingModal: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const widgets = useDashboardStore((s) => s.widgets);
  const applyLayoutPreset = useDashboardStore((s) => s.applyLayoutPreset);
  const toggleWidgetEnabled = useDashboardStore((s) => s.toggleWidgetEnabled);
  const addShortcut = useDashboardStore((s) => s.addShortcut);
  const shortcuts = useDashboardStore((s) => s.shortcuts);

  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState(settings.userName);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);

  if (settings.onboardingCompleted) return null;

  const handleFinish = () => {
    void updateSettings({
      userName: nameInput.trim(),
      onboardingCompleted: true,
    });
  };

  const handleAddStarterLink = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    const res = addShortcut({
      title: quickTitle,
      url: quickUrl,
      pinned: true,
    });
    if (!res.ok) {
      setQuickError(res.error || 'Invalid URL');
      return;
    }
    setQuickTitle('');
    setQuickUrl('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Orbit Onboarding"
    >
      <div className="w-full max-w-xl orbit-surface rounded-orbit-lg shadow-orbit border border-orbit-border overflow-hidden">
        {/* Top Progress Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border bg-orbit-secondary/50">
          <div className="flex items-center gap-2">
            <Orbit className="w-5 h-5 text-orbit-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-orbit-muted">
              Step {step} of 6
            </span>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs text-orbit-muted hover:text-orbit-text underline"
          >
            Skip to Dashboard
          </button>
        </div>

        <div className="p-6 min-h-[290px] flex flex-col justify-between">
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orbit-accent/15 text-orbit-accent text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Your web, in orbit.
              </div>
              <h2 className="text-2xl font-semibold text-orbit-text">
                Welcome to Orbit
              </h2>
              <p className="text-sm text-orbit-muted leading-relaxed">
                Orbit transforms every new tab into a calm, fast, and private personal workspace. No accounts required—all your notes, tasks, and links stay right on your device.
              </p>
              <div className="pt-2">
                <label
                  htmlFor="onboarding-name-input"
                  className="block text-xs font-medium text-orbit-text mb-1.5"
                >
                  What should Orbit call you? (optional)
                </label>
                <input
                  id="onboarding-name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your first name..."
                  className="w-full px-3.5 py-2 text-sm rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Select Theme */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-orbit-text">
                Choose your visual theme
              </h2>
              <p className="text-xs text-orbit-muted">
                Orbit is crafted dark-first for focus, with full light and system theme support.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {(
                  [
                    { id: 'dark', label: 'Dark Mode', desc: 'Deep obsidian palette' },
                    { id: 'light', label: 'Light Mode', desc: 'Crisp daylight surface' },
                    { id: 'system', label: 'System Sync', desc: 'Follows OS preference' },
                  ] as Array<{ id: ThemeMode; label: string; desc: string }>
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => void updateSettings({ theme: t.id })}
                    className={`p-3.5 rounded-orbit border text-left transition-all ${
                      settings.theme === t.id
                        ? 'bg-orbit-accent/20 border-orbit-accent text-orbit-text'
                        : 'bg-orbit-secondary/60 border-orbit-border text-orbit-muted hover:text-orbit-text'
                    }`}
                  >
                    <p className="text-xs font-semibold text-orbit-text">{t.label}</p>
                    <p className="text-[11px] text-orbit-muted mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Choose Dashboard Preset */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-orbit-text">
                Select a starting layout preset
              </h2>
              <p className="text-xs text-orbit-muted">
                You can customize, rearrange, or hide any widget later.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    {
                      id: 'minimal',
                      title: 'Minimal',
                      desc: 'Clean clock, search, weather & tasks.',
                    },
                    {
                      id: 'productivity',
                      title: 'Productivity',
                      desc: 'Tasks, notes, focus timer, weather & commands.',
                    },
                    {
                      id: 'developer',
                      title: 'Developer',
                      desc: 'Dev hub, snippets, JSON/Base64 tools & tasks.',
                    },
                    {
                      id: 'personal',
                      title: 'Personal Dashboard',
                      desc: 'Complete workspace with all lifestyle widgets.',
                    },
                  ] as Array<{ id: LayoutPresetId; title: string; desc: string }>
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      applyLayoutPreset(p.id);
                      void updateSettings({ activePreset: p.id });
                    }}
                    className={`p-3 rounded-orbit border text-left ${
                      settings.activePreset === p.id
                        ? 'bg-orbit-accent/20 border-orbit-accent text-orbit-text'
                        : 'bg-orbit-secondary/60 border-orbit-border text-orbit-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-orbit-text">
                        {p.title}
                      </span>
                      {settings.activePreset === p.id && (
                        <Check className="w-3.5 h-3.5 text-orbit-accent" />
                      )}
                    </div>
                    <p className="text-[11px] text-orbit-muted mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Add Quick Links */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-orbit-text">
                Add your favorite quick links
              </h2>
              <p className="text-xs text-orbit-muted">
                We have preloaded essentials like GitHub, Linear, and MDN. Add another site you visit daily:
              </p>
              <form onSubmit={handleAddStarterLink} className="flex gap-2">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Site title (e.g. YouTube)"
                  className="w-1/3 px-3 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                />
                <input
                  type="text"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  placeholder="https://youtube.com"
                  className="flex-1 px-3 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </form>
              {quickError && (
                <p className="text-xs text-rose-400">{quickError}</p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {shortcuts.slice(0, 8).map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
                  >
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Choose Optional Widgets */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-orbit-text">
                Fine-tune your active widgets
              </h2>
              <p className="text-xs text-orbit-muted">
                Toggle which widgets appear on your dashboard canvas.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WIDGET_CATALOG.map((meta) => {
                  const enabled = Boolean(
                    widgets.find((w) => w.type === meta.type)?.enabled
                  );
                  return (
                    <button
                      key={meta.type}
                      type="button"
                      onClick={() => toggleWidgetEnabled(meta.type as WidgetType)}
                      className={`p-2.5 rounded-orbit-sm border text-left flex items-center justify-between ${
                        enabled
                          ? 'bg-orbit-accent/20 border-orbit-accent text-orbit-text'
                          : 'bg-orbit-secondary/50 border-orbit-border text-orbit-muted'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">
                        {meta.title}
                      </span>
                      {enabled && <Check className="w-3.5 h-3.5 text-orbit-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Finish */}
          {step === 6 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-orbit-accent/20 text-orbit-accent flex items-center justify-center mx-auto">
                <Orbit className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold text-orbit-text">
                Your Orbit is ready
              </h2>
              <p className="text-xs text-orbit-muted max-w-md mx-auto leading-relaxed">
                Pro tip: Press <kbd className="px-1.5 py-0.5 bg-orbit-secondary border border-orbit-border rounded-xs font-mono">/</kbd> anytime to search, <kbd className="px-1.5 py-0.5 bg-orbit-secondary border border-orbit-border rounded-xs font-mono">Ctrl/Cmd + K</kbd> for the Command Palette, or <kbd className="px-1.5 py-0.5 bg-orbit-secondary border border-orbit-border rounded-xs font-mono">?</kbd> to view all keyboard shortcuts.
              </p>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-orbit-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-orbit-sm border border-orbit-border text-orbit-muted hover:text-orbit-text"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950 hover:opacity-90"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-orbit-sm bg-orbit-accent text-slate-950 hover:opacity-90"
              >
                Launch Orbit Dashboard
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
