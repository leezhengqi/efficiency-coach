/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#EFF6FB',
          100: '#D6E8F5',
          200: '#B3D3EC',
          300: '#8CBDE2',
          400: '#5BA3D5',
          500: '#3A8CC4',
          600: '#2B6FA0',
          700: '#22567D',
          800: '#1B4160',
          900: '#142E45',
        },
        surface: {
          50: '#F8FAFB',
          100: '#F0F3F6',
          200: '#E4E9ED',
          300: '#CDD5DE',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
