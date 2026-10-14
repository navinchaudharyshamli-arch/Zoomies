/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: 'var(--cream)',
        'cream-deep': 'var(--cream-deep)',
        surface: 'var(--surface)',
        'surface-solid': 'var(--surface-solid)',
        brown: 'var(--brown)',
        'brown-2': 'var(--brown-2)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        orange: {
          DEFAULT: 'var(--orange)',
          dark: 'var(--orange-dark)',
          soft: 'var(--orange-soft)',
        },
        blue: {
          DEFAULT: 'var(--blue)',
          2: 'var(--blue-2)',
          dark: 'var(--blue-dark)',
        },
        pink: {
          DEFAULT: 'var(--pink)',
          2: 'var(--pink-2)',
          dark: 'var(--pink-dark)',
        },
        red: {
          DEFAULT: 'var(--red)',
          soft: 'var(--red-soft)',
        },
        green: {
          DEFAULT: 'var(--green)',
        }
      },
      borderRadius: {
        'xl': 'var(--radius-xl)',
        'lg': 'var(--radius-lg)',
        'md': 'var(--radius-md)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'card': 'var(--shadow)',
      }
    },
  },
  plugins: [],
}
