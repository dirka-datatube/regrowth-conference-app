import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { useSessions, useMySchedule } from '@/lib/hooks/useSessions';

type Filter = 'all' | 'mine';

export default function Agenda() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: sessions } = useSessions();
  const { data: myPicks } = useMySchedule();

  const grouped = useMemo(() => {
    if (!sessions) return [] as { day: string; items: typeof sessions }[];
    const filtered = filter === 'mine' && myPicks
      ? sessions.filter((s) => myPicks.has(s.id))
      : sessions;
    const byDay = new Map<string, typeof sessions>();
    for (const s of filtered) {
      const day = new Date(s.start_at).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      const arr = byDay.get(day) ?? [];
      arr.push(s);
      byDay.set(day, arr);
    }
    return Array.from(byDay.entries()).map(([day, items]) => ({ day, items }));
  }, [sessions, myPicks, filter]);

  return (
    <Screen>
      <View className="pt-2">
        <T variant="caption">Agenda</T>
        <T variant="h1" className="mt-2">What's on</T>
      </View>

      <View className="flex-row mt-4 bg-snow/5 rounded-pill p-1">
        {(['all', 'mine'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`flex-1 rounded-pill py-2 items-center ${filter === f ? 'bg-earth' : ''}`}
          >
            <T variant="small" className={filter === f ? 'text-snow' : 'text-cloud'}>
              {f === 'all' ? 'All sessions' : 'My schedule'}
            </T>
          </Pressable>
        ))}
      </View>

      <View className="mt-6 gap-y-6">
        {grouped.map(({ day, items }) => (
          <View key={day}>
            <T variant="sub">{day}</T>
            <View className="mt-3 gap-y-2">
              {items.map((s) => (
                <Card key={s.id} onPress={() => router.push(`/session/${s.id}`)}>
                  <T variant="caption" className="normal-case tracking-normal text-earth">
                    {formatTime(s.start_at)} – {formatTime(s.end_at)}{s.room ? ` · ${s.room}` : ''}
                  </T>
                  <T variant="h3" className="mt-1">{s.title}</T>
                  {s.speakers?.length ? (
                    <T variant="small" className="mt-1">
                      {s.speakers.map((sp: any) => sp.speaker?.name).filter(Boolean).join(', ')}
                    </T>
                  ) : null}
                </Card>
              ))}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
