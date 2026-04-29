# Brand fonts

These four font files must be dropped in here before the app bundles cleanly:

- `Butler-Light.otf` — headings + body
- `NorthwellAlt.otf` — script flourishes (use sparingly)
- `DIN-Regular.otf` — subheadings
- `Inter-Regular.ttf` — UI fallback

Butler is free for commercial use (Fontfabric).
DIN and Inter are widely licensed.
**Northwell Alt requires a license** — confirm REGROWTH's purchase covers app
embedding before shipping.

Until these files exist, `lib/fonts.ts` will fail at build time. Either:
1. Drop the files in, or
2. Comment out `useBrandFonts()` in `app/_layout.tsx` to ship with system fallbacks.
