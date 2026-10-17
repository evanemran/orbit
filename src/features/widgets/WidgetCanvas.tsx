import React, { useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  EyeOff,
  X,
  Plus,
  LayoutGrid,
  CloudSun,
  CheckSquare,
  FileText,
  Timer,
  Bookmark,
  Zap,
  Code2,
  Sparkles,
  History,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { WidgetInstance, WidgetSize, WidgetType } from '@/types';
import { WeatherWidget } from '@/features/widgets/weather/WeatherWidget';
import { TasksWidget } from '@/features/tasks/TasksWidget';
import { NotesWidget } from '@/features/notes/NotesWidget';
import { FocusTimerWidget } from '@/features/focus/FocusTimerWidget';
import { BookmarksWidget } from '@/features/widgets/bookmarks/BookmarksWidget';
import { QuickCommandsWidget } from '@/features/widgets/quick-commands/QuickCommandsWidget';
import { DeveloperWidget } from '@/features/developer-tools/DeveloperWidget';
import { InspirationWidget } from '@/features/widgets/inspiration/InspirationWidget';
import { RecentShortcutsWidget } from '@/features/widgets/recent/RecentShortcutsWidget';

const WIDGET_ICONS: Record<WidgetType, React.FC<{ className?: string }>> = {
  weather: CloudSun,
  tasks: CheckSquare,
  notes: FileText,
  focus: Timer,
  bookmarks: Bookmark,
  'quick-commands': Zap,
  developer: Code2,
  inspiration: Sparkles,
  'recent-shortcuts': History,
};

function renderWidgetBody(widget: WidgetInstance) {
  switch (widget.type) {
    case 'weather':
      return <WeatherWidget />;
    case 'tasks':
      return <TasksWidget />;
    case 'notes':
      return <NotesWidget />;
    case 'focus':
      return <FocusTimerWidget />;
    case 'bookmarks':
      return <BookmarksWidget />;
    case 'quick-commands':
      return <QuickCommandsWidget />;
    case 'developer':
      return <DeveloperWidget />;
    case 'inspiration':
      return <InspirationWidget />;
    case 'recent-shortcuts':
      return <RecentShortcutsWidget />;
    default:
      return null;
  }
}

export const WidgetCanvas: React.FC = () => {
  const widgets = useDashboardStore((s) => s.widgets);
  const reorderWidgets = useDashboardStore((s) => s.reorderWidgets);
  const moveWidgetByOffset = useDashboardStore((s) => s.moveWidgetByOffset);
  const setWidgetSize = useDashboardStore((s) => s.setWidgetSize);
  const toggleWidgetHidden = useDashboardStore((s) => s.toggleWidgetHidden);
  const toggleWidgetEnabled = useDashboardStore((s) => s.toggleWidgetEnabled);

  const density = useSettingsStore((s) => s.settings.density);
  const widgetColumns = useSettingsStore((s) => s.settings.widgetColumns);
  const openWidgetLibrary = useUIStore((s) => s.openWidgetLibrary);

  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

  const visibleWidgets = widgets
    .filter((w) => w.enabled && !w.hidden)
    .sort((a, b) => a.order - b.order);

  const gridColsClass =
    widgetColumns === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  const gapClass = density === 'compact' ? 'gap-3' : 'gap-4';
  const cardPadding = density === 'compact' ? 'p-3.5' : 'p-4';

  const cycleSize = (current: WidgetSize): WidgetSize => {
    if (current === 'sm') return 'md';
    if (current === 'md') return 'lg';
    return 'sm';
  };

  return (
    <section aria-label="Dashboard Widgets" className="w-full max-w-7xl mx-auto space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium uppercase tracking-wider text-orbit-muted">
          Workspace Canvas
        </h2>
        <button
          type="button"
          onClick={openWidgetLibrary}
          className="inline-flex items-center gap-1 text-xs text-orbit-muted hover:text-orbit-text transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-orbit-accent" />
          <span>Customize Widgets</span>
        </button>
      </div>

      {visibleWidgets.length === 0 ? (
        <div className="rounded-orbit-lg orbit-glass p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-orbit-accent/15 text-orbit-accent flex items-center justify-center mx-auto">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-orbit-text">
              No active widgets on your canvas
            </p>
            <p className="text-xs text-orbit-muted mt-0.5">
              Open the Widget Library to enable tasks, notes, focus timer, weather, or developer tools.
            </p>
          </div>
          <button
            type="button"
            onClick={openWidgetLibrary}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950"
          >
            Open Widget Library
          </button>
        </div>
      ) : (
        <div className={`grid ${gridColsClass} ${gapClass} items-start`}>
          {visibleWidgets.map((widget) => {
            const Icon = WIDGET_ICONS[widget.type] || LayoutGrid;
            const spanClass =
              widget.size === 'lg'
                ? 'md:col-span-2'
                : widget.size === 'md'
                ? 'md:col-span-1'
                : 'col-span-1';

            return (
              <article
                key={widget.id}
                aria-label={`${widget.title} widget`}
                draggable
                onDragStart={() => setDraggedWidgetId(widget.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedWidgetId && draggedWidgetId !== widget.id) {
                    reorderWidgets(draggedWidgetId, widget.id);
                  }
                  setDraggedWidgetId(null);
                }}
                className={`group rounded-orbit-lg orbit-glass shadow-orbit-sm transition-all flex flex-col ${spanClass} ${cardPadding}`}
              >
                {/* Widget Header */}
                <header className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-orbit-border/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      title="Drag to reorder widget"
                      className="cursor-grab active:cursor-grabbing text-orbit-muted/60 hover:text-orbit-text"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                    <Icon className="w-4 h-4 text-orbit-accent shrink-0" />
                    <h3 className="text-xs font-semibold text-orbit-text tracking-wide truncate">
                      {widget.title}
                    </h3>
                  </div>

                  {/* Accessible Reorder, Resize, Hide & Remove Controls */}
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveWidgetByOffset(widget.id, -1)}
                      title="Move widget earlier"
                      aria-label={`Move ${widget.title} up`}
                      className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWidgetByOffset(widget.id, 1)}
                      title="Move widget later"
                      aria-label={`Move ${widget.title} down`}
                      className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidgetSize(widget.id, cycleSize(widget.size))}
                      title={`Size: ${widget.size.toUpperCase()} (click to resize)`}
                      aria-label={`Resize ${widget.title}`}
                      className="px-1.5 py-0.5 text-[10px] font-mono uppercase text-orbit-muted hover:text-orbit-text rounded-xs bg-orbit-secondary/70"
                    >
                      {widget.size}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWidgetHidden(widget.id)}
                      title="Hide widget temporarily"
                      aria-label={`Hide ${widget.title}`}
                      className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWidgetEnabled(widget.type)}
                      title="Remove widget from canvas"
                      aria-label={`Remove ${widget.title}`}
                      className="p-1 text-orbit-muted hover:text-rose-400 rounded-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </header>

                {/* Widget Content */}
                <div className="flex-1">{renderWidgetBody(widget)}</div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
