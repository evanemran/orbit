import { create } from 'zustand';
import { OrbitSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/storage/defaults';
import { readStorage, writeStorage } from '@/lib/storage/chromeStorage';
import { useUIStore } from '@/stores/useUIStore';

const SETTINGS_STORAGE_KEY = 'orbit_settings_v1';

interface SettingsState {
  settings: OrbitSettings;
  isHydrated: boolean;
  hydrateSettings: () => Promise<void>;
  updateSettings: (partial: Partial<OrbitSettings>) => Promise<boolean>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isHydrated: false,

  hydrateSettings: async () => {
    const stored = await readStorage<Partial<OrbitSettings>>(
      SETTINGS_STORAGE_KEY,
      'sync',
      DEFAULT_SETTINGS
    );
    const merged: OrbitSettings = { ...DEFAULT_SETTINGS, ...stored };
    set({ settings: merged, isHydrated: true });
  },

  updateSettings: async (partial) => {
    const nextSettings: OrbitSettings = { ...get().settings, ...partial };
    set({ settings: nextSettings });

    // Custom upload data URLs can be large, so if backgroundType is custom-upload we use local
    const area =
      nextSettings.backgroundType === 'custom-upload' &&
      nextSettings.backgroundValue.length > 2048
        ? 'local'
        : 'sync';

    const res = await writeStorage(SETTINGS_STORAGE_KEY, nextSettings, area);
    if (!res.ok) {
      useUIStore.getState().addToast({
        title: 'Storage Error',
        description: res.error || 'Could not save preferences.',
        type: 'error',
      });
      return false;
    }
    return true;
  },

  resetSettings: async () => {
    const resetVal: OrbitSettings = {
      ...DEFAULT_SETTINGS,
      onboardingCompleted: true,
    };
    set({ settings: resetVal });
    await writeStorage(SETTINGS_STORAGE_KEY, resetVal, 'sync');
  },
}));
