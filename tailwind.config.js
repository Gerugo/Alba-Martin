/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF6EE',
          200: '#F3EBD8',
          300: '#EBDDC0',
          800: '#4A4234',
          900: '#2A241C',
        },
      },
    },
  },
  plugins: [],
}
