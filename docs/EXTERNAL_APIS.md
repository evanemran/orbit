# Optional External API Integrations & Setup Guide

Orbit works out of the box with **zero API keys required**. All core productivity tools (Clock, Universal Search, Quick Links, Notes, Tasks, Focus Timer, Developer Hub, Inspiration, and Recent Launches) work completely offline.

For online features, Orbit uses privacy-friendly defaults and supports optional user-supplied configuration.

---

## 1. Weather Provider Configuration

### Default Provider: Open-Meteo (No API Key Required)
- **Endpoints Used:**
  - Forecast: `https://api.open-meteo.com/v1/forecast`
  - City Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- **Setup:** None required. Click the city name in the Weather widget to search any city worldwide, or click the location pin icon to request browser geolocation.

### Optional Provider: OpenWeatherMap (Custom API Key)
If you prefer to use your own OpenWeatherMap account:
1. Obtain a free API key from [OpenWeatherMap](https://openweathermap.org/api).
2. Keep your API key in your local `chrome.storage.local` configuration (never commit secrets into source code).
3. In `useDashboardStore`, `weatherConfig.provider` can be set to `'custom-owm'` with `customApiKey`.

---

## 2. Background Photography (Unsplash & Custom URLs)

- **Built-in Offline Landscapes:** Orbit ships with three custom SVG vector landscapes in `public/images/` (`nordic-aurora.svg`, `sierra-dusk.svg`, and `orbital-horizon.svg`) that load instantaneously offline.
- **Curated Unsplash Backgrounds:** Select **Settings → Appearance → Background Style → Unsplash Photos** to choose high-resolution nature photography with photographer attribution.
- **Custom Image URL / Local Upload:** You can paste any `https://` image URL or upload a local image file (up to 2.5 MB) stored directly in `chrome.storage.local`.

---

## 3. Custom Search Engine Templates

Under **Settings → Search → Default Search Engine**, choose **Custom Engine** and provide any valid HTTPS search URL containing `{query}`, for example:
- Kagi: `https://kagi.com/search?q={query}`
- Perplexity: `https://www.perplexity.ai/search?q={query}`
- GitHub Code Search: `https://github.com/search?q={query}&type=code`
