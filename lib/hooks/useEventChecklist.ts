import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * What to Pack ticks, kept on this device per event (localStorage on the
 * web). A packing list is personal and private, so it never leaves the phone.
 */
export function useEventChecklist(eventId: string) {
  const key = `regrowth:pack:${eventId}`;
  const [checked, setChecked] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setReady(false);
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive) return;
        const ids: unknown = raw ? JSON.parse(raw) : [];
        setChecked(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
      })
      .catch(() => {
        // Unreadable or blocked storage: start from an empty list.
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [key]);

  const save = useCallback(
    (next: string[]) => {
      setChecked(next);
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    },
    [key],
  );

  const toggle = useCallback(
    (id: string) => save(checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id]),
    [checked, save],
  );

  const clear = useCallback(() => save([]), [save]);

  return { checked, ready, toggle, clear };
}
