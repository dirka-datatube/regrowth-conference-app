import { Redirect } from 'expo-router';
import { useAppStore } from '@/lib/store';

/** Entry: into the app with a session, to Welcome without one. */
export default function Entry() {
  const session = useAppStore((s) => s.session);
  return <Redirect href={session ? '/(tabs)' : '/(auth)/welcome'} />;
}
