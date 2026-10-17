/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        orbit: {
          main: 'var(--bg-main)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          accent: 'var(--accent-primary)',
          'accent-secondary': 'var(--accent-secondary)',
          text: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          border: 'var(--border-subtle)',
        },
      },
      borderRadius: {
        orbit: 'var(--radius-base)',
        'orbit-lg': 'var(--radius-lg)',
        'orbit-sm': 'var(--radius-sm)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        orbit: '0 8px 30px rgba(0, 0, 0, 0.24)',
        'orbit-sm': '0 2px 10px rgba(0, 0, 0, 0.14)',
      },
    },
  },
  plugins: [],
};
