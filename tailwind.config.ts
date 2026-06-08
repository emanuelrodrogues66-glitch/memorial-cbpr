import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F7F6F2',
        surface: '#F9F8F5',
        border: '#D4D1CA',
        ink: '#28251D',
        muted: '#7A7974',
        primary: '#01696F',
        primaryHover: '#0C4E54',
        danger: '#A12C7B',
        warning: '#964219',
        success: '#437A22'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
export default config;
