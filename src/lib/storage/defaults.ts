import {
  DevSnippetItem,
  FocusTimerState,
  InspirationQuote,
  LayoutPresetId,
  NoteItem,
  OrbitSettings,
  QuickCommandItem,
  ShortcutItem,
  TaskItem,
  WeatherConfig,
  WidgetInstance,
  WidgetType,
  Workspace,
} from '@/types';

export const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'ws_personal', name: 'Personal', icon: 'Compass', accentColor: '#8B9CFF' },
  { id: 'ws_work', name: 'Work', icon: 'Briefcase', accentColor: '#72E0C1' },
  { id: 'ws_dev', name: 'Engineering', icon: 'Terminal', accentColor: '#F59E0B' },
];

export const DEFAULT_SETTINGS: OrbitSettings = {
  theme: 'dark',
  accentColor: '#8B9CFF',
  secondaryAccentColor: '#72E0C1',
  backgroundType: 'gradient',
  backgroundValue: 'orbit-nebula',
  backgroundBlur: 12,
  backgroundOverlay: 30,
  backgroundBrightness: 100,
  cardTransparency: 82,
  borderRadius: 'default',
  fontSize: 'md',
  density: 'comfortable',
  reducedMotion: false,

  userName: '',
  showGreeting: true,
  showClock: true,
  showDate: true,
  showSeconds: false,
  searchBarPlacement: 'center',
  quickLinksColumns: 6,
  showQuickLinks: true,
  widgetColumns: 3,
  activePreset: 'productivity',

  defaultSearchEngine: 'google',
  customSearchUrlTemplate: 'https://www.google.com/search?q={query}',
  enableSearchSuggestions: true,
  enableSearchHistory: true,
  focusSearchShortcut: '/',

  tabOpenBehavior: 'current',
  clockFormat: '24h',
  weekStartDay: 'monday',
  temperatureUnit: 'celsius',
  timezone: 'local',
  onboardingCompleted: false,
};

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  {
    id: 'sc_github',
    title: 'GitHub',
    url: 'https://github.com',
    accentColor: '#8B9CFF',
    pinned: true,
    workspaceId: 'ws_personal',
    order: 0,
    createdAt: 1700000000000,
    launchCount: 4,
    lastUsedAt: 1700000100000,
  },
  {
    id: 'sc_linear',
    title: 'Linear',
    url: 'https://linear.app',
    accentColor: '#6366F1',
    pinned: true,
    workspaceId: 'ws_personal',
    order: 1,
    createdAt: 1700000001000,
    launchCount: 3,
    lastUsedAt: 1700000090000,
  },
  {
    id: 'sc_vercel',
    title: 'Vercel',
    url: 'https://vercel.com',
    accentColor: '#72E0C1',
    pinned: true,
    workspaceId: 'ws_personal',
    order: 2,
    createdAt: 1700000002000,
    launchCount: 2,
    lastUsedAt: 1700000080000,
  },
  {
    id: 'sc_mdn',
    title: 'MDN Docs',
    url: 'https://developer.mozilla.org',
    accentColor: '#38BDF8',
    pinned: false,
    workspaceId: 'ws_personal',
    order: 3,
    createdAt: 1700000003000,
    launchCount: 1,
  },
  {
    id: 'sc_hn',
    title: 'Hacker News',
    url: 'https://news.ycombinator.com',
    accentColor: '#F97316',
    pinned: false,
    workspaceId: 'ws_personal',
    order: 4,
    createdAt: 1700000004000,
    launchCount: 2,
  },
  {
    id: 'sc_figma',
    title: 'Figma',
    url: 'https://figma.com',
    accentColor: '#EC4899',
    pinned: false,
    workspaceId: 'ws_personal',
    order: 5,
    createdAt: 1700000005000,
    launchCount: 1,
  },
];

export const WIDGET_CATALOG: Array<{
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: 'sm' | 'md' | 'lg';
  icon: string;
}> = [
  {
    type: 'weather',
    title: 'Weather',
    description: 'Live conditions, temperature, and 3-day forecast for your city.',
    defaultSize: 'sm',
    icon: 'CloudSun',
  },
  {
    type: 'tasks',
    title: 'Tasks',
    description: 'Actionable to-do list with priorities, due dates, and filters.',
    defaultSize: 'md',
    icon: 'CheckSquare',
  },
  {
    type: 'notes',
    title: 'Notes',
    description: 'Markdown-ready scratchpad with instant autosave and multi-note support.',
    defaultSize: 'md',
    icon: 'FileText',
  },
  {
    type: 'focus',
    title: 'Focus Timer',
    description: 'Timestamp-accurate Pomodoro sessions with custom focus and break intervals.',
    defaultSize: 'sm',
    icon: 'Timer',
  },
  {
    type: 'bookmarks',
    title: 'Favorites',
    description: 'Curated view of pinned Orbit shortcuts in compact or expanded mode.',
    defaultSize: 'sm',
    icon: 'Bookmark',
  },
  {
    type: 'quick-commands',
    title: 'Quick Commands',
    description: 'One-click launcher for common workflows, URLs, and dashboard actions.',
    defaultSize: 'sm',
    icon: 'Zap',
  },
  {
    type: 'developer',
    title: 'Developer Hub',
    description: 'Code snippets, Git/CLI commands, JSON formatter, URL & Base64 utilities.',
    defaultSize: 'lg',
    icon: 'Code2',
  },
  {
    type: 'inspiration',
    title: 'Daily Inspiration',
    description: 'Thoughtful quotes or your own custom daily focus mantra.',
    defaultSize: 'sm',
    icon: 'Sparkles',
  },
  {
    type: 'recent-shortcuts',
    title: 'Recent Launches',
    description: 'Quickly reopen shortcuts recently launched from your Orbit dashboard.',
    defaultSize: 'sm',
    icon: 'History',
  },
];

export function buildPresetWidgets(preset: LayoutPresetId): WidgetInstance[] {
  const activeTypesByPreset: Record<LayoutPresetId, WidgetType[]> = {
    minimal: ['weather', 'tasks', 'inspiration'],
    productivity: ['tasks', 'notes', 'focus', 'weather', 'quick-commands', 'bookmarks'],
    developer: ['developer', 'tasks', 'notes', 'quick-commands', 'focus', 'recent-shortcuts'],
    personal: [
      'weather',
      'tasks',
      'notes',
      'bookmarks',
      'focus',
      'inspiration',
      'recent-shortcuts',
      'quick-commands',
    ],
  };

  const enabledTypes = new Set(activeTypesByPreset[preset]);

  return WIDGET_CATALOG.map((meta, index) => ({
    id: `widget_${meta.type}`,
    type: meta.type,
    title: meta.title,
    enabled: enabledTypes.has(meta.type),
    hidden: false,
    size: meta.defaultSize,
    order: index,
  }));
}

export const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task_1',
    title: 'Customize Orbit dashboard theme and quick links',
    completed: false,
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    workspaceId: 'ws_personal',
    createdAt: 1700000000000,
  },
  {
    id: 'task_2',
    title: 'Press Ctrl+K (or Cmd+K) to explore the Command Palette',
    completed: false,
    priority: 'medium',
    workspaceId: 'ws_personal',
    createdAt: 1700000005000,
  },
  {
    id: 'task_3',
    title: 'Start a 25-minute deep work session',
    completed: true,
    priority: 'low',
    workspaceId: 'ws_personal',
    createdAt: 1700000010000,
    completedAt: 1700000090000,
  },
];

export const DEFAULT_NOTES: NoteItem[] = [
  {
    id: 'note_welcome',
    title: 'Welcome to Orbit',
    content: `# Orbit Scratchpad\n\nKeep quick thoughts, meeting notes, and links right on your New Tab.\n\n- Supports **Markdown** preview\n- Autosaves locally as you type\n- Press \`N\` anytime to create a note`,
    workspaceId: 'ws_personal',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    pinned: true,
  },
  {
    id: 'note_ideas',
    title: 'Weekly Focus Goals',
    content: `## Priorities\n1. Ship clean, well-tested code\n2. Keep inbox at zero\n3. Review architecture docs`,
    workspaceId: 'ws_personal',
    createdAt: 1700000050000,
    updatedAt: 1700000050000,
  },
];

export const DEFAULT_FOCUS_TIMER: FocusTimerState = {
  mode: 'focus',
  isRunning: false,
  targetEndTime: null,
  remainingMsOnPause: 25 * 60 * 1000,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  completedSessions: 0,
};

export const DEFAULT_QUICK_COMMANDS: QuickCommandItem[] = [
  {
    id: 'cmd_gh',
    label: 'Open GitHub Issues',
    category: 'developer',
    actionType: 'open-url',
    payload: 'https://github.com/issues',
    shortcutHint: 'G I',
  },
  {
    id: 'cmd_gmail',
    label: 'Open Gmail Inbox',
    category: 'navigation',
    actionType: 'open-url',
    payload: 'https://mail.google.com',
    shortcutHint: 'G M',
  },
  {
    id: 'cmd_focus',
    label: 'Start 25m Focus Timer',
    category: 'action',
    actionType: 'start-focus',
    shortcutHint: 'F S',
  },
  {
    id: 'cmd_theme',
    label: 'Toggle Dark / Light Theme',
    category: 'action',
    actionType: 'toggle-theme',
    shortcutHint: 'T M',
  },
  {
    id: 'cmd_note',
    label: 'Create Quick Note',
    category: 'action',
    actionType: 'new-note',
    shortcutHint: 'N',
  },
];

export const DEFAULT_DEV_SNIPPETS: DevSnippetItem[] = [
  {
    id: 'dev_git_amend',
    title: 'Amend last commit without changing message',
    category: 'git',
    code: 'git commit --amend --no-edit',
  },
  {
    id: 'dev_git_branch',
    title: 'Create and switch to new branch',
    category: 'git',
    code: 'git checkout -b feat/new-orbit-feature',
  },
  {
    id: 'dev_git_stash',
    title: 'Stash untracked files with message',
    category: 'git',
    code: 'git stash push -u -m "wip: save changes"',
  },
  {
    id: 'dev_cli_port',
    title: 'Find process listening on port 3000',
    category: 'terminal',
    code: 'npx kill-port 3000',
  },
  {
    id: 'dev_cli_docker',
    title: 'Remove stopped Docker containers & unused networks',
    category: 'terminal',
    code: 'docker system prune -f',
  },
  {
    id: 'dev_snip_fetch',
    title: 'Async JSON fetch with AbortController timeout',
    category: 'snippet',
    code: `const controller = new AbortController();\nconst id = setTimeout(() => controller.abort(), 5000);\nconst res = await fetch(url, { signal: controller.signal });\nclearTimeout(id);`,
  },
];

export const DEFAULT_WEATHER_CONFIG: WeatherConfig = {
  city: 'San Francisco',
  latitude: 37.7749,
  longitude: -122.4194,
  useGeolocation: false,
  provider: 'open-meteo',
};

export const DEFAULT_QUOTES: InspirationQuote[] = [
  {
    id: 'q_1',
    text: 'Simplicity is about subtracting the obvious and adding the meaningful.',
    author: 'John Maeda',
  },
  {
    id: 'q_2',
    text: 'Details matter, it’s worth waiting to get it right.',
    author: 'Steve Jobs',
  },
  {
    id: 'q_3',
    text: 'First, solve the problem. Then, write the code.',
    author: 'John Johnson',
  },
  {
    id: 'q_4',
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
  },
  {
    id: 'q_5',
    text: 'Focus is a matter of deciding what things you’re not going to do.',
    author: 'John Carmack',
  },
  {
    id: 'q_6',
    text: 'Make it work, make it right, make it fast.',
    author: 'Kent Beck',
  },
];

export const BACKGROUND_PRESETS = {
  solid: [
    { id: '#0B0D12', name: 'Deep Obsidian', value: '#0B0D12' },
    { id: '#0F172A', name: 'Midnight Slate', value: '#0F172A' },
    { id: '#111827', name: 'Carbon Charcoal', value: '#111827' },
    { id: '#18181B', name: 'Monolith Zinc', value: '#18181B' },
  ],
  gradient: [
    {
      id: 'orbit-nebula',
      name: 'Orbit Nebula',
      css: 'radial-gradient(circle at 20% 15%, rgba(139, 156, 255, 0.16) 0%, transparent 45%), radial-gradient(circle at 80% 25%, rgba(114, 224, 193, 0.12) 0%, transparent 50%), linear-gradient(180deg, #0B0D12 0%, #11141B 100%)',
    },
    {
      id: 'linear-midnight',
      name: 'Cosmic Indigo',
      css: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.22), transparent 60%), linear-gradient(180deg, #090A0F 0%, #121521 100%)',
    },
    {
      id: 'emerald-aurora',
      name: 'Subtle Aurora',
      css: 'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.18), transparent 55%), radial-gradient(ellipse at bottom left, rgba(59, 130, 246, 0.14), transparent 55%), #0B0D12',
    },
    {
      id: 'warm-horizon',
      name: 'Solar Horizon',
      css: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.15), transparent 60%), linear-gradient(180deg, #0D0C12 0%, #161521 100%)',
    },
  ],
  landscape: [
    {
      id: '/images/nordic-aurora.svg',
      name: 'Nordic Aurora Peaks',
      url: '/images/nordic-aurora.svg',
    },
    {
      id: '/images/sierra-dusk.svg',
      name: 'Sierra Twilight Ridge',
      url: '/images/sierra-dusk.svg',
    },
    {
      id: '/images/orbital-horizon.svg',
      name: 'Orbital Horizon',
      url: '/images/orbital-horizon.svg',
    },
  ],
  unsplash: [
    {
      id: 'unsplash-mountains',
      name: 'Alpine Starlight',
      url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
      credit: 'Benjamin Voros / Unsplash',
    },
    {
      id: 'unsplash-ocean',
      name: 'Pacific Mist',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
      credit: 'Sean Oulashin / Unsplash',
    },
    {
      id: 'unsplash-forest',
      name: 'Cascadia Pines',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
      credit: 'Sebastian Unrau / Unsplash',
    },
  ],
};
