/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Dark
        'primary-dark': {
          DEFAULT: '#000000',
          950: '#1a0505',
        },
        // Accent Red
        'accent-red': {
          DEFAULT: '#ef233c',
          glow: 'rgba(239, 35, 60, 0.5)',
        },
        // Surface
        surface: {
          DEFAULT: '#09090b',
          50: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
        },
        // Text
        text: {
          DEFAULT: '#ffffff',
          primary: '#f4f4f5',
          secondary: '#e4e4e7',
        },
        // Muted
        muted: {
          DEFAULT: '#a1a1aa',
          50: '#71717a',
          100: '#52525b',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}