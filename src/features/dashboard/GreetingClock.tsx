import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getGreetingForHour } from '@/lib/formatting/utils';

export const GreetingClock: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    showGreeting,
    showClock,
    showDate,
    showSeconds,
    clockFormat,
    timezone,
    userName,
  } = settings;

  if (!showGreeting && !showClock && !showDate) {
    return null;
  }

  const resolvedTz =
    timezone && timezone !== 'local'
      ? timezone
      : Intl.DateTimeFormat().resolvedOptions().timeZone;

  let hour24 = now.getHours();
  try {
    const hourStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: resolvedTz,
    }).format(now);
    const parsed = parseInt(hourStr, 10);
    if (!Number.isNaN(parsed)) {
      hour24 = parsed % 24;
    }
  } catch {
    // Fallback to local hour
  }

  const greetingBase = getGreetingForHour(hour24);
  const greetingText = userName.trim()
    ? `${greetingBase}, ${userName.trim()}.`
    : `${greetingBase}.`;

  let formattedTime = '';
  try {
    formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: clockFormat === '12h',
      timeZone: resolvedTz,
    }).format(now);
  } catch {
    formattedTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: clockFormat === '12h',
    });
  }

  let formattedDate = '';
  try {
    formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: resolvedTz,
    }).format(now);
  } catch {
    formattedDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <section
      aria-label="Greeting and Clock"
      className="text-center select-none flex flex-col items-center justify-center space-y-1.5"
    >
      {showGreeting && (
        <p className="text-sm sm:text-base font-medium text-orbit-muted tracking-wide">
          {greetingText}
        </p>
      )}

      {showClock && (
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-orbit-text tabular-nums leading-none">
          {formattedTime}
        </h1>
      )}

      {showDate && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-orbit-muted pt-0.5">
          <span>{formattedDate}</span>
          {timezone !== 'local' && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-orbit-sm bg-orbit-secondary/80 border border-orbit-border font-mono">
              {timezone}
            </span>
          )}
        </div>
      )}
    </section>
  );
};
