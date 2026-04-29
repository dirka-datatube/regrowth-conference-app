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
