/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#0F172A', light: '#1E293B', dark: '#080E1A' },
        gold:    { DEFAULT: '#C8A951', light: '#E2C97A', dark: '#9C7C2C' },
        cream:   '#FDF8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
