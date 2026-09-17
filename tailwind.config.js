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
          950: '#060913',
          900: '#0b1120',
          850: '#0f172a',
          800: '#162035',
          700: '#1e293b',
          600: '#334155',
          accent: '#38bdf8',
          neon: '#00f0ff',
          purple: '#a855f7',
          emerald: '#10b981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 20px -3px rgba(0, 240, 255, 0.35)',
        'neon-purple': '0 0 20px -3px rgba(168, 85, 247, 0.35)',
        'card-glow': '0 0 25px rgba(14, 165, 233, 0.15)',
      }
    },
  },
  plugins: [],
}
