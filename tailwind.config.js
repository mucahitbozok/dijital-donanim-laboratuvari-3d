/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lab: {
          950: '#07080a', // Deep OLED obsidian
          900: '#0e1015', // Sleek graphite surface
          850: '#15171e', // Card background
          800: '#1d2029', // Interactive hover / active card
          750: '#252934', // Borders
          700: '#2f3442', // Highlight borders
          600: '#474e63', // Subtle text / dividers
          accent: '#6366f1',
          neon: '#38bdf8',
          purple: '#a855f7',
          emerald: '#10b981',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(255, 255, 255, 0.08)',
        'glow-accent': '0 0 25px -4px rgba(99, 102, 241, 0.25)',
        'card-glow': '0 8px 30px -4px rgba(0, 0, 0, 0.7)',
        'neon': '0 0 20px -3px rgba(255, 255, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
