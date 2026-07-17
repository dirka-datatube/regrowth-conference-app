// Brand font licensing is DEFERRED (decision 2026-07-17). The app ships with
// iOS built-in fallbacks mapped in tailwind.config.js (Georgia / Snell
// Roundhand / Helvetica Neue).
//
// When Butler / Northwell Alt / DIN are licensed:
//  1. Drop the files into assets/fonts/ (see the README there)
//  2. Restore the useFonts() require map below
//  3. Restore the brand names in tailwind.config.js fontFamily
//  4. Call useBrandFonts() in app/_layout.tsx and gate splash-hide on it
export function useBrandFonts(): [boolean] {
  // No custom fonts to load while licensing is deferred.
  return [true];

  // return useFonts({
  //   'Butler-Light': require('../assets/fonts/Butler-Light.otf'),
  //   'NorthwellAlt': require('../assets/fonts/NorthwellAlt.otf'),
  //   'DIN': require('../assets/fonts/DIN-Regular.otf'),
  //   'Inter': require('../assets/fonts/Inter-Regular.ttf'),
  // });
}
