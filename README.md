# Orbit — Modern Chrome New Tab Extension

> **Your web, in orbit.**

Orbit is a fast, local-first Chrome Extension (Manifest V3) that replaces the default New Tab page with a customizable personal workspace. Inspired by the craft of Linear, Raycast, and Arc, Orbit combines a digital clock, universal web + local workspace search, customizable quick links, and 9 modular productivity and developer widgets.

---

## Key Features

- **5-Region Personal Dashboard:**
  1. **Lightweight Top Bar:** Multi-workspace switcher (`Personal`, `Work`, `Engineering`, or custom), Command Palette trigger (`Ctrl/Cmd + K`), theme switcher, Widget Library button, Keyboard Shortcuts help (`?`), and Settings.
  2. **Greeting & Tabular Clock:** Time-of-day greeting with custom display name, 12h/24h digital clock, optional seconds, configurable IANA timezone, and independent visibility toggles.
  3. **Universal Search Bar:** Search Google, DuckDuckGo, Bing, Brave, or a custom search engine while simultaneously filtering local Orbit shortcuts, notes, and tasks.
  4. **Quick Links Grid:** Drag-and-drop and keyboard reordering, custom monograms & accent colors, pinning, duplicate URL detection, JSON import/export, and optional one-click Chrome Bookmarks import.
  5. **Modular Widget Canvas:** Add, remove, hide, resize (`SM`, `MD`, `LG`), reorder, or switch between 4 editable presets (**Minimal**, **Productivity**, **Developer**, **Personal Dashboard**).

- **9 Functional Built-In Widgets:**
  - **Weather:** Live temperature, wind speed, condition, and 3-day forecast powered by Open-Meteo (with manual city search, °C/°F toggle, and opt-in geolocation).
  - **Tasks (To-Do List):** Priority badges, due dates with overdue detection, inline editing, active/completed filters, and undoable deletion.
  - **Notes:** Multi-note scratchpad with instant local autosave, safe Markdown preview, search, and one-click copy.
  - **Focus Timer:** Pomodoro timer (Focus, Short Break, Long Break) reconstructed from timestamps (`targetEndTime`) so it stays accurate across page reloads without background polling.
  - **Favorites (Bookmarks):** Compact or expanded view of pinned and favorite shortcuts.
  - **Quick Commands:** One-click workflow triggers and custom URL launchers.
  - **Developer Hub:** Git & CLI snippets, safe JSON formatter/minifier, URL encoder/decoder, UTF-8 Base64 utility, and documentation links.
  - **Daily Inspiration:** Curated quotes with favorites or your own custom daily mantra.
  - **Recent Launches:** Tracks shortcuts launched within Orbit (never accesses browser history).

---

## Technology Stack

- **Framework:** React 18 + TypeScript (strict mode)
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3 + CSS Custom Properties for live theming
- **Icons:** Lucide React
- **State & Persistence:** Zustand + `chrome.storage.sync` / `chrome.storage.local` (with automatic `localStorage` fallback for local dev)
- **Testing:** Vitest + React Testing Library + jsdom

---

## Development & Build Commands

### 1. Install dependencies
```bash
npm install
```

### 2. Run in development mode (Vite dev server)
```bash
npm run dev
```

### 3. Run unit & UI test suite
```bash
npm test
```

### 4. Typecheck and build the production Chrome Extension
```bash
npm run build
```
The compiled, ready-to-install Chrome Extension package is output to the `dist/` directory.

---

## Loading Orbit in Google Chrome (Developer Mode)

1. Run `npm run build` so the `dist/` folder is generated with `manifest.json`, compiled assets, and icons.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `dist` directory inside this project (`E:\Orbit\dist`).
6. Open a **New Tab** (`Ctrl+T` / `Cmd+T`) to launch your Orbit workspace.

---

## Keyboard Shortcuts

- `/` — Focus Universal Search
- `Ctrl/Cmd + K` — Open Command Palette
- `N` — Create a new Note (when not focused in an input)
- `T` — Focus new Task input (when not focused in an input)
- `?` — Show Keyboard Shortcuts modal
- `Escape` — Close active modal, drawer, or search dropdown

*(Note: Chrome reserves browser-level shortcuts like `Ctrl+T` and `Ctrl+L` for browser navigation; Orbit's shortcuts operate cleanly within the New Tab page.)*

---

## Documentation

- [Permissions Explanation](docs/PERMISSIONS.md)
- [Privacy Policy](docs/PRIVACY_POLICY.md)
- [Optional External APIs & Setup](docs/EXTERNAL_APIS.md)
