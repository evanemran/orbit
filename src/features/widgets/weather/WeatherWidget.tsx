import React, { useEffect, useState, useCallback } from 'react';
import {
  CloudSun,
  MapPin,
  RefreshCw,
  Navigation,
  Settings2,
  AlertCircle,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface ForecastDay {
  date: string;
  maxTempC: number;
  minTempC: number;
  code: number;
}

interface WeatherData {
  tempC: number;
  condition: string;
  windKph: number;
  humidity?: number;
  forecast: ForecastDay[];
  fetchedAt: number;
}

function mapWmoCodeToLabel(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Light Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Mild';
}

function formatTemp(tempC: number, unit: 'celsius' | 'fahrenheit'): string {
  if (unit === 'fahrenheit') {
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

export const WeatherWidget: React.FC = () => {
  const weatherConfig = useDashboardStore((s) => s.weatherConfig);
  const updateWeatherConfig = useDashboardStore((s) => s.updateWeatherConfig);
  const temperatureUnit = useSettingsStore((s) => s.settings.temperatureUnit);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState(weatherConfig.city);

  const fetchWeatherByCoords = useCallback(
    async (lat: number, lon: number, cityName: string) => {
      setLoading(true);
      setError(null);
      try {
        if (weatherConfig.provider === 'custom-owm' && weatherConfig.customApiKey) {
          const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(
            weatherConfig.customApiKey
          )}`;
          const res = await fetch(owmUrl);
          if (!res.ok) throw new Error('OpenWeatherMap API request failed.');
          const json = await res.json();
          setWeather({
            tempC: json.main?.temp ?? 20,
            condition: json.weather?.[0]?.main || 'Clear',
            windKph: Math.round((json.wind?.speed ?? 0) * 3.6),
            forecast: [],
            fetchedAt: Date.now(),
          });
        } else {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Weather service temporarily unavailable.');
          const data = await res.json();

          const days: ForecastDay[] = (data.daily?.time || []).map(
            (t: string, i: number) => ({
              date: t,
              maxTempC: data.daily.temperature_2m_max?.[i] ?? 20,
              minTempC: data.daily.temperature_2m_min?.[i] ?? 12,
              code: data.daily.weather_code?.[i] ?? 0,
            })
          );

          setWeather({
            tempC: data.current?.temperature_2m ?? 18,
            condition: mapWmoCodeToLabel(data.current?.weather_code ?? 0),
            windKph: Math.round(data.current?.wind_speed_10m ?? 0),
            forecast: days,
            fetchedAt: Date.now(),
          });
        }
        updateWeatherConfig({ city: cityName, latitude: lat, longitude: lon });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load weather (check connection).'
        );
      } finally {
        setLoading(false);
      }
    },
    [weatherConfig.provider, weatherConfig.customApiKey, updateWeatherConfig]
  );

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = cityInput.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q
      )}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      if (!res.ok) throw new Error('Geocoding lookup failed.');
      const json = await res.json();
      const first = json.results?.[0];
      if (!first) {
        setError(`City "${q}" not found.`);
        setLoading(false);
        return;
      }
      setIsEditingCity(false);
      await fetchWeatherByCoords(first.latitude, first.longitude, first.name);
    } catch {
      setError('Could not look up city coordinates while offline.');
      setLoading(false);
    }
  };

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchWeatherByCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          'Current Location'
        );
      },
      () => {
        setLoading(false);
        setError('Location permission denied. Select a city manually.');
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    const lat = weatherConfig.latitude ?? 37.7749;
    const lon = weatherConfig.longitude ?? -122.4194;
    void fetchWeatherByCoords(lat, lon, weatherConfig.city || 'San Francisco');
  }, []);

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setCityInput(weatherConfig.city);
            setIsEditingCity((v) => !v);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-orbit-text hover:text-orbit-accent transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-orbit-accent" />
          <span>{weatherConfig.city || 'Select City'}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              void updateSettings({
                temperatureUnit:
                  temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius',
              })
            }
            title="Switch °C / °F"
            className="px-1.5 py-0.5 text-[11px] font-mono rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-muted hover:text-orbit-text"
          >
            {temperatureUnit === 'celsius' ? '°C' : '°F'}
          </button>

          <button
            type="button"
            onClick={handleRequestGeolocation}
            title="Use current location (asks permission)"
            aria-label="Use current location"
            className="p-1 text-orbit-muted hover:text-orbit-text rounded-orbit-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsEditingCity((v) => !v)}
            title="Configure city"
            aria-label="Configure city"
            className="p-1 text-orbit-muted hover:text-orbit-text rounded-orbit-sm"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              void fetchWeatherByCoords(
                weatherConfig.latitude ?? 37.7749,
                weatherConfig.longitude ?? -122.4194,
                weatherConfig.city
              )
            }
            title="Refresh weather"
            aria-label="Refresh weather"
            className="p-1 text-orbit-muted hover:text-orbit-text rounded-orbit-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* City Search Bar */}
      {isEditingCity && (
        <form onSubmit={handleCitySearch} className="flex items-center gap-1.5">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Enter city name (e.g. Tokyo)..."
            className="flex-1 px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950"
          >
            Save
          </button>
        </form>
      )}

      {/* Content */}
      {loading && !weather ? (
        <div className="space-y-2 py-2 animate-pulse" data-testid="weather-loading">
          <div className="h-7 w-24 bg-orbit-secondary rounded-orbit-sm" />
          <div className="h-4 w-36 bg-orbit-secondary rounded-orbit-sm" />
        </div>
      ) : error ? (
        <div className="p-3 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border flex items-start gap-2 text-xs text-orbit-muted">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-orbit-text font-medium">Weather Unavailable</p>
            <p className="text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      ) : weather ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-orbit-text tabular-nums">
                {formatTemp(weather.tempC, temperatureUnit)}
              </div>
              <p className="text-xs text-orbit-muted">{weather.condition}</p>
            </div>
            <div className="flex flex-col items-end text-[11px] text-orbit-muted">
              <CloudSun className="w-7 h-7 text-orbit-accent mb-1" />
              <span>Wind {weather.windKph} km/h</span>
            </div>
          </div>

          {weather.forecast.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-orbit-border/60">
              {weather.forecast.map((day) => {
                const dayName = new Date(`${day.date}T12:00:00`).toLocaleDateString(
                  'en-US',
                  { weekday: 'short' }
                );
                return (
                  <div
                    key={day.date}
                    className="p-1.5 rounded-orbit-sm bg-orbit-secondary/50 text-center"
                  >
                    <p className="text-[10px] text-orbit-muted">{dayName}</p>
                    <p className="text-xs font-medium text-orbit-text tabular-nums mt-0.5">
                      {formatTemp(day.maxTempC, temperatureUnit)}
                    </p>
                    <p className="text-[10px] text-orbit-muted tabular-nums">
                      {formatTemp(day.minTempC, temperatureUnit)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
