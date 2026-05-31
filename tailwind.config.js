/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        // Pastel palette
        pastel: {
          peach:  '#FEF3E8',
          mint:   '#ECFDF5',
          sky:    '#EFF6FF',
          rose:   '#FFF1F2',
          violet: '#F5F3FF',
          amber:  '#FFFBEB',
          teal:   '#F0FDFA',
          lavender: '#FAF5FF',
        },
        dark: {
          base:     '#0F0F15',
          card:     '#1A1A24',
          elevated: '#22222E',
          subtle:   '#2A2A38',
          border:   '#2C2C3C',
        },
      },
      boxShadow: {
        card:     '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)',
        brand:    '0 4px 12px rgba(249,115,22,0.28)',
        'brand-lg': '0 6px 20px rgba(249,115,22,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':        'fadeIn 0.3s ease-out',
        'fade-in-up':     'fadeInUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in':       'scaleIn 0.2s ease-out',
        'skeleton-wave':  'skeleton-wave 1.6s ease-in-out infinite',
        'bounce-sm':      'bounceSm 0.5s ease-out',
      },
      keyframes: {
        fadeIn:         { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp:       { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight:   { '0%': { opacity: '0', transform: 'translateX(24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:        { '0%': { opacity: '0', transform: 'scale(0.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'skeleton-wave': { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
        bounceSm:       { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
      },
    },
  },
  plugins: [],
};
