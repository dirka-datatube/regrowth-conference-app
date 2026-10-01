import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IS_DEMO, DEMO_REGISTERED } from './demo';

// Stale time tuned for a 3-day conference: agenda + speakers + partners
// hardly change in a session, so cache aggressively. Q&A and auction use
// realtime subscriptions, not refetch loops.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  // The demo previews both registration states in one browser (?registered=0);
  // each keeps its own cache, or one would show the other's connections.
  key: IS_DEMO ? `regrowth-query-cache-demo-${DEMO_REGISTERED ? 'registered' : 'unregistered'}` : 'regrowth-query-cache',
});
