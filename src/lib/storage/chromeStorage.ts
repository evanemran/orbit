export interface StorageResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  quotaExceeded?: boolean;
}

const SYNC_MAX_ITEM_BYTES = 7800; // Chrome QUOTA_BYTES_PER_ITEM is 8192

function isChromeStorageAvailable(area: 'local' | 'sync'): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof chrome !== 'undefined' &&
    Boolean(chrome.storage) &&
    Boolean(chrome.storage[area])
  );
}

function getByteLength(value: unknown): number {
  try {
    const serialized = JSON.stringify(value);
    return new TextEncoder().encode(serialized).length;
  } catch {
    return Infinity;
  }
}

/**
 * Reads a key from chrome.storage.sync (or local fallback) with automatic localStorage fallback for dev/test.
 */
export async function readStorage<T>(
  key: string,
  area: 'local' | 'sync' = 'local',
  defaultValue: T
): Promise<T> {
  if (isChromeStorageAvailable(area)) {
    try {
      const result = await new Promise<Record<string, T>>((resolve, reject) => {
        chrome.storage[area].get([key], (items) => {
          const err = chrome.runtime?.lastError;
          if (err) {
            reject(new Error(err.message));
          } else {
            resolve(items as Record<string, T>);
          }
        });
      });

      if (result && result[key] !== undefined) {
        return result[key];
      }

      // If reading from sync and not found, check local in case it fell back due to quota
      if (area === 'sync' && isChromeStorageAvailable('local')) {
        const localFallback = await readStorage<T | undefined>(key, 'local', undefined);
        if (localFallback !== undefined) return localFallback;
      }
    } catch {
      // Fallback to localStorage below
    }
  }

  try {
    const raw = window.localStorage.getItem(`orbit:${area}:${key}`);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
    if (area === 'sync') {
      const fallbackRaw = window.localStorage.getItem(`orbit:local:${key}`);
      if (fallbackRaw !== null) {
        return JSON.parse(fallbackRaw) as T;
      }
    }
  } catch {
    // Ignore parse errors and return defaultValue
  }

  return defaultValue;
}

/**
 * Writes a key to chrome.storage.sync or chrome.storage.local with quota protection and fallback.
 */
export async function writeStorage<T>(
  key: string,
  value: T,
  area: 'local' | 'sync' = 'local'
): Promise<StorageResult<T>> {
  const byteSize = getByteLength(value);

  // If sync item exceeds per-item quota, transparently store in local storage
  const targetArea = area === 'sync' && byteSize > SYNC_MAX_ITEM_BYTES ? 'local' : area;

  if (isChromeStorageAvailable(targetArea)) {
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.storage[targetArea].set({ [key]: value }, () => {
          const err = chrome.runtime?.lastError;
          if (err) {
            reject(new Error(err.message));
          } else {
            resolve();
          }
        });
      });
      // Also mirror to localStorage for fast synchronous initial hydration
      try {
        window.localStorage.setItem(`orbit:${targetArea}:${key}`, JSON.stringify(value));
      } catch {
        // Ignore secondary mirror failure
      }
      return { ok: true, data: value };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Storage write failed';
      const isQuota = /quota/i.test(message);

      // If sync failed due to quota, retry on local
      if (targetArea === 'sync' && isChromeStorageAvailable('local')) {
        return writeStorage(key, value, 'local');
      }

      return {
        ok: false,
        error: isQuota
          ? 'Storage quota exceeded. Consider removing large custom images or exporting a backup.'
          : message,
        quotaExceeded: isQuota,
      };
    }
  }

  // Fallback to window.localStorage (Vite dev mode or tests)
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(`orbit:${targetArea}:${key}`, serialized);
    return { ok: true, data: value };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LocalStorage write failed';
    const isQuota =
      (err instanceof DOMException &&
        (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) ||
      /quota/i.test(message);

    return {
      ok: false,
      error: isQuota
        ? 'Browser storage quota exceeded. Please reduce custom image size or clear old items.'
        : message,
      quotaExceeded: isQuota,
    };
  }
}

export async function clearAllOrbitStorage(): Promise<void> {
  if (isChromeStorageAvailable('local')) {
    await new Promise<void>((resolve) => chrome.storage.local.clear(() => resolve()));
  }
  if (isChromeStorageAvailable('sync')) {
    await new Promise<void>((resolve) => chrome.storage.sync.clear(() => resolve()));
  }
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('orbit:')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Ignore errors
  }
}
