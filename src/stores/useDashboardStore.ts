import { create } from 'zustand';
import {
  DevSnippetItem,
  FocusMode,
  FocusTimerState,
  InspirationQuote,
  LayoutPresetId,
  NoteItem,
  QuickCommandItem,
  ShortcutItem,
  TaskItem,
  TaskPriority,
  WeatherConfig,
  WidgetInstance,
  WidgetSize,
  WidgetType,
  Workspace,
} from '@/types';
import {
  buildPresetWidgets,
  DEFAULT_DEV_SNIPPETS,
  DEFAULT_FOCUS_TIMER,
  DEFAULT_NOTES,
  DEFAULT_QUICK_COMMANDS,
  DEFAULT_QUOTES,
  DEFAULT_SHORTCUTS,
  DEFAULT_TASKS,
  DEFAULT_WEATHER_CONFIG,
  DEFAULT_WORKSPACES,
  WIDGET_CATALOG,
} from '@/lib/storage/defaults';
import { readStorage, writeStorage } from '@/lib/storage/chromeStorage';
import { generateId } from '@/lib/formatting/utils';
import { getCanonicalUrlKey, validateAndNormalizeUrl } from '@/lib/validation/url';
import { useUIStore } from '@/stores/useUIStore';

const DASHBOARD_STORAGE_KEY = 'orbit_dashboard_data_v1';

export interface PersistedDashboardData {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  shortcuts: ShortcutItem[];
  widgets: WidgetInstance[];
  tasks: TaskItem[];
  notes: NoteItem[];
  activeNoteId: string;
  focusTimer: FocusTimerState;
  quickCommands: QuickCommandItem[];
  devSnippets: DevSnippetItem[];
  weatherConfig: WeatherConfig;
  quotes: InspirationQuote[];
  activeQuoteIndex: number;
  customMotto: string;
  searchHistory: string[];
}

const INITIAL_DATA: PersistedDashboardData = {
  workspaces: DEFAULT_WORKSPACES,
  activeWorkspaceId: 'ws_personal',
  shortcuts: DEFAULT_SHORTCUTS,
  widgets: buildPresetWidgets('productivity'),
  tasks: DEFAULT_TASKS,
  notes: DEFAULT_NOTES,
  activeNoteId: DEFAULT_NOTES[0].id,
  focusTimer: DEFAULT_FOCUS_TIMER,
  quickCommands: DEFAULT_QUICK_COMMANDS,
  devSnippets: DEFAULT_DEV_SNIPPETS,
  weatherConfig: DEFAULT_WEATHER_CONFIG,
  quotes: DEFAULT_QUOTES,
  activeQuoteIndex: 0,
  customMotto: '',
  searchHistory: [],
};

interface DashboardState extends PersistedDashboardData {
  isHydrated: boolean;
  lastSavedAt: number | null;

  hydrateDashboard: () => Promise<void>;
  persistDashboard: () => Promise<boolean>;
  resetDashboardData: () => Promise<void>;

  // Workspaces
  setActiveWorkspace: (workspaceId: string) => void;
  addWorkspace: (name: string) => void;

  // Shortcuts
  addShortcut: (input: {
    title: string;
    url: string;
    accentColor?: string;
    customIcon?: string;
    pinned?: boolean;
  }) => { ok: boolean; error?: string; duplicate?: boolean; item?: ShortcutItem };
  updateShortcut: (
    id: string,
    updates: Partial<Omit<ShortcutItem, 'id' | 'createdAt'>>
  ) => { ok: boolean; error?: string };
  deleteShortcut: (id: string) => void;
  reorderShortcuts: (activeId: string, overId: string) => void;
  moveShortcutByOffset: (id: string, offset: -1 | 1) => void;
  recordShortcutLaunch: (id: string) => void;
  clearRecentLaunches: () => void;
  importShortcuts: (items: Array<{ title: string; url: string; pinned?: boolean }>) => number;

  // Widgets
  applyLayoutPreset: (preset: LayoutPresetId) => void;
  toggleWidgetEnabled: (type: WidgetType) => void;
  toggleWidgetHidden: (id: string) => void;
  setWidgetSize: (id: string, size: WidgetSize) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  moveWidgetByOffset: (id: string, offset: -1 | 1) => void;
  restoreDefaultWidgets: () => void;

  // Tasks
  addTask: (title: string, priority?: TaskPriority, dueDate?: string) => TaskItem | null;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Pick<TaskItem, 'title' | 'priority' | 'dueDate'>>) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;

  // Notes
  createNote: (title?: string, content?: string) => NoteItem;
  updateNote: (id: string, updates: Partial<Pick<NoteItem, 'title' | 'content' | 'pinned'>>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string) => void;

  // Focus Timer (timestamp-reconstructed)
  startFocusTimer: () => void;
  pauseFocusTimer: () => void;
  resetFocusTimer: () => void;
  switchFocusMode: (mode: FocusMode) => void;
  updateFocusDurations: (focusMin: number, shortMin: number, longMin: number) => void;
  syncFocusTimerWithNow: (now?: number) => void;

  // Quick Commands & Developer Snippets
  addQuickCommand: (cmd: Omit<QuickCommandItem, 'id'>) => void;
  deleteQuickCommand: (id: string) => void;
  addDevSnippet: (snippet: Omit<DevSnippetItem, 'id'>) => void;
  deleteDevSnippet: (id: string) => void;

  // Weather & Inspiration
  updateWeatherConfig: (partial: Partial<WeatherConfig>) => void;
  nextQuote: () => void;
  toggleQuoteFavorite: (id: string) => void;
  setCustomMotto: (motto: string) => void;

  // Search History
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // Full Import
  importDashboardSnapshot: (data: Partial<PersistedDashboardData>) => Promise<void>;
}

function extractPersistedSlice(state: DashboardState): PersistedDashboardData {
  return {
    workspaces: state.workspaces,
    activeWorkspaceId: state.activeWorkspaceId,
    shortcuts: state.shortcuts,
    widgets: state.widgets,
    tasks: state.tasks,
    notes: state.notes,
    activeNoteId: state.activeNoteId,
    focusTimer: state.focusTimer,
    quickCommands: state.quickCommands,
    devSnippets: state.devSnippets,
    weatherConfig: state.weatherConfig,
    quotes: state.quotes,
    activeQuoteIndex: state.activeQuoteIndex,
    customMotto: state.customMotto,
    searchHistory: state.searchHistory,
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...INITIAL_DATA,
  isHydrated: false,
  lastSavedAt: null,

  hydrateDashboard: async () => {
    const stored = await readStorage<Partial<PersistedDashboardData>>(
      DASHBOARD_STORAGE_KEY,
      'local',
      INITIAL_DATA
    );

    // Ensure any newly introduced widget types from WIDGET_CATALOG exist
    const storedWidgets = stored.widgets && stored.widgets.length > 0
      ? stored.widgets
      : INITIAL_DATA.widgets;

    const existingTypes = new Set(storedWidgets.map((w) => w.type));
    const mergedWidgets = [...storedWidgets];
    WIDGET_CATALOG.forEach((meta, idx) => {
      if (!existingTypes.has(meta.type)) {
        mergedWidgets.push({
          id: `widget_${meta.type}`,
          type: meta.type,
          title: meta.title,
          enabled: false,
          hidden: false,
          size: meta.defaultSize,
          order: mergedWidgets.length + idx,
        });
      }
    });

    set({
      ...INITIAL_DATA,
      ...stored,
      widgets: mergedWidgets,
      isHydrated: true,
    });

    // Reconcile focus timer if it was running when tab closed
    get().syncFocusTimerWithNow(Date.now());
  },

  persistDashboard: async () => {
    const payload = extractPersistedSlice(get());
    const res = await writeStorage(DASHBOARD_STORAGE_KEY, payload, 'local');
    if (res.ok) {
      set({ lastSavedAt: Date.now() });
      return true;
    } else {
      useUIStore.getState().addToast({
        title: 'Storage Warning',
        description: res.error || 'Failed to persist workspace data.',
        type: 'error',
      });
      return false;
    }
  },

  resetDashboardData: async () => {
    set({
      ...INITIAL_DATA,
      isHydrated: true,
      lastSavedAt: Date.now(),
    });
    await writeStorage(DASHBOARD_STORAGE_KEY, INITIAL_DATA, 'local');
  },

  setActiveWorkspace: (workspaceId) => {
    set({ activeWorkspaceId: workspaceId });
    void get().persistDashboard();
  },

  addWorkspace: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newWs: Workspace = {
      id: generateId('ws'),
      name: trimmed,
      icon: 'Folder',
      accentColor: '#8B9CFF',
    };
    set((s) => ({
      workspaces: [...s.workspaces, newWs],
      activeWorkspaceId: newWs.id,
    }));
    void get().persistDashboard();
  },

  addShortcut: (input) => {
    const title = input.title.trim();
    if (!title) {
      return { ok: false, error: 'Title is required.' };
    }
    const validation = validateAndNormalizeUrl(input.url);
    if (!validation.isValid) {
      return { ok: false, error: validation.error || 'Invalid URL.' };
    }

    const canonicalNew = getCanonicalUrlKey(validation.normalizedUrl);
    const existing = get().shortcuts.find(
      (s) =>
        s.workspaceId === get().activeWorkspaceId &&
        getCanonicalUrlKey(s.url) === canonicalNew
    );

    if (existing) {
      return {
        ok: false,
        duplicate: true,
        error: `A shortcut for "${existing.title}" (${validation.hostname}) already exists in this workspace.`,
      };
    }

    const newItem: ShortcutItem = {
      id: generateId('sc'),
      title,
      url: validation.normalizedUrl,
      accentColor: input.accentColor || '#8B9CFF',
      customIcon: input.customIcon?.trim() || undefined,
      pinned: Boolean(input.pinned),
      workspaceId: get().activeWorkspaceId,
      order: get().shortcuts.length,
      createdAt: Date.now(),
      launchCount: 0,
    };

    set((s) => ({
      shortcuts: [...s.shortcuts, newItem],
    }));
    void get().persistDashboard();
    return { ok: true, item: newItem };
  },

  updateShortcut: (id, updates) => {
    if (updates.url !== undefined) {
      const validation = validateAndNormalizeUrl(updates.url);
      if (!validation.isValid) {
        return { ok: false, error: validation.error || 'Invalid URL.' };
      }
      const canonicalNew = getCanonicalUrlKey(validation.normalizedUrl);
      const duplicate = get().shortcuts.find(
        (s) =>
          s.id !== id &&
          s.workspaceId === get().activeWorkspaceId &&
          getCanonicalUrlKey(s.url) === canonicalNew
      );
      if (duplicate) {
        return {
          ok: false,
          error: `Another shortcut ("${duplicate.title}") already uses this URL.`,
        };
      }
      updates.url = validation.normalizedUrl;
    }

    set((s) => ({
      shortcuts: s.shortcuts.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
    void get().persistDashboard();
    return { ok: true };
  },

  deleteShortcut: (id) => {
    const target = get().shortcuts.find((s) => s.id === id);
    if (!target) return;
    const previous = get().shortcuts;
    set((s) => ({
      shortcuts: s.shortcuts.filter((item) => item.id !== id),
    }));
    void get().persistDashboard();

    useUIStore.getState().addToast({
      title: `Removed "${target.title}"`,
      type: 'info',
      undoAction: () => {
        set({ shortcuts: previous });
        void get().persistDashboard();
      },
    });
  },

  reorderShortcuts: (activeId, overId) => {
    if (activeId === overId) return;
    set((s) => {
      const items = [...s.shortcuts];
      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return s;
      const [moved] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, moved);
      return {
        shortcuts: items.map((item, idx) => ({ ...item, order: idx })),
      };
    });
    void get().persistDashboard();
  },

  moveShortcutByOffset: (id, offset) => {
    const wsId = get().activeWorkspaceId;
    const wsShortcuts = get()
      .shortcuts.filter((s) => s.workspaceId === wsId)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order);

    const idx = wsShortcuts.findIndex((s) => s.id === id);
    const targetIdx = idx + offset;
    if (idx === -1 || targetIdx < 0 || targetIdx >= wsShortcuts.length) return;
    get().reorderShortcuts(id, wsShortcuts[targetIdx].id);
  },

  recordShortcutLaunch: (id) => {
    set((s) => ({
      shortcuts: s.shortcuts.map((item) =>
        item.id === id
          ? {
              ...item,
              lastUsedAt: Date.now(),
              launchCount: (item.launchCount || 0) + 1,
            }
          : item
      ),
    }));
    void get().persistDashboard();
  },

  clearRecentLaunches: () => {
    set((s) => ({
      shortcuts: s.shortcuts.map((item) => ({
        ...item,
        lastUsedAt: undefined,
        launchCount: 0,
      })),
    }));
    void get().persistDashboard();
  },

  importShortcuts: (items) => {
    let added = 0;
    const currentShortcuts = [...get().shortcuts];
    const wsId = get().activeWorkspaceId;

    for (const raw of items) {
      if (!raw || typeof raw.url !== 'string' || typeof raw.title !== 'string') continue;
      const v = validateAndNormalizeUrl(raw.url);
      if (!v.isValid) continue;

      const canonical = getCanonicalUrlKey(v.normalizedUrl);
      const exists = currentShortcuts.some(
        (s) => s.workspaceId === wsId && getCanonicalUrlKey(s.url) === canonical
      );
      if (exists) continue;

      currentShortcuts.push({
        id: generateId('sc'),
        title: raw.title.trim() || v.hostname,
        url: v.normalizedUrl,
        accentColor: '#8B9CFF',
        pinned: Boolean(raw.pinned),
        workspaceId: wsId,
        order: currentShortcuts.length,
        createdAt: Date.now(),
        launchCount: 0,
      });
      added++;
    }

    if (added > 0) {
      set({ shortcuts: currentShortcuts });
      void get().persistDashboard();
    }
    return added;
  },

  applyLayoutPreset: (preset) => {
    const nextWidgets = buildPresetWidgets(preset);
    set({ widgets: nextWidgets });
    void get().persistDashboard();
  },

  toggleWidgetEnabled: (type) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.type === type ? { ...w, enabled: !w.enabled, hidden: false } : w
      ),
    }));
    void get().persistDashboard();
  },

  toggleWidgetHidden: (id) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.id === id ? { ...w, hidden: !w.hidden } : w
      ),
    }));
    void get().persistDashboard();
  },

  setWidgetSize: (id, size) => {
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === id ? { ...w, size } : w)),
    }));
    void get().persistDashboard();
  },

  reorderWidgets: (activeId, overId) => {
    if (activeId === overId) return;
    set((s) => {
      const sorted = [...s.widgets].sort((a, b) => a.order - b.order);
      const oldIdx = sorted.findIndex((w) => w.id === activeId);
      const newIdx = sorted.findIndex((w) => w.id === overId);
      if (oldIdx === -1 || newIdx === -1) return s;
      const [moved] = sorted.splice(oldIdx, 1);
      sorted.splice(newIdx, 0, moved);
      return {
        widgets: sorted.map((w, i) => ({ ...w, order: i })),
      };
    });
    void get().persistDashboard();
  },

  moveWidgetByOffset: (id, offset) => {
    const visible = get()
      .widgets.filter((w) => w.enabled && !w.hidden)
      .sort((a, b) => a.order - b.order);
    const idx = visible.findIndex((w) => w.id === id);
    const targetIdx = idx + offset;
    if (idx === -1 || targetIdx < 0 || targetIdx >= visible.length) return;
    get().reorderWidgets(id, visible[targetIdx].id);
  },

  restoreDefaultWidgets: () => {
    set({ widgets: buildPresetWidgets('productivity') });
    void get().persistDashboard();
  },

  addTask: (title, priority = 'medium', dueDate) => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const item: TaskItem = {
      id: generateId('task'),
      title: trimmed,
      completed: false,
      priority,
      dueDate: dueDate || undefined,
      workspaceId: get().activeWorkspaceId,
      createdAt: Date.now(),
    };
    set((s) => ({ tasks: [item, ...s.tasks] }));
    void get().persistDashboard();
    return item;
  },

  toggleTask: (id) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? Date.now() : undefined,
            }
          : t
      ),
    }));
    void get().persistDashboard();
  },

  updateTask: (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    void get().persistDashboard();
  },

  deleteTask: (id) => {
    const prev = get().tasks;
    const target = prev.find((t) => t.id === id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    void get().persistDashboard();
    if (target) {
      useUIStore.getState().addToast({
        title: 'Task deleted',
        type: 'info',
        undoAction: () => {
          set({ tasks: prev });
          void get().persistDashboard();
        },
      });
    }
  },

  clearCompletedTasks: () => {
    const prev = get().tasks;
    const hasCompleted = prev.some((t) => t.completed);
    if (!hasCompleted) return;
    set((s) => ({ tasks: s.tasks.filter((t) => !t.completed) }));
    void get().persistDashboard();
    useUIStore.getState().addToast({
      title: 'Cleared completed tasks',
      type: 'success',
      undoAction: () => {
        set({ tasks: prev });
        void get().persistDashboard();
      },
    });
  },

  createNote: (title = 'Untitled Note', content = '') => {
    const note: NoteItem = {
      id: generateId('note'),
      title: title.trim() || 'Untitled Note',
      content,
      workspaceId: get().activeWorkspaceId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({
      notes: [note, ...s.notes],
      activeNoteId: note.id,
    }));
    void get().persistDashboard();
    return note;
  },

  updateNote: (id, updates) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      ),
    }));
    void get().persistDashboard();
  },

  deleteNote: (id) => {
    const prevNotes = get().notes;
    const remaining = prevNotes.filter((n) => n.id !== id);
    let nextActiveId = get().activeNoteId;
    if (nextActiveId === id) {
      nextActiveId = remaining[0]?.id || '';
    }
    set({
      notes: remaining,
      activeNoteId: nextActiveId,
    });
    void get().persistDashboard();
  },

  setActiveNote: (id) => {
    set({ activeNoteId: id });
    void get().persistDashboard();
  },

  startFocusTimer: () => {
    const timer = get().focusTimer;
    if (timer.isRunning) return;
    const now = Date.now();
    const durationMs =
      timer.remainingMsOnPause > 0
        ? timer.remainingMsOnPause
        : timer.focusMinutes * 60 * 1000;
    set({
      focusTimer: {
        ...timer,
        isRunning: true,
        targetEndTime: now + durationMs,
      },
    });
    void get().persistDashboard();
  },

  pauseFocusTimer: () => {
    const timer = get().focusTimer;
    if (!timer.isRunning || !timer.targetEndTime) return;
    const remaining = Math.max(0, timer.targetEndTime - Date.now());
    set({
      focusTimer: {
        ...timer,
        isRunning: false,
        targetEndTime: null,
        remainingMsOnPause: remaining,
      },
    });
    void get().persistDashboard();
  },

  resetFocusTimer: () => {
    const timer = get().focusTimer;
    const durationMinutes =
      timer.mode === 'focus'
        ? timer.focusMinutes
        : timer.mode === 'shortBreak'
        ? timer.shortBreakMinutes
        : timer.longBreakMinutes;
    set({
      focusTimer: {
        ...timer,
        isRunning: false,
        targetEndTime: null,
        remainingMsOnPause: durationMinutes * 60 * 1000,
      },
    });
    void get().persistDashboard();
  },

  switchFocusMode: (mode) => {
    const timer = get().focusTimer;
    const durationMinutes =
      mode === 'focus'
        ? timer.focusMinutes
        : mode === 'shortBreak'
        ? timer.shortBreakMinutes
        : timer.longBreakMinutes;
    set({
      focusTimer: {
        ...timer,
        mode,
        isRunning: false,
        targetEndTime: null,
        remainingMsOnPause: durationMinutes * 60 * 1000,
      },
    });
    void get().persistDashboard();
  },

  updateFocusDurations: (focusMin, shortMin, longMin) => {
    const f = Math.max(1, Math.min(120, focusMin));
    const s = Math.max(1, Math.min(60, shortMin));
    const l = Math.max(1, Math.min(90, longMin));
    const timer = get().focusTimer;
    const activeMinutes =
      timer.mode === 'focus' ? f : timer.mode === 'shortBreak' ? s : l;

    set({
      focusTimer: {
        ...timer,
        focusMinutes: f,
        shortBreakMinutes: s,
        longBreakMinutes: l,
        isRunning: false,
        targetEndTime: null,
        remainingMsOnPause: activeMinutes * 60 * 1000,
      },
    });
    void get().persistDashboard();
  },

  syncFocusTimerWithNow: (now = Date.now()) => {
    const timer = get().focusTimer;
    if (!timer.isRunning || !timer.targetEndTime) return;

    const remaining = timer.targetEndTime - now;
    if (remaining <= 0) {
      const completedFocus = timer.mode === 'focus';
      const nextSessions = completedFocus
        ? timer.completedSessions + 1
        : timer.completedSessions;
      const nextMode: FocusMode = completedFocus
        ? nextSessions % 4 === 0
          ? 'longBreak'
          : 'shortBreak'
        : 'focus';
      const nextDuration =
        nextMode === 'focus'
          ? timer.focusMinutes
          : nextMode === 'shortBreak'
          ? timer.shortBreakMinutes
          : timer.longBreakMinutes;

      set({
        focusTimer: {
          ...timer,
          mode: nextMode,
          isRunning: false,
          targetEndTime: null,
          remainingMsOnPause: nextDuration * 60 * 1000,
          completedSessions: nextSessions,
        },
      });
      void get().persistDashboard();

      useUIStore.getState().addToast({
        title: completedFocus ? 'Focus session complete!' : 'Break finished!',
        description: completedFocus
          ? 'Great work. Ready for a break?'
          : 'Ready to dive back into focus?',
        type: 'success',
      });
    }
  },

  addQuickCommand: (cmd) => {
    const newCmd: QuickCommandItem = {
      ...cmd,
      id: generateId('cmd'),
      isCustom: true,
    };
    set((s) => ({ quickCommands: [...s.quickCommands, newCmd] }));
    void get().persistDashboard();
  },

  deleteQuickCommand: (id) => {
    set((s) => ({
      quickCommands: s.quickCommands.filter((c) => c.id !== id),
    }));
    void get().persistDashboard();
  },

  addDevSnippet: (snippet) => {
    const newSnippet: DevSnippetItem = {
      ...snippet,
      id: generateId('dev'),
    };
    set((s) => ({ devSnippets: [newSnippet, ...s.devSnippets] }));
    void get().persistDashboard();
  },

  deleteDevSnippet: (id) => {
    set((s) => ({
      devSnippets: s.devSnippets.filter((d) => d.id !== id),
    }));
    void get().persistDashboard();
  },

  updateWeatherConfig: (partial) => {
    set((s) => ({
      weatherConfig: { ...s.weatherConfig, ...partial },
    }));
    void get().persistDashboard();
  },

  nextQuote: () => {
    set((s) => ({
      activeQuoteIndex: (s.activeQuoteIndex + 1) % Math.max(1, s.quotes.length),
    }));
    void get().persistDashboard();
  },

  toggleQuoteFavorite: (id) => {
    set((s) => ({
      quotes: s.quotes.map((q) =>
        q.id === id ? { ...q, favorited: !q.favorited } : q
      ),
    }));
    void get().persistDashboard();
  },

  setCustomMotto: (motto) => {
    set({ customMotto: motto });
    void get().persistDashboard();
  },

  addSearchHistory: (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    set((s) => {
      const deduped = s.searchHistory.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      return {
        searchHistory: [trimmed, ...deduped].slice(0, 12),
      };
    });
    void get().persistDashboard();
  },

  clearSearchHistory: () => {
    set({ searchHistory: [] });
    void get().persistDashboard();
  },

  importDashboardSnapshot: async (data) => {
    set((s) => ({
      ...s,
      ...data,
      lastSavedAt: Date.now(),
    }));
    await get().persistDashboard();
  },
}));
