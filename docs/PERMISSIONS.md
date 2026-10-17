# Orbit — Chrome Extension Permissions Explanation

Orbit follows the principle of **least privilege** and requests only the permissions strictly necessary for user-initiated features.

---

## 1. Required Permissions

### `storage`
- **Declared in:** `manifest.json` (`permissions: ["storage"]`)
- **Why it is required:**
  - Stores compact user preferences (theme mode, clock format, accent color, layout flags) in `chrome.storage.sync`.
  - Stores larger local workspace datasets (quick links, notes, to-do tasks, focus timer timestamps, custom snippets, and widget configurations) in `chrome.storage.local`.
- **Privacy guarantee:** Data stored in `chrome.storage` remains inside your browser profile and is never transmitted to any Orbit server.

---

## 2. Optional Permissions

### `bookmarks`
- **Declared in:** `manifest.json` (`optional_permissions: ["bookmarks"]`)
- **Why it is optional:**
  - Orbit does **not** request access to your Chrome bookmarks on installation.
  - Only if you explicitly click the **"Chrome Bookmarks"** import button in the Quick Links section will Chrome prompt you to grant `bookmarks` access via `chrome.permissions.request({ permissions: ['bookmarks'] })`.
  - Once granted, Orbit reads bookmark titles and `http/https` URLs to populate your Quick Links grid locally.

---

## 3. Browser APIs Used Without Manifest Permissions

### Geolocation (`navigator.geolocation`)
- Used **only** if you explicitly click the **"Use current location"** button inside the Weather widget.
- You can use the Weather widget without geolocation at any time by typing a city name manually.

---

## 4. Permissions Orbit Explicitly Does NOT Request

- **No `history` or `tabs` permission:** Orbit never reads your browsing history or open tabs. The "Recent Launches" widget tracks only shortcuts clicked directly inside the Orbit New Tab dashboard.
- **No `<all_urls>` or host permissions:** Orbit does not inject content scripts into any websites you visit.
- **No `cookies` or `webRequest` permissions:** Orbit never inspects or modifies network traffic or authentication cookies.
