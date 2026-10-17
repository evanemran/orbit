# Privacy Policy — Orbit New Tab Extension

**Effective Date:** October 17, 2026

Orbit ("we", "our", or "the extension") is designed from the ground up as a **local-first, privacy-respecting** Chrome extension.

---

## 1. Data Stored Locally on Your Device

All personal workspace content you create in Orbit is stored exclusively in your browser's local extension storage (`chrome.storage.local` and `chrome.storage.sync`):

- Quick links and pinned shortcuts
- Notes and Markdown scratchpads
- To-do tasks, priorities, and due dates
- Focus timer state and session counts
- Developer snippets and custom commands
- Theme, layout, and appearance preferences

**Orbit does not operate a backend database, require user accounts, or transmit your notes, tasks, or shortcuts to any external server.**

---

## 2. No Analytics, Telemetry, or Browsing History Collection

- Orbit includes **zero** third-party analytics SDKs, telemetry trackers, or advertising scripts.
- Orbit does **not** access or record your browser history. The "Recent Launches" widget only counts clicks on shortcuts initiated inside the Orbit New Tab page itself and can be cleared with one click.

---

## 3. Optional External Network Requests

When your device is online, Orbit may make direct client-to-provider requests for the following features:

1. **Web Search:** When you submit a search query, your browser navigates directly to your chosen search engine (Google, DuckDuckGo, Bing, Brave Search, or your custom URL template).
2. **Weather Widget:** By default, the Weather widget fetches forecast data from [Open-Meteo](https://open-meteo.com/) using the latitude and longitude of your selected city. If you configure a custom OpenWeatherMap API key, requests are sent directly to `api.openweathermap.org`.
3. **Website Favicons & Optional Unsplash Backgrounds:** Quick links load favicons for configured domains, and selecting an Unsplash background loads the corresponding image URL directly from `images.unsplash.com`.

---

## 4. Data Portability & Deletion

- **Export:** You can export your entire Orbit workspace to a standard JSON file at any time via **Settings → General & Data → Export Backup JSON**.
- **Reset / Deletion:** You can permanently erase all Orbit data via **Settings → General & Data → Reset All Data**, or by uninstalling the extension from Chrome.
