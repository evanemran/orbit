import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Globe,
  Bookmark,
  FileText,
  CheckSquare,
  Clock,
  X,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { buildSearchUrl, SEARCH_ENGINES } from '@/lib/search/searchEngines';
import { SearchEngineId } from '@/types';
import { validateAndNormalizeUrl } from '@/lib/validation/url';

interface SuggestionItem {
  id: string;
  type: 'web' | 'shortcut' | 'note' | 'task' | 'history';
  title: string;
  subtitle?: string;
  action: () => void;
}

export const UniversalSearch: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const shortcuts = useDashboardStore((s) => s.shortcuts);
  const notes = useDashboardStore((s) => s.notes);
  const tasks = useDashboardStore((s) => s.tasks);
  const searchHistory = useDashboardStore((s) => s.searchHistory);
  const addSearchHistory = useDashboardStore((s) => s.addSearchHistory);
  const clearSearchHistory = useDashboardStore((s) => s.clearSearchHistory);
  const recordShortcutLaunch = useDashboardStore((s) => s.recordShortcutLaunch);
  const setActiveNote = useDashboardStore((s) => s.setActiveNote);
  const toggleTask = useDashboardStore((s) => s.toggleTask);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEngineMenuOpen, setIsEngineMenuOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 100);
    return () => clearTimeout(timer);
  }, [query]);

  // Listen for global focus search event ('/')
  useEffect(() => {
    const handleFocusSearch = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
      setIsOpen(true);
    };
    window.addEventListener('orbit:focus-search', handleFocusSearch);
    return () => window.removeEventListener('orbit:focus-search', handleFocusSearch);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEngineMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToUrl = (url: string) => {
    const valid = validateAndNormalizeUrl(url);
    if (!valid.isValid) return;
    if (settings.tabOpenBehavior === 'new') {
      window.open(valid.normalizedUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(valid.normalizedUrl);
    }
  };

  const executeWebSearch = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    if (settings.enableSearchHistory) {
      addSearchHistory(trimmed);
    }
    const targetUrl = buildSearchUrl(
      trimmed,
      settings.defaultSearchEngine,
      settings.customSearchUrlTemplate
    );
    setIsOpen(false);
    navigateToUrl(targetUrl);
  };

  const suggestions = useMemo<SuggestionItem[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const list: SuggestionItem[] = [];

    if (!q) {
      if (settings.enableSearchHistory && searchHistory.length > 0) {
        searchHistory.slice(0, 5).forEach((hist, idx) => {
          list.push({
            id: `hist_${idx}`,
            type: 'history',
            title: hist,
            subtitle: `Search ${SEARCH_ENGINES[settings.defaultSearchEngine].name}`,
            action: () => {
              setQuery(hist);
              executeWebSearch(hist);
            },
          });
        });
      }
      return list;
    }

    // 1. Primary web search action
    list.push({
      id: 'web_primary',
      type: 'web',
      title: `Search ${SEARCH_ENGINES[settings.defaultSearchEngine].name} for "${debouncedQuery.trim()}"`,
      subtitle: 'Web Search',
      action: () => executeWebSearch(debouncedQuery),
    });

    if (!settings.enableSearchSuggestions) {
      return list;
    }

    // 2. Matching shortcuts
    shortcuts
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .forEach((sc) => {
        list.push({
          id: `sc_${sc.id}`,
          type: 'shortcut',
          title: sc.title,
          subtitle: sc.url,
          action: () => {
            recordShortcutLaunch(sc.id);
            setIsOpen(false);
            navigateToUrl(sc.url);
          },
        });
      });

    // 3. Matching notes
    notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach((note) => {
        list.push({
          id: `note_${note.id}`,
          type: 'note',
          title: note.title,
          subtitle: `Note • ${note.content.slice(0, 60).replace(/\n/g, ' ')}`,
          action: () => {
            setActiveNote(note.id);
            setIsOpen(false);
            const el = document.getElementById('orbit-widget-notes');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          },
        });
      });

    // 4. Matching tasks
    tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((task) => {
        list.push({
          id: `task_${task.id}`,
          type: 'task',
          title: task.title,
          subtitle: task.completed ? 'Completed Task (click to reopen)' : 'Active Task (click to complete)',
          action: () => {
            toggleTask(task.id);
            setIsOpen(false);
          },
        });
      });

    return list;
  }, [
    debouncedQuery,
    settings.enableSearchSuggestions,
    settings.enableSearchHistory,
    settings.defaultSearchEngine,
    searchHistory,
    shortcuts,
    notes,
    tasks,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length, debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && suggestions[selectedIndex]) {
        suggestions[selectedIndex].action();
      } else if (query.trim()) {
        executeWebSearch(query);
      }
    }
  };

  const currentEngine = SEARCH_ENGINES[settings.defaultSearchEngine] || SEARCH_ENGINES.google;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-30">
      <div className="flex items-center w-full rounded-orbit-lg orbit-glass shadow-orbit transition-all focus-within:border-orbit-accent/70 focus-within:ring-2 focus-within:ring-orbit-accent/20">
        {/* Search Engine Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsEngineMenuOpen((v) => !v)}
            aria-label={`Search engine: ${currentEngine.name}`}
            className="flex items-center gap-1.5 pl-4 pr-2.5 py-3 text-xs font-medium text-orbit-muted hover:text-orbit-text border-r border-orbit-border/60 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-orbit-accent" />
            <span className="hidden sm:inline">{currentEngine.name}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {isEngineMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-44 rounded-orbit orbit-elevated shadow-orbit py-1 z-40">
              {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((engId) => {
                const eng = SEARCH_ENGINES[engId];
                const active = settings.defaultSearchEngine === engId;
                return (
                  <button
                    key={engId}
                    type="button"
                    onClick={() => {
                      void updateSettings({ defaultSearchEngine: engId });
                      setIsEngineMenuOpen(false);
                      inputRef.current?.focus();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                      active
                        ? 'bg-orbit-accent/15 text-orbit-accent font-medium'
                        : 'text-orbit-muted hover:text-orbit-text hover:bg-orbit-secondary/60'
                    }`}
                  >
                    <span>{eng.name}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-orbit-accent" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-orbit-muted ml-3 pointer-events-none shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={currentEngine.placeholder}
            aria-label="Universal Search"
            className="w-full bg-transparent px-3 py-3 text-sm text-orbit-text placeholder:text-orbit-muted/70 focus:outline-none"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="p-1.5 mr-2 text-orbit-muted hover:text-orbit-text rounded-orbit-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="mr-3 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-orbit-muted bg-orbit-secondary/80 border border-orbit-border rounded-xs">
              {settings.focusSearchShortcut || '/'}
            </kbd>
          )}
        </div>
      </div>

      {/* Suggestions & History Popover */}
      {isOpen && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 mt-2 rounded-orbit-lg orbit-elevated shadow-orbit overflow-hidden border border-orbit-border py-1.5 z-40"
        >
          {!debouncedQuery.trim() && settings.enableSearchHistory && searchHistory.length > 0 && (
            <div className="flex items-center justify-between px-3.5 py-1 text-[11px] text-orbit-muted">
              <span>Recent Searches</span>
              <button
                type="button"
                onClick={clearSearchHistory}
                className="hover:text-orbit-text underline"
              >
                Clear
              </button>
            </div>
          )}

          {suggestions.map((item, index) => {
            const isSelected = index === selectedIndex;
            const ItemIcon =
              item.type === 'shortcut'
                ? Bookmark
                : item.type === 'note'
                ? FileText
                : item.type === 'task'
                ? CheckSquare
                : item.type === 'history'
                ? Clock
                : Globe;

            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => item.action()}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors ${
                  isSelected
                    ? 'bg-orbit-accent/15 text-orbit-text'
                    : 'text-orbit-muted hover:bg-orbit-secondary/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ItemIcon className="w-4 h-4 shrink-0 text-orbit-accent" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-orbit-text truncate">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-orbit-muted truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
