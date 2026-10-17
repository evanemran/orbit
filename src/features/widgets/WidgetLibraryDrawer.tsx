import React, { useState } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useUIStore } from '@/stores/useUIStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { WIDGET_CATALOG } from '@/lib/storage/defaults';
import { LayoutPresetId, WidgetSize } from '@/types';

const PRESETS: Array<{
  id: LayoutPresetId;
  name: string;
  description: string;
}> = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean focus with Weather, Tasks, and Daily Inspiration.',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Tasks, Notes, Focus Timer, Weather, Quick Commands & Favorites.',
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Developer Hub, Tasks, Notes, Quick Commands, Focus & Recent Launches.',
  },
  {
    id: 'personal',
    name: 'Personal Dashboard',
    description: 'Comprehensive personal start page with all core lifestyle widgets.',
  },
];

export const WidgetLibraryDrawer: React.FC = () => {
  const isOpen = useUIStore((s) => s.isWidgetLibraryOpen);
  const closeWidgetLibrary = useUIStore((s) => s.closeWidgetLibrary);
  const addToast = useUIStore((s) => s.addToast);

  const widgets = useDashboardStore((s) => s.widgets);
  const toggleWidgetEnabled = useDashboardStore((s) => s.toggleWidgetEnabled);
  const toggleWidgetHidden = useDashboardStore((s) => s.toggleWidgetHidden);
  const setWidgetSize = useDashboardStore((s) => s.setWidgetSize);
  const applyLayoutPreset = useDashboardStore((s) => s.applyLayoutPreset);
  const restoreDefaultWidgets = useDashboardStore((s) => s.restoreDefaultWidgets);

  const activePreset = useSettingsStore((s) => s.settings.activePreset);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [query, setQuery] = useState('');

  const filteredCatalog = WIDGET_CATALOG.filter(
    (meta) =>
      meta.title.toLowerCase().includes(query.toLowerCase()) ||
      meta.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectPreset = (presetId: LayoutPresetId) => {
    applyLayoutPreset(presetId);
    void updateSettings({ activePreset: presetId });
    addToast({
      title: `Applied "${presetId}" layout preset`,
      description: 'You can freely customize widgets from here.',
      type: 'success',
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeWidgetLibrary}
      title="Widget Library & Presets"
      subtitle="Add, hide, resize, or apply a preset workspace layout"
      widthClass="max-w-lg"
    >
      <div className="space-y-6">
        {/* Preset Layouts */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-orbit-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orbit-accent" />
              Layout Presets
            </h3>
            <button
              type="button"
              onClick={() => {
                restoreDefaultWidgets();
                void updateSettings({ activePreset: 'productivity' });
                addToast({ title: 'Restored default widget layout', type: 'info' });
              }}
              className="inline-flex items-center gap-1 text-[11px] text-orbit-muted hover:text-orbit-text"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Layout
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-3 rounded-orbit text-left border transition-all ${
                    isSelected
                      ? 'bg-orbit-accent/15 border-orbit-accent text-orbit-text'
                      : 'bg-orbit-secondary/60 border-orbit-border text-orbit-muted hover:text-orbit-text hover:border-orbit-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orbit-text">
                      {preset.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-orbit-accent" />}
                  </div>
                  <p className="text-[11px] text-orbit-muted mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search Widgets */}
        <div className="relative">
          <Search className="w-4 h-4 text-orbit-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search available widgets..."
            aria-label="Search widgets"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
          />
        </div>

        {/* Widget Cards */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-orbit-muted">
            Available Widgets ({filteredCatalog.length})
          </h3>

          <div className="space-y-2">
            {filteredCatalog.map((meta) => {
              const instance = widgets.find((w) => w.type === meta.type);
              const isEnabled = Boolean(instance?.enabled);
              const isHidden = Boolean(instance?.hidden);
              const currentSize: WidgetSize = instance?.size || meta.defaultSize;

              return (
                <div
                  key={meta.type}
                  className={`p-3.5 rounded-orbit border transition-all ${
                    isEnabled
                      ? 'bg-orbit-secondary/80 border-orbit-accent/40'
                      : 'bg-orbit-secondary/30 border-orbit-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-orbit-text">
                          {meta.title}
                        </h4>
                        {isEnabled && !isHidden && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded-xs bg-emerald-500/15 text-emerald-400 font-medium">
                            Active
                          </span>
                        )}
                        {isEnabled && isHidden && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded-xs bg-amber-500/15 text-amber-300 font-medium">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-orbit-muted mt-1">
                        {meta.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleWidgetEnabled(meta.type)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-orbit-sm shrink-0 transition-colors ${
                        isEnabled
                          ? 'bg-orbit-elevated text-orbit-text hover:bg-rose-500/20 hover:text-rose-300 border border-orbit-border'
                          : 'bg-orbit-accent text-slate-950 hover:opacity-90'
                      }`}
                    >
                      {isEnabled ? (
                        <>Remove</>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </>
                      )}
                    </button>
                  </div>

                  {isEnabled && instance && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-orbit-border/50 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-orbit-muted">Width:</span>
                        {(['sm', 'md', 'lg'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setWidgetSize(instance.id, sz)}
                            className={`px-2 py-0.5 rounded-xs uppercase font-mono ${
                              currentSize === sz
                                ? 'bg-orbit-accent text-slate-950 font-semibold'
                                : 'bg-orbit-main text-orbit-muted hover:text-orbit-text'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleWidgetHidden(instance.id)}
                        className="inline-flex items-center gap-1 text-orbit-muted hover:text-orbit-text"
                      >
                        {isHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-orbit-accent" />
                            <span>Unhide</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide temporarily</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Drawer>
  );
};
