/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9ddff',
          300: '#7cc4fc',
          400: '#4aa8f5',
          500: '#2b8de6',
          600: '#1a73c4',
          700: '#165da0',
          800: '#154d84',
          900: '#14406e',
        },
      },
    },
  },
  plugins: [],
}
