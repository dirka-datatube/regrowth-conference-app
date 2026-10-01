// REGROWTH digital palette — see brand guidelines PDF.
// Default scheme: Midnight bg, Snow type, Earth for CTAs and highlights.

export const colors = {
  midnight: '#04072F',
  snow: '#FFFFFF',
  earth: '#D17F5D',
  ocean: '#11676D',
  cloud: '#DCD9D0',
  basalt: '#000000',
  muted: '#8A8DA6',
  danger: '#B33A3A',

  // App UI colours for props that take a value rather than a className —
  // icon colours, Switch tracks, the QR renderer. Mirrors tailwind.config.js.
  indicator: '#B9C0C9',
  accent: '#539DF3',
  quiet: '#94A3B8',
  switchOn: '#34C759',
  switchOff: 'rgba(120,120,128,0.32)',
  alertConfirm: '#11676D',
  alertAction: '#FF0000',
  alertInfo: '#D17F5D',
  alertReminder: '#FFCC00',
} as const;

/**
 * The Continue Learning card is a left-to-right gradient. CSS does it on the
 * web; native falls back to a flat fill between the two stops, the same way
 * GlassPanel drops its backdrop blur.
 */
export const learningGradient = {
  web: 'linear-gradient(90deg, rgba(220,217,208,0.33) 0%, rgba(10,22,40,0.73) 100%)',
  native: 'rgba(98,102,110,0.55)',
} as const;

export const fonts = {
  heading: 'Butler-Light',
  script: 'NorthwellAlt',
  sub: 'DIN',
  body: 'Butler-Light',
  sans: 'Inter',
} as const;

// Reasonable web/system fallbacks the bundler resolves before asset fonts load.
export const REGROWTH = 'REGROWTH';
export const REGROWTH_R = 'REGROWTH®';
