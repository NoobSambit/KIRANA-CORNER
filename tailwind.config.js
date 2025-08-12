/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0b1220',
        slatedeep: '#0f172a',
        neon: {
          orange: '#ff7a18',
          green: '#22e58b'
        }
      },
      boxShadow: {
        glow: '0 0 30px rgba(255,122,24,0.35)',
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
};
