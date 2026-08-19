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

        // --- Event App design system (Figma "NEW: Event App", 2026-08) -------
        // Sampled from the Insights + Events screens. `accent` is the Figma
        // token literally named "Light" (#539DF3) — the active-tab/selection
        // blue. It is NOT in the print brand palette; it exists only in the
        // app UI, so it lives here rather than in the brand block above.
        accent: '#539DF3',
        'accent-soft': 'rgba(83,157,243,0.37)', // active tab pill / chip fill
        'chip-idle': 'rgba(124,140,160,0.37)',  // unselected filter chip
        'field': 'rgba(118,118,128,0.12)',      // search field fill
        'tertiary': '#767680',                  // Figma "Fill Color/Light/Tertiary"
        'indicator': '#B9C0C9',                 // home indicator bar

        // Glassmorphism surfaces. Every card and the tab bar are translucent
        // panels with a 2px 40%-white border over the midnight ground.
        'glass': 'rgba(255,255,255,0.12)',      // tab bar / raised panel
        'glass-sunken': 'rgba(4,7,47,0.12)',    // note cards (darker than ground)
        'glass-line': 'rgba(255,255,255,0.4)',  // 2px border on both
      },
      fontFamily: {
        // Brand font licensing is DEFERRED (decision 2026-07-17). These map
        // to quality built-ins until Butler / Northwell Alt / DIN are licensed
        // and dropped into assets/fonts — then restore:
        //   heading/body: Butler-Light · script: NorthwellAlt · sub: DIN
        heading: ['Georgia', 'serif'],
        script: ['Snell Roundhand', 'cursive'],
        sub: ['Helvetica Neue', 'system-ui'],
        body: ['Georgia', 'serif'],
        sans: ['Helvetica Neue', 'system-ui'],

        // The Figma file additionally specifies Poppins (nav labels, filter
        // chips) and Inter (card titles, meta rows). Neither is licensed or
        // bundled yet — see assets/fonts/README.md. Mapped to system stacks
        // with matching metrics so layout does not shift when they land.
        ui: ['Poppins', 'Helvetica Neue', 'system-ui'],   // -> Poppins Medium
        data: ['Inter', 'Helvetica Neue', 'system-ui'],   // -> Inter Regular
      },
      fontSize: {
        hero: ['44px', { lineHeight: '52px', letterSpacing: '-0.5px' }],
        h1: ['32px', { lineHeight: '40px' }],
        h2: ['24px', { lineHeight: '32px' }],
        h3: ['20px', { lineHeight: '28px' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],

        // Design-specific sizes measured off the Figma frames.
        'screen-title': ['20px', { lineHeight: '26px' }],
        'screen-sub': ['13px', { lineHeight: '18px' }],
        'note-title': ['14px', { lineHeight: '18px' }],
        'note-body': ['12px', { lineHeight: '17px' }],
        'meta': ['10px', { lineHeight: '15px' }],
        'tab': ['12px', { lineHeight: '16px' }],
        'field': ['17px', { lineHeight: '22px', letterSpacing: '-0.408px' }],
      },
      borderRadius: {
        card: '16px',
        note: '10px', // note cards + search field
        nav: '20px',  // glass tab bar
        pill: '999px',
      },
    },
  },
  plugins: [],
};
