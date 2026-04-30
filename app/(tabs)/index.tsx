import { useState } from 'react';
import { View, RefreshControl, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAppStore } from '@/lib/store';
import { useHappeningNow, useUpNext } from '@/lib/hooks/useSessions';
import { useSuggestions } from '@/lib/hooks/useSuggestions';
import { useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const attendee = useAppStore((s) => s.attendee);
  const happening = useHappeningNow();
  const upNext = useUpNext();
  const suggestions = useSuggestions();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  }

  const firstName = (attendee?.name ?? '').split(' ')[0] || 'there';

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#D17F5D" />}
    >
      <View className="flex-row items-center justify-between pt-2">
        <T variant="caption">REGROWTH®</T>
        <Pressable onPress={() => router.push('/menu')} hitSlop={10}>
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="mt-6">
        <T variant="caption">Welcome,</T>
        <T variant="hero" className="mt-1">{firstName}</T>
        <T variant="script" className="mt-1">we're glad to see you.</T>
      </View>

      {/* Happening now */}
      <View className="mt-8">
        <T variant="sub">Happening now</T>
        {happening.data && happening.data.length > 0 ? (
          happening.data.map((s) => (
            <Card key={s.id} className="mt-3" onPress={() => router.push(`/session/${s.id}`)}>
              <T variant="h3">{s.title}</T>
              {s.room && <T variant="small" className="mt-1">{s.room}</T>}
              <View className="mt-4">
                <Button label="I'm here" variant="primary" fullWidth={false} onPress={() => {/* check-in */}} />
              </View>
            </Card>
          ))
        ) : (
          <Card className="mt-3">
            <T variant="body" className="text-cloud/80">
              Nothing on right now. Take a breath, grab a coffee — we're just getting started.
            </T>
          </Card>
        )}
      </View>

      {/* Up next */}
      <View className="mt-8">
        <T variant="sub">Up next in 30 minutes</T>
        {upNext.data && upNext.data.length > 0 ? (
          upNext.data.map((s) => (
            <Card key={s.id} variant="earth" className="mt-3" onPress={() => router.push(`/session/${s.id}`)}>
              <T variant="h3">{s.title}</T>
              {s.room && <T variant="small" className="mt-1">{s.room}</T>}
              {upNext.data.length > 1 && (
                <T variant="caption" className="mt-3 text-earth">
                  Don't miss this — pick the one for you.
                </T>
              )}
            </Card>
          ))
        ) : (
          <Card className="mt-3">
            <T variant="body" className="text-cloud/80">We'll let you know when something starts soon.</T>
          </Card>
        )}
      </View>

      {/* People to meet */}
      <View className="mt-8">
        <T variant="sub">People you should meet today</T>
        <View className="mt-3 gap-y-3">
          {suggestions.data?.attendees.map((p: any) => (
            <Card key={p.id} onPress={() => router.push(`/attendees/${p.id}`)}>
              <View className="flex-row items-center">
                {p.photo_url ? (
                  <Image source={{ uri: p.photo_url }} className="w-14 h-14 rounded-full bg-snow/10" />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-snow/10 items-center justify-center">
                    <Ionicons name="person" size={24} color="#DCD9D0" />
                  </View>
                )}
                <View className="ml-4 flex-1">
                  <T variant="h3">{p.name}</T>
                  <T variant="small">{[p.role, p.company].filter(Boolean).join(' • ')}</T>
                  {suggestions.data?.rationale[p.id] && (
                    <T variant="caption" className="mt-1 text-earth normal-case tracking-normal">
                      {suggestions.data.rationale[p.id]}
                    </T>
                  )}
                </View>
              </View>
            </Card>
          ))}
          {!suggestions.data?.attendees.length && (
            <Card>
              <T variant="body" className="text-cloud/80">
                We're still learning who'd be a great match. Check back later today.
              </T>
            </Card>
          )}
        </View>
      </View>

      {/* Partners worth checking out */}
      <View className="mt-8">
        <T variant="sub">Partners worth a look</T>
        <View className="mt-3 gap-y-3">
          {suggestions.data?.partners.map((p: any) => (
            <Card key={p.id} onPress={() => router.push(`/partners/${p.id}`)}>
              <T variant="h3">{p.name}</T>
              {p.description && (
                <T variant="body" className="mt-2 text-cloud/80" numberOfLines={2}>
                  {p.description}
                </T>
              )}
            </Card>
          ))}
        </View>
      </View>

      {/* Quick links */}
      <View className="mt-8">
        <T variant="sub">Quick access</T>
        <View className="flex-row flex-wrap gap-3 mt-3">
          {[
            { label: 'Auction', href: '/auction', icon: 'trophy-outline' },
            { label: 'Dining', href: '/dining', icon: 'restaurant-outline' },
            { label: 'Connections', href: '/connections', icon: 'people-outline' },
            { label: 'Speakers', href: '/speakers', icon: 'mic-outline' },
          ].map((q) => (
            <Pressable
              key={q.href}
              onPress={() => router.push(q.href as any)}
              className="bg-snow/5 border border-snow/10 rounded-card px-4 py-3 flex-row items-center"
            >
              <Ionicons name={q.icon as any} size={18} color="#D17F5D" />
              <T variant="small" className="ml-2 text-snow">{q.label}</T>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
