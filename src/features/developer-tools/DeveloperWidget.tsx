import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Plus,
  Trash2,
  BookOpen,
  Braces,
  Link2,
  Binary,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useUIStore } from '@/stores/useUIStore';

const DOC_LINKS = [
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
  { name: 'TypeScript', url: 'https://www.typescriptlang.org/docs/' },
  { name: 'React Reference', url: 'https://react.dev/reference/react' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com/docs' },
  { name: 'Chrome Extensions', url: 'https://developer.chrome.com/docs/extensions/' },
  { name: 'Node.js Docs', url: 'https://nodejs.org/docs/latest/api/' },
];

function encodeUtf8Base64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function decodeUtf8Base64(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export const DeveloperWidget: React.FC = () => {
  const devSnippets = useDashboardStore((s) => s.devSnippets);
  const addDevSnippet = useDashboardStore((s) => s.addDevSnippet);
  const deleteDevSnippet = useDashboardStore((s) => s.deleteDevSnippet);
  const addToast = useUIStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<
    'snippets' | 'json' | 'encoding' | 'docs'
  >('snippets');

  // Snippets state
  const [filterCat, setFilterCat] = useState<'all' | 'git' | 'terminal' | 'snippet'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddingSnippet, setIsAddingSnippet] = useState(false);
  const [snipTitle, setSnipTitle] = useState('');
  const [snipCategory, setSnipCategory] = useState<'git' | 'terminal' | 'snippet'>('git');
  const [snipCode, setSnipCode] = useState('');

  // JSON tool state
  const [jsonInput, setJsonInput] = useState('{"project":"Orbit","version":1,"private":true}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // URL / Base64 tool state
  const [utilityInput, setUtilityInput] = useState('');
  const [utilityOutput, setUtilityOutput] = useState('');
  const [utilityError, setUtilityError] = useState<string | null>(null);

  const handleCopyText = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1400);
      }
      addToast({ title: 'Copied to clipboard', type: 'success' });
    } catch {
      addToast({ title: 'Copy failed', type: 'error' });
    }
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snipTitle.trim() || !snipCode.trim()) return;
    addDevSnippet({
      title: snipTitle.trim(),
      category: snipCategory,
      code: snipCode.trim(),
    });
    setSnipTitle('');
    setSnipCode('');
    setIsAddingSnippet(false);
  };

  const handleFormatJson = (minify = false) => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, minify ? 0 : 2));
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON syntax.');
    }
  };

  const runEncodingAction = (
    action: 'url-encode' | 'url-decode' | 'b64-encode' | 'b64-decode'
  ) => {
    setUtilityError(null);
    try {
      if (action === 'url-encode') {
        setUtilityOutput(encodeURIComponent(utilityInput));
      } else if (action === 'url-decode') {
        setUtilityOutput(decodeURIComponent(utilityInput));
      } else if (action === 'b64-encode') {
        setUtilityOutput(encodeUtf8Base64(utilityInput));
      } else if (action === 'b64-decode') {
        setUtilityOutput(decodeUtf8Base64(utilityInput));
      }
    } catch {
      setUtilityError('Input could not be decoded with the selected format.');
    }
  };

  const visibleSnippets = devSnippets.filter((s) =>
    filterCat === 'all' ? true : s.category === filterCat
  );

  return (
    <div className="space-y-3">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-orbit-secondary/80 p-1 rounded-orbit-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('snippets')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xs transition-colors ${
            activeTab === 'snippets'
              ? 'bg-orbit-accent text-slate-950 font-medium'
              : 'text-orbit-muted hover:text-orbit-text'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Snippets & CLI
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xs transition-colors ${
            activeTab === 'json'
              ? 'bg-orbit-accent text-slate-950 font-medium'
              : 'text-orbit-muted hover:text-orbit-text'
          }`}
        >
          <Braces className="w-3.5 h-3.5" />
          JSON Format
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('encoding')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xs transition-colors ${
            activeTab === 'encoding'
              ? 'bg-orbit-accent text-slate-950 font-medium'
              : 'text-orbit-muted hover:text-orbit-text'
          }`}
        >
          <Binary className="w-3.5 h-3.5" />
          URL / Base64
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xs transition-colors ${
            activeTab === 'docs'
              ? 'bg-orbit-accent text-slate-950 font-medium'
              : 'text-orbit-muted hover:text-orbit-text'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Docs
        </button>
      </div>

      {/* Tab 1: Snippets, Git & Terminal */}
      {activeTab === 'snippets' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[11px]">
              {(['all', 'git', 'terminal', 'snippet'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={`px-2 py-0.5 rounded-xs capitalize ${
                    filterCat === cat
                      ? 'bg-orbit-accent/20 text-orbit-accent font-medium'
                      : 'text-orbit-muted hover:text-orbit-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddingSnippet((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] text-orbit-accent hover:underline"
            >
              <Plus className="w-3 h-3" />
              Add Snippet
            </button>
          </div>

          {isAddingSnippet && (
            <form
              onSubmit={handleAddSnippet}
              className="p-2.5 rounded-orbit-sm bg-orbit-secondary/80 border border-orbit-border space-y-2"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={snipTitle}
                  onChange={(e) => setSnipTitle(e.target.value)}
                  placeholder="Title (e.g. Undo last commit)"
                  required
                  className="flex-1 px-2 py-1 text-xs rounded-xs bg-orbit-main border border-orbit-border text-orbit-text"
                />
                <select
                  value={snipCategory}
                  onChange={(e) =>
                    setSnipCategory(e.target.value as 'git' | 'terminal' | 'snippet')
                  }
                  className="px-2 py-1 text-xs rounded-xs bg-orbit-main border border-orbit-border text-orbit-muted"
                >
                  <option value="git">Git</option>
                  <option value="terminal">Terminal</option>
                  <option value="snippet">Code</option>
                </select>
              </div>
              <textarea
                value={snipCode}
                onChange={(e) => setSnipCode(e.target.value)}
                placeholder="Command or code snippet..."
                rows={2}
                required
                className="w-full px-2 py-1 text-xs font-mono rounded-xs bg-orbit-main border border-orbit-border text-orbit-text"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingSnippet(false)}
                  className="px-2 py-0.5 text-[11px] text-orbit-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-0.5 text-[11px] font-medium rounded-xs bg-orbit-accent text-slate-950"
                >
                  Save Snippet
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {visibleSnippets.map((item) => (
              <div
                key={item.id}
                className="group p-2 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1.5 py-0.2 text-[10px] uppercase font-mono rounded-xs bg-orbit-main text-orbit-accent">
                      {item.category}
                    </span>
                    <span className="text-xs font-medium text-orbit-text truncate">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleCopyText(item.code, item.id)}
                      title="Copy snippet"
                      aria-label={`Copy ${item.title}`}
                      className="p-1 text-orbit-muted hover:text-orbit-text"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDevSnippet(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="p-1 text-orbit-muted hover:text-rose-400 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <pre className="text-[11px] font-mono text-orbit-muted bg-orbit-main/80 px-2 py-1 rounded-xs overflow-x-auto">
                  {item.code}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Safe JSON Formatter */}
      {activeTab === 'json' && (
        <div className="space-y-2">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste JSON here..."
            aria-label="JSON Input"
            rows={5}
            className="w-full p-2 text-xs font-mono rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
          />
          {jsonError && (
            <p role="alert" className="text-[11px] text-rose-400">
              {jsonError}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleFormatJson(false)}
                className="px-2.5 py-1 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950"
              >
                Prettify
              </button>
              <button
                type="button"
                onClick={() => handleFormatJson(true)}
                className="px-2.5 py-1 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text"
              >
                Minify
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyText(jsonInput)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-orbit-muted hover:text-orbit-text"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: URL & Base64 Encoder/Decoder */}
      {activeTab === 'encoding' && (
        <div className="space-y-2">
          <textarea
            value={utilityInput}
            onChange={(e) => setUtilityInput(e.target.value)}
            placeholder="Enter text, URL, or Base64 payload..."
            aria-label="Encoding utility input"
            rows={3}
            className="w-full p-2 text-xs font-mono rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => runEncodingAction('url-encode')}
              className="px-2 py-1 text-[11px] rounded-xs bg-orbit-secondary border border-orbit-border text-orbit-text hover:border-orbit-accent"
            >
              URL Encode
            </button>
            <button
              type="button"
              onClick={() => runEncodingAction('url-decode')}
              className="px-2 py-1 text-[11px] rounded-xs bg-orbit-secondary border border-orbit-border text-orbit-text hover:border-orbit-accent"
            >
              URL Decode
            </button>
            <button
              type="button"
              onClick={() => runEncodingAction('b64-encode')}
              className="px-2 py-1 text-[11px] rounded-xs bg-orbit-secondary border border-orbit-border text-orbit-text hover:border-orbit-accent"
            >
              Base64 Encode
            </button>
            <button
              type="button"
              onClick={() => runEncodingAction('b64-decode')}
              className="px-2 py-1 text-[11px] rounded-xs bg-orbit-secondary border border-orbit-border text-orbit-text hover:border-orbit-accent"
            >
              Base64 Decode
            </button>
          </div>

          {utilityError && (
            <p role="alert" className="text-[11px] text-rose-400">
              {utilityError}
            </p>
          )}

          {utilityOutput && (
            <div className="relative p-2 rounded-orbit-sm bg-orbit-main border border-orbit-border">
              <pre className="text-xs font-mono text-orbit-accent-secondary break-all whitespace-pre-wrap pr-7">
                {utilityOutput}
              </pre>
              <button
                type="button"
                onClick={() => void handleCopyText(utilityOutput)}
                aria-label="Copy encoded output"
                className="absolute top-2 right-2 text-orbit-muted hover:text-orbit-text"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Quick Documentation Links */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-2 gap-1.5">
          {DOC_LINKS.map((doc) => (
            <a
              key={doc.url}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border hover:border-orbit-accent/40 text-xs text-orbit-text transition-colors"
            >
              <span className="truncate">{doc.name}</span>
              <Link2 className="w-3 h-3 text-orbit-muted shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
