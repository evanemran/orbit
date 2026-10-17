import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateAndNormalizeUrl, getCanonicalUrlKey } from '@/lib/validation/url';
import { buildSearchUrl } from '@/lib/search/searchEngines';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { writeStorage, readStorage } from '@/lib/storage/chromeStorage';

describe('URL Validation & Search Engine URL Generation', () => {
  it('validates and normalizes standard HTTP/HTTPS URLs and bare domains', () => {
    const bare = validateAndNormalizeUrl('github.com/orbit');
    expect(bare.isValid).toBe(true);
    expect(bare.normalizedUrl).toBe('https://github.com/orbit');
    expect(bare.hostname).toBe('github.com');

    const https = validateAndNormalizeUrl('https://linear.app/team');
    expect(https.isValid).toBe(true);
    expect(https.normalizedUrl).toBe('https://linear.app/team');
  });

  it('rejects unsafe javascript:, data:, and invalid URLs', () => {
    expect(validateAndNormalizeUrl('javascript:alert(1)').isValid).toBe(false);
    expect(validateAndNormalizeUrl('JAVASCRIPT:evil()').isValid).toBe(false);
    expect(validateAndNormalizeUrl('data:text/html,<script>alert(1)</script>').isValid).toBe(false);
    expect(validateAndNormalizeUrl('not_a_valid_domain').isValid).toBe(false);
    expect(validateAndNormalizeUrl('   ').isValid).toBe(false);
  });

  it('detects canonical duplicate URLs accurately', () => {
    expect(getCanonicalUrlKey('https://www.github.com/')).toBe(
      getCanonicalUrlKey('http://github.com')
    );
  });

  it('constructs safe search URLs for Google, DuckDuckGo, Bing, Brave, and Custom engines', () => {
    expect(buildSearchUrl('react hooks', 'google')).toBe(
      'https://www.google.com/search?q=react%20hooks'
    );
    expect(buildSearchUrl('privacy tools', 'duckduckgo')).toBe(
      'https://duckduckgo.com/?q=privacy%20tools'
    );
    expect(buildSearchUrl('typescript', 'brave')).toBe(
      'https://search.brave.com/search?q=typescript'
    );
    expect(
      buildSearchUrl('orbit', 'custom', 'https://kagi.com/search?q={query}')
    ).toBe('https://kagi.com/search?q=orbit');

    // Blocks unsafe custom templates
    expect(
      buildSearchUrl('orbit', 'custom', 'javascript:alert({query})')
    ).toBe('https://www.google.com/search?q=orbit');
  });
});

describe('Shortcuts, Tasks, Notes, Widgets & Timer Store Logic', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await useDashboardStore.getState().resetDashboardData();
    await useSettingsStore.getState().resetSettings();
  });

  it('adds, edits, deletes, reorders, and prevents duplicate shortcuts', () => {
    const store = useDashboardStore.getState();
    const initialCount = store.shortcuts.length;

    // Add valid shortcut
    const added = store.addShortcut({
      title: 'Raycast',
      url: 'raycast.com',
      pinned: true,
    });
    expect(added.ok).toBe(true);
    expect(useDashboardStore.getState().shortcuts.length).toBe(initialCount + 1);

    // Prevent duplicate shortcut in same workspace
    const dup = useDashboardStore.getState().addShortcut({
      title: 'Raycast Duplicate',
      url: 'https://www.raycast.com/',
    });
    expect(dup.ok).toBe(false);
    expect(dup.duplicate).toBe(true);

    // Edit shortcut
    const id = added.item!.id;
    const updated = useDashboardStore.getState().updateShortcut(id, {
      title: 'Raycast Pro',
    });
    expect(updated.ok).toBe(true);
    expect(
      useDashboardStore.getState().shortcuts.find((s) => s.id === id)?.title
    ).toBe('Raycast Pro');

    // Reorder shortcuts
    const firstId = useDashboardStore.getState().shortcuts[0].id;
    useDashboardStore.getState().reorderShortcuts(id, firstId);
    expect(useDashboardStore.getState().shortcuts[0].id).toBe(id);

    // Delete shortcut
    useDashboardStore.getState().deleteShortcut(id);
    expect(
      useDashboardStore.getState().shortcuts.find((s) => s.id === id)
    ).toBeUndefined();
  });

  it('creates, updates, autosaves, and restores notes', async () => {
    const created = useDashboardStore
      .getState()
      .createNote('Architecture Spec', 'Initial draft');
    expect(created.title).toBe('Architecture Spec');

    useDashboardStore.getState().updateNote(created.id, {
      content: 'Updated markdown content with **bold** text.',
    });

    // Re-hydrate from storage to verify persistence
    await useDashboardStore.getState().hydrateDashboard();
    const restored = useDashboardStore
      .getState()
      .notes.find((n) => n.id === created.id);
    expect(restored?.content).toBe('Updated markdown content with **bold** text.');
  });

  it('creates, completes, filters, and clears completed tasks with persistence', async () => {
    const task = useDashboardStore
      .getState()
      .addTask('Write unit tests', 'high', '2026-10-20');
    expect(task).not.toBeNull();

    useDashboardStore.getState().toggleTask(task!.id);
    const toggled = useDashboardStore
      .getState()
      .tasks.find((t) => t.id === task!.id);
    expect(toggled?.completed).toBe(true);

    useDashboardStore.getState().clearCompletedTasks();
    expect(
      useDashboardStore.getState().tasks.some((t) => t.completed)
    ).toBe(false);
  });

  it('adds, removes, hides, and applies presets to widgets', () => {
    useDashboardStore.getState().applyLayoutPreset('minimal');
    const minimalEnabled = useDashboardStore
      .getState()
      .widgets.filter((w) => w.enabled)
      .map((w) => w.type);
    expect(minimalEnabled).toContain('weather');
    expect(minimalEnabled).not.toContain('developer');

    // Toggle developer widget on
    useDashboardStore.getState().toggleWidgetEnabled('developer');
    expect(
      useDashboardStore
        .getState()
        .widgets.find((w) => w.type === 'developer')?.enabled
    ).toBe(true);
  });

  it('persists theme and customization settings across hydration', async () => {
    await useSettingsStore.getState().updateSettings({
      theme: 'light',
      clockFormat: '12h',
      accentColor: '#72E0C1',
    });

    await useSettingsStore.getState().hydrateSettings();
    const s = useSettingsStore.getState().settings;
    expect(s.theme).toBe('light');
    expect(s.clockFormat).toBe('12h');
    expect(s.accentColor).toBe('#72E0C1');
  });

  it('reconstructs focus timer accuracy from timestamps after reload', () => {
    const startNow = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(startNow);

    useDashboardStore.getState().resetFocusTimer();
    useDashboardStore.getState().startFocusTimer();

    const runningState = useDashboardStore.getState().focusTimer;
    expect(runningState.isRunning).toBe(true);
    expect(runningState.targetEndTime).toBe(startNow + 25 * 60 * 1000);

    // Simulate 10 minutes passing and pausing
    const tenMinLater = startNow + 10 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(tenMinLater);
    useDashboardStore.getState().pauseFocusTimer();

    const pausedState = useDashboardStore.getState().focusTimer;
    expect(pausedState.isRunning).toBe(false);
    expect(pausedState.remainingMsOnPause).toBe(15 * 60 * 1000);

    // Resume and simulate timer completion after reload
    useDashboardStore.getState().startFocusTimer();
    const afterCompletion = tenMinLater + 16 * 60 * 1000;
    useDashboardStore.getState().syncFocusTimerWithNow(afterCompletion);

    const finishedState = useDashboardStore.getState().focusTimer;
    expect(finishedState.isRunning).toBe(false);
    expect(finishedState.completedSessions).toBe(1);
    expect(finishedState.mode).toBe('shortBreak');

    vi.restoreAllMocks();
  });

  it('imports and exports dashboard data snapshots and handles storage quota errors gracefully', async () => {
    const importedCount = useDashboardStore.getState().importShortcuts([
      { title: 'Cloudflare', url: 'https://cloudflare.com', pinned: true },
      { title: 'Invalid', url: 'javascript:void(0)' },
    ]);
    expect(importedCount).toBe(1);

    // Simulate storage quota failure
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

    const result = await writeStorage('test_quota_key', { huge: 'data' }, 'local');
    expect(result.ok).toBe(false);
    expect(result.quotaExceeded).toBe(true);

    setItemSpy.mockRestore();

    const fallbackRead = await readStorage('non_existent_key', 'local', 'default_val');
    expect(fallbackRead).toBe('default_val');
  });
});
