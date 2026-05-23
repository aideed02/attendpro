export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0f1117', 2: '#161b27', 3: '#1e2538', 4: '#252d3f' },
        border: { DEFAULT: '#2a3350', 2: '#3a4468' },
        accent: { DEFAULT: '#4f8ef7', 2: '#7c6ff7', 3: '#2ecc8a' },
        warn: '#f7b731',
        danger: '#f7554f',
        txt: { DEFAULT: '#e8eaf6', 2: '#8892b0', 3: '#5c6785' },
      },
      fontFamily: { sans: ['DM Sans','sans-serif'], mono: ['Space Mono','monospace'] },
    },
  },
  plugins: [],
};
