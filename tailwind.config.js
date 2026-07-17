/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // REGROWTH digital palette (brand primitives)
        midnight: '#04072F',
        snow: '#FFFFFF',
        earth: '#D17F5D',
        ocean: '#11676D',
        cloud: '#DCD9D0',
        basalt: '#000000',

        // Semantic tokens — LIGHT-FIRST direction from real collateral
        // (2026-07-17 email screenshots). Screens use these, not primitives,
        // so a future re-theme is a token change, not a codebase sweep.
        canvas: '#F7F5F0', // app background (warm off-white)
        surface: '#FFFFFF', // cards
        'surface-alt': '#F1EEE6', // chips, subtle fills
        ink: '#04072F', // headings / primary text (Midnight)
        'ink-soft': '#4A4E6E', // body text
        'ink-faint': '#8B8EA6', // captions, placeholders
        line: '#E5E2D9', // dividers, card borders
        cta: '#D17F5D', // Earth — buttons, highlights
        'cta-deep': '#B85F3D', // Earth darkened for small text / AA contrast
        accent: '#11676D', // Ocean — informational
        danger: '#B33A3A',

        // "Moment" screens keep the dramatic Midnight look (welcome, QR,
        // scanner, live-session view).
        moment: '#04072F',
        'moment-ink': '#FFFFFF',
        'moment-soft': 'rgba(255,255,255,0.72)',
        muted: '#8B8EA6',
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
        hero: ['40px', { lineHeight: '48px', letterSpacing: '-0.5px' }],
        h1: ['30px', { lineHeight: '38px' }],
        h2: ['24px', { lineHeight: '32px' }],
        h3: ['19px', { lineHeight: '26px' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
      },
      borderRadius: {
        card: '18px',
        pill: '999px',
      },
    },
  },
};
