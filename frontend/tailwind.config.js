/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F4C81',
        secondary: '#1E88E5',
        accent: '#FFC107',
      },
      fontFamily: {
        'sans': ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'premium': '0 20px 40px rgba(0, 0, 0, 0.1)',
        'premium-lg': '0 30px 60px rgba(0, 0, 0, 0.15)',
      },
      backdropFilter: {
        'glass': 'blur(10px)',
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function({ addBase, addComponents, addUtilities }) {
      addBase({
        'html': {
          'scroll-behavior': 'smooth',
        },
      });
      addComponents({
        '.glass': {
          '@apply backdrop-blur-md bg-white/30 border border-white/50': {},
        },
        '.btn-primary': {
          '@apply px-6 py-3 bg-primary text-white font-bold rounded-lg hover:shadow-lg transition-all': {},
        },
        '.btn-secondary': {
          '@apply px-6 py-3 bg-secondary text-white font-bold rounded-lg hover:shadow-lg transition-all': {},
        },
      });
    }),
  ],
}

