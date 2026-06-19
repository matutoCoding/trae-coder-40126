/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
    },
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        forest: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        cream: {
          50: '#FFFBEB',
          100: '#FEF3C7',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(249, 115, 22, 0.15), 0 2px 6px -2px rgba(0,0,0,0.05)',
        soft: '0 10px 30px -15px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 4px rgba(249, 115, 22, 0.15)',
      },
      borderRadius: {
        card: '16px',
        '2xl': '14px',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.5)' },
          '70%': { boxShadow: '0 0 0 12px rgba(249, 115, 22, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(249, 115, 22, 0)' },
        },
      },
      animation: {
        shake: 'shake 0.45s ease-in-out',
        'fade-up': 'fade-up 0.5s ease-out both',
        'count-up': 'count-up 0.6s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};
