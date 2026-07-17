/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // REGROWTH digital palette
        midnight: '#04072F',
        snow: '#FFFFFF',
        earth: '#D17F5D',
        ocean: '#11676D',
        cloud: '#DCD9D0',
        basalt: '#000000',
        // Semantic helpers
        muted: '#8A8DA6',
        success: '#11676D',
        warning: '#D17F5D',
        danger: '#B33A3A',
      },
      fontFamily: {
        // Brand font licensing is DEFERRED (decision 2026-07-17). These map
        // to quality iOS built-ins until Butler / Northwell Alt / DIN files
        // are licensed and dropped into assets/fonts — then restore:
        //   heading/body: Butler-Light · script: NorthwellAlt · sub: DIN
        heading: ['Georgia', 'serif'],
        script: ['Snell Roundhand', 'cursive'],
        sub: ['Helvetica Neue', 'system-ui'],
        body: ['Georgia', 'serif'],
        sans: ['Helvetica Neue', 'system-ui'],
      },
      fontSize: {
        hero: ['44px', { lineHeight: '52px', letterSpacing: '-0.5px' }],
        h1: ['32px', { lineHeight: '40px' }],
        h2: ['24px', { lineHeight: '32px' }],
        h3: ['20px', { lineHeight: '28px' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
