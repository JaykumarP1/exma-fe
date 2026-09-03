/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#090d16',
          secondary: '#111827',
          panel: '#0f172a',
          card: 'rgba(17, 24, 39, 0.7)',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
          active: 'rgba(99, 102, 241, 0.4)',
        },
        brand: {
          indigo: '#6366f1',
          ruby: '#e11d48',
          emerald: '#10b981',
          sky: '#38bdf8',
          purple: '#818cf8',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '14px',
        'lg': '20px',
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
};

