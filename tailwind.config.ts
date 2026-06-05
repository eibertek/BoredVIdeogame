import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        office: {
          dark: '#1a1a2e',
          mid: '#16213e',
          accent: '#0f3460',
          gold: '#e94560',
        },
      },
    },
  },
  plugins: [],
};

export default config;
