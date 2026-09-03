/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false, // Disables Tailwind's CSS reset to preserve EXMA's original theme, buttons, and fonts
  },
  theme: {
    extend: {
      colors: {
        exma: {
          bg: '#090d16',
          secondary: '#111827',
          panel: '#0f172a',
          card: 'rgba(17, 24, 39, 0.7)',
          glass: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
          purple: '#818cf8',
          emerald: '#34d399',
          sky: '#38bdf8',
          indigo: '#6366f1',
          ruby: '#e11d48',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

