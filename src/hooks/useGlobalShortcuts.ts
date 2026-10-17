import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return false;
}

export function useGlobalShortcuts() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const closeAllOverlays = useUIStore((s) => s.closeAllOverlays);
  const openShortcutsHelp = useUIStore((s) => s.openShortcutsHelp);
  const focusSearchShortcut = useSettingsStore(
    (s) => s.settings.focusSearchShortcut
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl/Cmd + K always toggles Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // 2. Escape closes any open modal/drawer/palette
      if (e.key === 'Escape') {
        closeAllOverlays();
        return;
      }

      // Do not intercept single-key shortcuts when typing inside inputs/textareas
      if (isEditableElement(e.target)) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // 3. '/' focuses search
      if (e.key === (focusSearchShortcut || '/')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('orbit:focus-search'));
        return;
      }

      // 4. '?' opens keyboard shortcuts help
      if (e.key === '?') {
        e.preventDefault();
        openShortcutsHelp();
        return;
      }

      // 5. 'N' creates/focuses a note
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('orbit:new-note'));
        return;
      }

      // 6. 'T' focuses task creation input
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('orbit:new-task'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, closeAllOverlays, openShortcutsHelp, focusSearchShortcut]);
}
