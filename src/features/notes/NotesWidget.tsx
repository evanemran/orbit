import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Eye,
  Edit3,
  Search,
  Check,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useUIStore } from '@/stores/useUIStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatRelativeTime } from '@/lib/formatting/utils';

/**
 * Safe lightweight Markdown renderer using React elements (never uses dangerouslySetInnerHTML).
 */
const SafeMarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-orbit-text">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1 py-0.5 text-[11px] font-mono rounded-xs bg-orbit-main text-orbit-accent"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5 text-xs text-orbit-text leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;
        if (trimmed.startsWith('# ')) {
          return (
            <h3 key={i} className="text-sm font-semibold text-orbit-text pt-1">
              {renderInline(trimmed.slice(2))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h4 key={i} className="text-xs font-semibold text-orbit-accent pt-1">
              {renderInline(trimmed.slice(3))}
            </h4>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-orbit-accent">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

export const NotesWidget: React.FC = () => {
  const notes = useDashboardStore((s) => s.notes);
  const activeNoteId = useDashboardStore((s) => s.activeNoteId);
  const createNote = useDashboardStore((s) => s.createNote);
  const updateNote = useDashboardStore((s) => s.updateNote);
  const deleteNote = useDashboardStore((s) => s.deleteNote);
  const setActiveNote = useDashboardStore((s) => s.setActiveNote);
  const addToast = useUIStore((s) => s.addToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notePendingDelete, setNotePendingDelete] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNote =
    notes.find((n) => n.id === activeNoteId) || filteredNotes[0] || null;

  // Listen for global 'N' shortcut
  useEffect(() => {
    const handleNewNoteShortcut = () => {
      const created = createNote('Quick Note', '');
      setActiveNote(created.id);
      setPreviewMode(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    };
    window.addEventListener('orbit:new-note', handleNewNoteShortcut);
    return () => window.removeEventListener('orbit:new-note', handleNewNoteShortcut);
  }, [createNote, setActiveNote]);

  const handleContentChange = (value: string) => {
    if (!activeNote) return;
    setSaveStatus('saving');
    updateNote(activeNote.id, { content: value });
    setTimeout(() => setSaveStatus('saved'), 250);
  };

  const handleTitleChange = (value: string) => {
    if (!activeNote) return;
    setSaveStatus('saving');
    updateNote(activeNote.id, { title: value });
    setTimeout(() => setSaveStatus('saved'), 250);
  };

  const handleCopy = async () => {
    if (!activeNote) return;
    try {
      await navigator.clipboard.writeText(activeNote.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      addToast({ title: 'Note copied to clipboard', type: 'success' });
    } catch {
      addToast({ title: 'Could not copy note', type: 'error' });
    }
  };

  return (
    <div id="orbit-widget-notes" className="space-y-2.5">
      {/* Top Bar: Note Selector + Search + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3 h-3 text-orbit-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            aria-label="Search notes"
            className="w-full pl-7 pr-2 py-1 text-[11px] rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            const n = createNote('New Note', '');
            setActiveNote(n.id);
            setPreviewMode(false);
          }}
          aria-label="Create note"
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950 hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Note Tabs */}
      {filteredNotes.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {filteredNotes.map((note) => {
            const isCurrent = activeNote?.id === note.id;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => setActiveNote(note.id)}
                className={`px-2.5 py-1 text-[11px] rounded-orbit-sm truncate max-w-[130px] transition-colors ${
                  isCurrent
                    ? 'bg-orbit-accent/20 text-orbit-accent font-medium border border-orbit-accent/40'
                    : 'bg-orbit-secondary/60 text-orbit-muted hover:text-orbit-text'
                }`}
              >
                {note.title || 'Untitled'}
              </button>
            );
          })}
        </div>
      )}

      {/* Editor / Preview Area */}
      {activeNote ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              aria-label="Note title"
              placeholder="Note title..."
              className="flex-1 bg-transparent text-xs font-semibold text-orbit-text border-b border-transparent focus:border-orbit-accent focus:outline-none pb-0.5"
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewMode((p) => !p)}
                title={previewMode ? 'Edit Markdown' : 'Preview Markdown'}
                aria-label={previewMode ? 'Switch to editor' : 'Preview Markdown'}
                className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
              >
                {previewMode ? (
                  <Edit3 className="w-3.5 h-3.5 text-orbit-accent" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                title="Copy note content"
                aria-label="Copy note content"
                className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setNotePendingDelete(activeNote.id)}
                title="Delete note"
                aria-label="Delete note"
                className="p-1 text-orbit-muted hover:text-rose-400 rounded-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {previewMode ? (
            <div className="min-h-[135px] max-h-48 overflow-y-auto p-2.5 rounded-orbit-sm bg-orbit-secondary/60 border border-orbit-border">
              <SafeMarkdownPreview content={activeNote.content} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={activeNote.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write in Markdown... Autosaves locally."
              aria-label="Note content"
              rows={6}
              className="w-full p-2.5 text-xs rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border text-orbit-text placeholder:text-orbit-muted/60 focus:outline-none focus:border-orbit-accent resize-y font-sans leading-relaxed"
            />
          )}

          <div className="flex items-center justify-between text-[10px] text-orbit-muted">
            <span>
              {saveStatus === 'saving'
                ? 'Autosaving...'
                : `Saved • ${formatRelativeTime(activeNote.updatedAt)}`}
            </span>
            <span>{activeNote.content.length} chars</span>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-orbit-muted">
          No matching notes found.
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(notePendingDelete)}
        onClose={() => setNotePendingDelete(null)}
        onConfirm={() => {
          if (notePendingDelete) {
            deleteNote(notePendingDelete);
            setNotePendingDelete(null);
          }
        }}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete Note"
      />
    </div>
  );
};
