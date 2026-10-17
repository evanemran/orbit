import { create } from 'zustand';
import { generateId } from '@/lib/formatting/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  undoAction?: () => void;
}

interface UIState {
  isSettingsOpen: boolean;
  settingsTab: 'appearance' | 'dashboard' | 'search' | 'general';
  isWidgetLibraryOpen: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsHelpOpen: boolean;
  shortcutModalState: {
    isOpen: boolean;
    editingShortcutId?: string | null;
  };
  toasts: ToastMessage[];

  openSettings: (tab?: 'appearance' | 'dashboard' | 'search' | 'general') => void;
  closeSettings: () => void;
  openWidgetLibrary: () => void;
  closeWidgetLibrary: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openShortcutsHelp: () => void;
  closeShortcutsHelp: () => void;
  openShortcutModal: (editingShortcutId?: string | null) => void;
  closeShortcutModal: () => void;
  closeAllOverlays: () => void;

  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsOpen: false,
  settingsTab: 'appearance',
  isWidgetLibraryOpen: false,
  isCommandPaletteOpen: false,
  isShortcutsHelpOpen: false,
  shortcutModalState: { isOpen: false, editingShortcutId: null },
  toasts: [],

  openSettings: (tab = 'appearance') =>
    set({ isSettingsOpen: true, settingsTab: tab, isCommandPaletteOpen: false }),
  closeSettings: () => set({ isSettingsOpen: false }),

  openWidgetLibrary: () =>
    set({ isWidgetLibraryOpen: true, isCommandPaletteOpen: false }),
  closeWidgetLibrary: () => set({ isWidgetLibraryOpen: false }),

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),

  openShortcutsHelp: () =>
    set({ isShortcutsHelpOpen: true, isCommandPaletteOpen: false }),
  closeShortcutsHelp: () => set({ isShortcutsHelpOpen: false }),

  openShortcutModal: (editingShortcutId = null) =>
    set({
      shortcutModalState: { isOpen: true, editingShortcutId },
      isCommandPaletteOpen: false,
    }),
  closeShortcutModal: () =>
    set({ shortcutModalState: { isOpen: false, editingShortcutId: null } }),

  closeAllOverlays: () =>
    set({
      isSettingsOpen: false,
      isWidgetLibraryOpen: false,
      isCommandPaletteOpen: false,
      isShortcutsHelpOpen: false,
      shortcutModalState: { isOpen: false, editingShortcutId: null },
    }),

  addToast: (toast) => {
    const id = generateId('toast');
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { ...toast, id }],
    }));
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
