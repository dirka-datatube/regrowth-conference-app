/**
 * Public build-time configuration added with the v2 design. Expo inlines each
 * `process.env.EXPO_PUBLIC_*` read below when it bundles, so these are
 * constants in the shipped app. See .env.example for what each one is for.
 */
// tsconfig limits global types to expo-router's, which do not include Node's
// `process`. Declared for this module only, so nothing global changes.
declare const process: { env: Record<string, string | undefined> };

export const env = {
  appUrl: process.env.EXPO_PUBLIC_APP_URL,
  eventId: process.env.EXPO_PUBLIC_EVENT_ID,
  supportUrl: process.env.EXPO_PUBLIC_SUPPORT_URL,
};
