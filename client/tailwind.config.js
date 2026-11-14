/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#050606',
          surface: '#0D0F0F',
          card: '#131616',
          muted: '#1D2222',
          border: '#272D2D',
        },
        secondary: {
          DEFAULT: '#F5F3EF',
          card: '#ECE9E2',
          hover: '#E2DED5',
          border: '#DDD8CE',
        },
        accent: {
          DEFAULT: '#C8FF00',
          hover: '#B5E600',
          muted: 'rgba(200, 255, 0, 0.12)',
          dark: '#93BA00',
        },
        status: {
          waiting: '#FFAA00',
          inService: '#00C8FF',
          completed: '#C8FF00',
          cancelled: '#FF4D4D',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
        accent: '0 0 25px -5px rgba(200, 255, 0, 0.35)',
        card: '0 2px 10px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
