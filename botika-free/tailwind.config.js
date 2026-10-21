/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        silk: {
          50: '#FAF8F5',
          100: '#F4EFEB',
          200: '#E8E1D9',
          300: '#D5C9BE',
          400: '#BDB0A3',
          500: '#9B8C7E',
          600: '#75685B',
          700: '#534940',
          800: '#342D27',
          900: '#1A1613',
        },
        gold: {
          light: '#E6CA85',
          DEFAULT: '#C5A059',
          dark: '#9A7836'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
