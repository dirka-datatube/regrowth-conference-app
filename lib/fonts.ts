import { useFonts } from 'expo-font';

// The brand fonts — Butler, Northwell Alt, DIN — must be licensed and dropped
// into ./assets/fonts before shipping. Names below match tailwind.config.js.
export function useBrandFonts() {
  return useFonts({
    'Butler-Light': require('../assets/fonts/Butler-Light.otf'),
    'NorthwellAlt': require('../assets/fonts/NorthwellAlt.otf'),
    'DIN': require('../assets/fonts/DIN-Regular.otf'),
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
  });
}
