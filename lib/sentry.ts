import * as Sentry from '@sentry/react-native';

// No-op without a DSN so dev/demo builds never send events.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    environment: process.env.EXPO_PUBLIC_DEMO_MODE === 'true' ? 'demo' : 'production',
  });
}
