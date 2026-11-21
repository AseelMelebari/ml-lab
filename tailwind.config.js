/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cocoa: { DEFAULT: '#60351F', 50: '#F6EEE8', 100: '#EBD9CC', 200: '#D6B49C', 300: '#BC8965', 400: '#8F5A3C', 500: '#60351F', 600: '#532D1A', 700: '#422417', 800: '#331B11', 900: '#24130C' },
        espresso: '#422417',
        cream: { DEFAULT: '#F7F0E3', 50: '#FFFCF7', 100: '#FBF6EC', 200: '#F7F0E3', 300: '#EFE3CF', 400: '#E8D9C3' },
        beige: '#E8D9C3',
        caramel: { DEFAULT: '#BC8965', light: '#D9B597', dark: '#9C6C4A' },
        offwhite: '#FFFCF7',
        sage: '#6F7F5E',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['Alexandria', '"IBM Plex Sans Arabic"', 'sans-serif'],
        latin: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(66,36,23,.04), 0 8px 24px -12px rgba(66,36,23,.18)',
        lift: '0 2px 4px rgba(66,36,23,.05), 0 22px 40px -20px rgba(66,36,23,.35)',
        inset: 'inset 0 0 0 1px rgba(96,53,31,.10)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'float-slow': { '0%,100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-10px) rotate(3deg)' } },
        shimmer: { '100%': { transform: 'translateX(-100%)' } },
        'slide-in': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.2,.7,.2,1) both',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'slide-in': 'slide-in .3s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
};
