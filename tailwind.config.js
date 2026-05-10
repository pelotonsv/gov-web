/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F0E8',
        gold: {
          DEFAULT: '#C9A84C',
          dark:    '#A8872E',
          light:   '#E8D8A0',
          subtle:  '#C9A84C1A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
