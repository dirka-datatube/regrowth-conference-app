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

        // --- Design v2 (Figma "NEW: Event App", 2026-09) -------------------
        // The teal CTA is `ocean` and the ticket / badge surface is `cloud`,
        // both from the brand block above. Everything below is app-only.
        //
        // Alerts are typed by a 2px border colour (Alerts 71:540).
        'alert-confirm': '#11676D',             // registration confirmed (= ocean)
        'alert-action': '#FF0000',              // action required
        'alert-info': '#D17F5D',                // welcome and other info (= earth)
        'alert-reminder': '#FFCC00',            // reminders — Figma "Colors/Yellow"
        'switch-on': '#34C759',                 // Figma "Default/SystemGreen/Light"

        // Copy colours new in v2: secondary lines and card body copy.
        'quiet': '#94A3B8',
        'lede': '#E2E8F0',

        // v2 surfaces. Lighter than glass: 4-7% white fills, 8-20% hairlines.
        'tile': 'rgba(255,255,255,0.04)',       // quick access tiles, help card
        'tile-line': 'rgba(255,255,255,0.08)',
        'well': 'rgba(255,255,255,0.07)',       // profile card, menu icon wells
        'hairline': 'rgba(255,255,255,0.12)',   // featured, help, learning cards
        'card-line': 'rgba(255,255,255,0.2)',   // profile card, menu rows
        'chip-teal': 'rgba(17,103,109,0.75)',   // floating support chip
        'teal-wash': 'rgba(17,103,109,0.12)',   // "Verified badge" pill
        'teal-line': 'rgba(17,103,109,0.3)',    // QR frame on the badge
        'scrim': 'rgba(0,0,0,0.55)',            // featured card image overlay
        'scrim-strong': 'rgba(0,0,0,0.8)',      // Connect feature cards
        'separator': 'rgba(60,60,67,0.36)',     // iOS alert dialog rules
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
        // v2 adds Outfit for ticket and badge labels and the Profile menu.
        label: ['Outfit', 'Helvetica Neue', 'system-ui'], // -> Outfit Bold
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
        'section': ['18px', { lineHeight: '22px' }], // v2 section headings
      },
      borderRadius: {
        card: '16px',
        note: '10px', // note cards + search field
        nav: '20px',  // glass tab bar
        pill: '999px',
        // v2. Pixel values rather than Tailwind's rem steps, which NativeWind
        // scales differently on native.
        cta: '8px',      // teal buttons
        tile: '12px',    // quick access, featured cards, menu rows, QR button
        feature: '21px', // Connect cards
        badge: '24px',   // entry badge
        hero: '50px',    // event hero image
      },
    },
  },
  plugins: [],
};
