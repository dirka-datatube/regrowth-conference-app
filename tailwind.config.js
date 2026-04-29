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
        // Headings — Butler Light (serif)
        heading: ['Butler-Light', 'Playfair-Display', 'serif'],
        // Hero / script flourishes — Northwell Alt
        script: ['NorthwellAlt', 'cursive'],
        // Subheadings — DIN
        sub: ['DIN', 'Inter', 'system-ui'],
        // Body copy — Butler Light
        body: ['Butler-Light', 'serif'],
        // Sans fallback for UI controls
        sans: ['Inter', 'system-ui'],
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
