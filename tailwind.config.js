/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b0d12',
        card: '#12151e',
        subcard: '#181c28',
        accent: '#f59e0b',
      },
    },
  },
  plugins: [],
};
