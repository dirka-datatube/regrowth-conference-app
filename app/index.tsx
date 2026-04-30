import { Redirect } from 'expo-router';
import { useAppStore } from '@/lib/store';

export default function Entry() {
  const session = useAppStore((s) => s.session);
  return session ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/welcome" />;
}
