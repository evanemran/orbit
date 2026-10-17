import React from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { BACKGROUND_PRESETS } from '@/lib/storage/defaults';

export const BackgroundLayer: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);

  const {
    backgroundType,
    backgroundValue,
    backgroundBlur,
    backgroundOverlay,
    backgroundBrightness,
  } = settings;

  let backgroundStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-main)',
  };

  if (backgroundType === 'solid') {
    backgroundStyle = {
      backgroundColor: backgroundValue || 'var(--bg-main)',
    };
  } else if (backgroundType === 'gradient') {
    const preset =
      BACKGROUND_PRESETS.gradient.find((g) => g.id === backgroundValue) ||
      BACKGROUND_PRESETS.gradient[0];
    backgroundStyle = {
      background: preset.css,
    };
  } else if (
    backgroundType === 'landscape' ||
    backgroundType === 'unsplash' ||
    backgroundType === 'custom-upload' ||
    backgroundType === 'custom-url'
  ) {
    let imageUrl = backgroundValue;
    if (backgroundType === 'landscape') {
      const found = BACKGROUND_PRESETS.landscape.find((l) => l.id === backgroundValue);
      imageUrl = found ? found.url : BACKGROUND_PRESETS.landscape[0].url;
    } else if (backgroundType === 'unsplash') {
      const found = BACKGROUND_PRESETS.unsplash.find((u) => u.id === backgroundValue);
      imageUrl = found ? found.url : BACKGROUND_PRESETS.unsplash[0].url;
    }

    if (imageUrl) {
      backgroundStyle = {
        backgroundImage: `url("${imageUrl.replace(/"/g, '\\"')}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        className="w-full h-full transition-all duration-500"
        style={{
          ...backgroundStyle,
          filter: `brightness(${backgroundBrightness}%) blur(${
            backgroundType === 'solid' || backgroundType === 'gradient'
              ? 0
              : Math.min(24, Math.max(0, backgroundBlur))
          }px)`,
          transform: backgroundBlur > 0 ? 'scale(1.04)' : 'scale(1)',
        }}
      />
      {backgroundOverlay > 0 && (
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: Math.min(0.85, Math.max(0, backgroundOverlay / 100)) }}
        />
      )}
    </div>
  );
};
