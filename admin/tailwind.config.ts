import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#023C3C',
          'teal-light': '#034E4E',
          orange: '#E88F24',
          aqua: '#56C4C4',
          dark: '#011E1E',
          coral: '#EF8C86',
          green: '#62B797',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
