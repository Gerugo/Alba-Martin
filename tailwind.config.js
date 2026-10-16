/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#121110',
        silk: '#FAF7F2',
        champagne: {
          DEFAULT: '#C5A059',
          light: '#E6D5B8',
          dark: '#9E7E3C',
        },
        terracotta: {
          DEFAULT: '#C87D55',
          light: '#E5A683',
        },
        cream: {
          50: '#FDFBF7',
          100: '#FAF6EE',
          200: '#F3EBD8',
          300: '#EBDDC0',
          800: '#4A4234',
          900: '#2A241C',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
