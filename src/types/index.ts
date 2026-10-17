export type ThemeMode = 'dark' | 'light' | 'system';

export type BorderRadiusPreset = 'sharp' | 'default' | 'rounded' | 'pill';

export type SpacingDensity = 'compact' | 'comfortable';

export type FontSizeScale = 'sm' | 'md' | 'lg';

export type BackgroundType =
  | 'solid'
  | 'gradient'
  | 'landscape'
  | 'custom-upload'
  | 'custom-url'
  | 'unsplash';

export type SearchEngineId = 'google' | 'bing' | 'duckduckgo' | 'brave' | 'custom';

export type SearchBarPlacement = 'center' | 'top';

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type WeekStartDay = 'sunday' | 'monday';

export type TabOpenBehavior = 'current' | 'new';

export type LayoutPresetId = 'minimal' | 'productivity' | 'developer' | 'personal';

export type WidgetType =
  | 'weather'
  | 'tasks'
  | 'notes'
  | 'bookmarks'
  | 'focus'
  | 'quick-commands'
  | 'developer'
  | 'inspiration'
  | 'recent-shortcuts';

export type WidgetSize = 'sm' | 'md' | 'lg';

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  hidden: boolean;
  size: WidgetSize;
  order: number;
  settings?: Record<string, unknown>;
}

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  customIcon?: string;
  accentColor?: string;
  pinned: boolean;
  workspaceId: string;
  order: number;
  createdAt: number;
  lastUsedAt?: number;
  launchCount: number;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  priority: TaskPriority;
  workspaceId: string;
  createdAt: number;
  completedAt?: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
  updatedAt: number;
  createdAt: number;
  pinned?: boolean;
}

export type FocusMode = 'focus' | 'shortBreak' | 'longBreak';

export interface FocusTimerState {
  mode: FocusMode;
  isRunning: boolean;
  targetEndTime: number | null; // epoch ms when running
  remainingMsOnPause: number; // ms remaining when paused
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  completedSessions: number;
}

export interface QuickCommandItem {
  id: string;
  label: string;
  category: 'navigation' | 'action' | 'developer' | 'workspace';
  actionType: 'open-url' | 'toggle-theme' | 'start-focus' | 'new-note' | 'new-task' | 'switch-workspace';
  payload?: string;
  shortcutHint?: string;
  isCustom?: boolean;
}

export interface DevSnippetItem {
  id: string;
  title: string;
  category: 'snippet' | 'terminal' | 'git';
  code: string;
  language?: string;
}

export interface WeatherConfig {
  city: string;
  latitude?: number;
  longitude?: number;
  useGeolocation: boolean;
  provider: 'open-meteo' | 'custom-owm';
  customApiKey?: string;
}

export interface InspirationQuote {
  id: string;
  text: string;
  author: string;
  isCustom?: boolean;
  favorited?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  accentColor?: string;
}

export interface OrbitSettings {
  // Appearance
  theme: ThemeMode;
  accentColor: string;
  secondaryAccentColor: string;
  backgroundType: BackgroundType;
  backgroundValue: string;
  backgroundBlur: number; // 0 - 24px
  backgroundOverlay: number; // 0 - 85%
  backgroundBrightness: number; // 40 - 120%
  cardTransparency: number; // 40 - 100%
  borderRadius: BorderRadiusPreset;
  fontSize: FontSizeScale;
  density: SpacingDensity;
  reducedMotion: boolean;

  // Dashboard
  userName: string;
  showGreeting: boolean;
  showClock: boolean;
  showDate: boolean;
  showSeconds: boolean;
  searchBarPlacement: SearchBarPlacement;
  quickLinksColumns: number; // 3 - 8
  showQuickLinks: boolean;
  widgetColumns: number; // 2 - 3
  activePreset: LayoutPresetId;

  // Search
  defaultSearchEngine: SearchEngineId;
  customSearchUrlTemplate: string;
  enableSearchSuggestions: boolean;
  enableSearchHistory: boolean;
  focusSearchShortcut: string;

  // General
  tabOpenBehavior: TabOpenBehavior;
  clockFormat: '12h' | '24h';
  weekStartDay: WeekStartDay;
  temperatureUnit: TemperatureUnit;
  timezone: string; // 'local' or IANA timezone
  onboardingCompleted: boolean;
}
