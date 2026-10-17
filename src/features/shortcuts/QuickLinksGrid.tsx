import React, { useState, useRef } from 'react';
import {
  Plus,
  Pin,
  Edit2,
  Trash2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Download,
  Upload,
  BookmarkPlus,
  Compass,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { getFaviconUrl, validateAndNormalizeUrl } from '@/lib/validation/url';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';

const ACCENT_SWATCHES = [
  '#8B9CFF',
  '#72E0C1',
  '#38BDF8',
  '#F59E0B',
  '#EC4899',
  '#A855F7',
  '#EF4444',
  '#10B981',
];

export const QuickLinksGrid: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);
  const shortcuts = useDashboardStore((s) => s.shortcuts);
  const activeWorkspaceId = useDashboardStore((s) => s.activeWorkspaceId);
  const addShortcut = useDashboardStore((s) => s.addShortcut);
  const updateShortcut = useDashboardStore((s) => s.updateShortcut);
  const deleteShortcut = useDashboardStore((s) => s.deleteShortcut);
  const reorderShortcuts = useDashboardStore((s) => s.reorderShortcuts);
  const moveShortcutByOffset = useDashboardStore((s) => s.moveShortcutByOffset);
  const recordShortcutLaunch = useDashboardStore((s) => s.recordShortcutLaunch);
  const importShortcuts = useDashboardStore((s) => s.importShortcuts);

  const shortcutModalState = useUIStore((s) => s.shortcutModalState);
  const openShortcutModal = useUIStore((s) => s.openShortcutModal);
  const closeShortcutModal = useUIStore((s) => s.closeShortcutModal);
  const addToast = useUIStore((s) => s.addToast);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#8B9CFF');
  const [customIcon, setCustomIcon] = useState('');
  const [pinned, setPinned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const workspaceShortcuts = shortcuts
    .filter((s) => s.workspaceId === activeWorkspaceId)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order);

  const handleOpenAdd = () => {
    setTitle('');
    setUrl('');
    setAccentColor('#8B9CFF');
    setCustomIcon('');
    setPinned(false);
    setFormError(null);
    openShortcutModal(null);
  };

  const handleOpenEdit = (id: string) => {
    const item = shortcuts.find((s) => s.id === id);
    if (!item) return;
    setTitle(item.title);
    setUrl(item.url);
    setAccentColor(item.accentColor || '#8B9CFF');
    setCustomIcon(item.customIcon || '');
    setPinned(item.pinned);
    setFormError(null);
    openShortcutModal(id);
  };

  const handleSaveShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (shortcutModalState.editingShortcutId) {
      const res = updateShortcut(shortcutModalState.editingShortcutId, {
        title: title.trim(),
        url,
        accentColor,
        customIcon: customIcon.trim() || undefined,
        pinned,
      });
      if (!res.ok) {
        setFormError(res.error || 'Could not update shortcut.');
        return;
      }
      addToast({ title: 'Shortcut updated', type: 'success' });
      closeShortcutModal();
    } else {
      const res = addShortcut({
        title,
        url,
        accentColor,
        customIcon,
        pinned,
      });
      if (!res.ok) {
        setFormError(res.error || 'Could not add shortcut.');
        return;
      }
      addToast({ title: `Added "${res.item?.title}"`, type: 'success' });
      closeShortcutModal();
    }
  };

  const handleLaunchShortcut = (id: string, targetUrl: string, forceNewTab = false) => {
    const valid = validateAndNormalizeUrl(targetUrl);
    if (!valid.isValid) return;
    recordShortcutLaunch(id);
    if (forceNewTab || settings.tabOpenBehavior === 'new') {
      window.open(valid.normalizedUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(valid.normalizedUrl);
    }
  };

  const handleExportShortcuts = () => {
    const payload = JSON.stringify(workspaceShortcuts, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `orbit-shortcuts-${activeWorkspaceId}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
    addToast({ title: 'Shortcuts exported', type: 'success' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          addToast({
            title: 'Invalid shortcut file',
            description: 'Expected a JSON array of shortcuts.',
            type: 'error',
          });
          return;
        }
        const count = importShortcuts(parsed);
        addToast({
          title: `Imported ${count} shortcut${count === 1 ? '' : 's'}`,
          type: 'success',
        });
      } catch {
        addToast({
          title: 'Import failed',
          description: 'Could not parse JSON file.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportChromeBookmarks = async () => {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      addToast({
        title: 'Chrome Bookmarks API unavailable',
        description: 'Load Orbit as a Chrome Extension to import browser bookmarks.',
        type: 'info',
      });
      return;
    }

    try {
      const granted = await new Promise<boolean>((resolve) => {
        chrome.permissions.request({ permissions: ['bookmarks'] }, (res) =>
          resolve(Boolean(res))
        );
      });

      if (!granted || !chrome.bookmarks) {
        addToast({
          title: 'Permission declined',
          description: 'Bookmark permission is required to import Chrome bookmarks.',
          type: 'info',
        });
        return;
      }

      const tree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) =>
        chrome.bookmarks.getTree((nodes) => resolve(nodes))
      );

      const collected: Array<{ title: string; url: string }> = [];
      const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
        for (const n of nodes) {
          if (n.url && (n.url.startsWith('http://') || n.url.startsWith('https://'))) {
            collected.push({ title: n.title || n.url, url: n.url });
          }
          if (n.children && collected.length < 24) {
            walk(n.children);
          }
        }
      };
      walk(tree);

      const importedCount = importShortcuts(collected.slice(0, 18));
      addToast({
        title: `Imported ${importedCount} Chrome bookmark${importedCount === 1 ? '' : 's'}`,
        type: 'success',
      });
    } catch {
      addToast({
        title: 'Could not read Chrome bookmarks',
        type: 'error',
      });
    }
  };

  if (!settings.showQuickLinks) return null;

  const colsMap: Record<number, string> = {
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
    7: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7',
    8: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-8',
  };
  const gridColsClass = colsMap[settings.quickLinksColumns] || colsMap[6];

  return (
    <section aria-label="Quick Links" className="w-full max-w-5xl mx-auto space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium uppercase tracking-wider text-orbit-muted">
          Quick Links
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleImportChromeBookmarks}
            title="Import from Chrome Bookmarks"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-orbit-muted hover:text-orbit-text rounded-orbit-sm hover:bg-orbit-secondary/60 transition-colors"
          >
            <BookmarkPlus className="w-3 h-3" />
            <span className="hidden sm:inline">Chrome Bookmarks</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import shortcuts JSON"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-orbit-muted hover:text-orbit-text rounded-orbit-sm hover:bg-orbit-secondary/60 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportShortcuts}
            title="Export shortcuts JSON"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-orbit-muted hover:text-orbit-text rounded-orbit-sm hover:bg-orbit-secondary/60 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orbit-accent bg-orbit-accent/10 hover:bg-orbit-accent/20 rounded-orbit-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>
      </div>

      {workspaceShortcuts.length === 0 ? (
        <div className="rounded-orbit-lg orbit-glass p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-orbit-accent/15 text-orbit-accent flex items-center justify-center mx-auto">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-orbit-text">
              Your quick-links orbit is empty
            </p>
            <p className="text-xs text-orbit-muted mt-0.5">
              Pin your daily destinations for instant one-click access.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Shortcut
          </button>
        </div>
      ) : (
        <div className={`grid ${gridColsClass} gap-2.5`}>
          {workspaceShortcuts.map((item) => {
            const favicon = getFaviconUrl(item.url);
            const monogram = item.customIcon || item.title.trim().charAt(0).toUpperCase() || '•';

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId && draggedId !== item.id) {
                    reorderShortcuts(draggedId, item.id);
                  }
                  setDraggedId(null);
                }}
                className="group relative rounded-orbit orbit-glass p-3 flex flex-col items-center justify-center gap-2 hover:border-orbit-accent/50 transition-all cursor-pointer select-none"
                onClick={() => handleLaunchShortcut(item.id, item.url, false)}
              >
                {/* Pin indicator */}
                {item.pinned && (
                  <span
                    title="Pinned shortcut"
                    className="absolute top-2 left-2 text-orbit-accent opacity-80"
                  >
                    <Pin className="w-3 h-3 fill-current" />
                  </span>
                )}

                {/* Hover Quick Controls */}
                <div
                  className="absolute top-1.5 right-1.5 hidden group-hover:flex focus-within:flex items-center gap-0.5 bg-orbit-elevated/95 border border-orbit-border rounded-orbit-sm px-1 py-0.5 shadow-orbit-sm z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => moveShortcutByOffset(item.id, -1)}
                    title="Move left"
                    aria-label={`Move ${item.title} left`}
                    className="p-0.5 text-orbit-muted hover:text-orbit-text"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveShortcutByOffset(item.id, 1)}
                    title="Move right"
                    aria-label={`Move ${item.title} right`}
                    className="p-0.5 text-orbit-muted hover:text-orbit-text"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchShortcut(item.id, item.url, true)}
                    title="Open in new tab"
                    aria-label={`Open ${item.title} in new tab`}
                    className="p-0.5 text-orbit-muted hover:text-orbit-text"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item.id)}
                    title="Edit shortcut"
                    aria-label={`Edit ${item.title}`}
                    className="p-0.5 text-orbit-muted hover:text-orbit-text"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteShortcut(item.id)}
                    title="Delete shortcut"
                    aria-label={`Delete ${item.title}`}
                    className="p-0.5 text-orbit-muted hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Icon / Favicon */}
                <div
                  className="w-9 h-9 rounded-orbit-sm flex items-center justify-center text-sm font-semibold overflow-hidden border border-white/10"
                  style={{
                    backgroundColor: `${item.accentColor || '#8B9CFF'}22`,
                    color: item.accentColor || '#8B9CFF',
                  }}
                >
                  {item.customIcon ? (
                    <span>{item.customIcon.slice(0, 2)}</span>
                  ) : favicon ? (
                    <img
                      src={favicon}
                      alt=""
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{monogram}</span>
                  )}
                </div>

                <span className="text-xs font-medium text-orbit-text truncate max-w-full">
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Shortcut Modal */}
      <Modal
        isOpen={shortcutModalState.isOpen}
        onClose={closeShortcutModal}
        title={shortcutModalState.editingShortcutId ? 'Edit Shortcut' : 'Add Quick Link'}
        subtitle="Add a favorite destination to your current workspace"
      >
        <form onSubmit={handleSaveShortcut} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="p-2.5 rounded-orbit-sm bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="shortcut-title-input"
              className="block text-xs font-medium text-orbit-text mb-1"
            >
              Title
            </label>
            <input
              id="shortcut-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GitHub"
              required
              className="w-full px-3 py-2 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
            />
          </div>

          <div>
            <label
              htmlFor="shortcut-url-input"
              className="block text-xs font-medium text-orbit-text mb-1"
            >
              URL
            </label>
            <input
              id="shortcut-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com"
              required
              className="w-full px-3 py-2 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="shortcut-icon-input"
                className="block text-xs font-medium text-orbit-text mb-1"
              >
                Custom Monogram / Emoji (optional)
              </label>
              <input
                id="shortcut-icon-input"
                type="text"
                maxLength={2}
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                placeholder="GH"
                className="w-full px-3 py-2 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-orbit-text mb-1">
                Accent Color
              </span>
              <div className="flex items-center gap-1.5 pt-1">
                {ACCENT_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setAccentColor(swatch)}
                    aria-label={`Select color ${swatch}`}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      accentColor === swatch ? 'scale-125 ring-2 ring-white' : 'opacity-75'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Switch
            id="shortcut-pin-switch"
            checked={pinned}
            onChange={setPinned}
            label="Pin shortcut"
            description="Pinned shortcuts appear first and in the Favorites widget."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeShortcutModal}
              className="px-3.5 py-2 text-xs font-medium rounded-orbit-sm border border-orbit-border text-orbit-muted hover:text-orbit-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950 hover:opacity-90"
            >
              {shortcutModalState.editingShortcutId ? 'Save Changes' : 'Add Shortcut'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
