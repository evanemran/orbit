import React, { useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const settings = useSettingsStore((s) => s.settings);

  useGlobalShortcuts();

  useEffect(() => {
    const root = document.documentElement;

    const applyResolvedTheme = () => {
      let resolved: 'dark' | 'light' = 'dark';
      if (settings.theme === 'system') {
        const prefersLight =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-color-scheme: light)').matches;
        resolved = prefersLight ? 'light' : 'dark';
      } else {
        resolved = settings.theme;
      }
      root.setAttribute('data-theme', resolved);
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyResolvedTheme();

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: light)')
        : null;

    const listener = () => {
      if (settings.theme === 'system') applyResolvedTheme();
    };

    mediaQuery?.addEventListener?.('change', listener);
    return () => mediaQuery?.removeEventListener?.('change', listener);
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', settings.accentColor || '#8B9CFF');
    root.style.setProperty(
      '--accent-secondary',
      settings.secondaryAccentColor || '#72E0C1'
    );
    root.style.setProperty(
      '--card-opacity',
      String((settings.cardTransparency ?? 82) / 100)
    );
    root.setAttribute('data-radius', settings.borderRadius || 'default');
    root.setAttribute(
      'data-reduced-motion',
      settings.reducedMotion ? 'true' : 'false'
    );

    const fontScaleMap = {
      sm: '0.94',
      md: '1',
      lg: '1.08',
    };
    root.style.setProperty(
      '--font-scale',
      fontScaleMap[settings.fontSize] || '1'
    );
  }, [
    settings.accentColor,
    settings.secondaryAccentColor,
    settings.cardTransparency,
    settings.borderRadius,
    settings.reducedMotion,
    settings.fontSize,
  ]);

  return <>{children}</>;
};
