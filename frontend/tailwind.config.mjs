// tailwind.config.mjs
import lightswind from 'lightswind/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
    slideUpGrow: {
      '0%': { transform: 'translateY(20px) scaleY(0)' },
      '100%': { transform: 'translateY(0) scaleY(1)' },
    },
  },
  animation: {
    slideUpGrow: 'slideUpGrow 0.4s ease-out forwards',
  },
      fontFamily: {
        happy: ['"Happy Monkey"', 'cursive'],
      },
      letterSpacing: {
        wide34: '0.34em',
      },
      keyframes: {
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'progress-indeterminate': 'progress-indeterminate 1.5s infinite linear',
      },
    },
  },
  plugins: [lightswind],
};
