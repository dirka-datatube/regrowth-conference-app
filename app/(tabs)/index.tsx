import { useState } from 'react';
import { View, RefreshControl, Pressable, Image, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Monogram } from '@/components/Monogram';
import { CardSkeleton } from '@/components/Skeleton';
import { useAppStore } from '@/lib/store';
import { useHappeningNow, useUpNext, useMyUpcoming } from '@/lib/hooks/useSessions';
import { useSuggestions } from '@/lib/hooks/useSuggestions';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { IS_DEMO } from '@/lib/demo';

function timeShort(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function Home() {
  const attendee = useAppStore((s) => s.attendee);
  const happening = useHappeningNow();
  const upNext = useUpNext();
  const myDay = useMyUpcoming();
  const suggestions = useSuggestions();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  }

  async function checkIn() {
    if (IS_DEMO) {
      Alert.alert("You're here", 'Welcome to REGROWTH 2026. (Demo mode)');
      return;
    }
    setCheckingIn(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-in', {
        body: { source: 'self' },
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        data?.already ? 'Already checked in' : "You're here",
        data?.already
          ? "We've got you marked in for today. Enjoy it."
          : "Welcome to REGROWTH 2026 — we're glad you made it.",
      );
    } catch (e: any) {
      Alert.alert('Hmm', e?.message ?? 'Try again in a moment.');
    } finally {
      setCheckingIn(false);
    }
  }

  const firstName = (attendee?.name ?? '').split(' ')[0] || 'there';
  const loading = happening.isLoading && !happening.data;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#B85F3D" />}
    >
      {/* Header: wordmark + bell + avatar */}
      <View className="flex-row items-center justify-between pt-2">
        <T variant="caption">REGROWTH®</T>
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.push('/alerts')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Alerts"
          >
            <Ionicons name="notifications-outline" size={24} color="#04072F" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/profile')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="My profile"
          >
            {attendee?.photo_url ? (
              <Image source={{ uri: attendee.photo_url }} className="w-8 h-8 rounded-full bg-surface-alt" />
            ) : (
              <Monogram size={30} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Greeting */}
      <View className="mt-6">
        <T variant="hero">Welcome, {firstName}</T>
        <T variant="script" className="mt-1">we're glad to see you.</T>
      </View>

      {/* Check-in chip */}
      <Pressable
        onPress={checkIn}
        disabled={checkingIn}
        accessibilityRole="button"
        accessibilityLabel="Check in — I'm here"
        className={`mt-5 bg-cta rounded-pill px-5 py-3 flex-row items-center self-start ${checkingIn ? 'opacity-60' : 'active:opacity-85'}`}
      >
        <Ionicons name="location" size={16} color="#FFFFFF" />
        <T variant="small" className="ml-2 text-snow font-sub uppercase tracking-widest">
          {checkingIn ? 'Checking in…' : "I'm here — check in"}
        </T>
      </Pressable>

      {loading && (
        <View className="mt-8">
          <CardSkeleton />
          <CardSkeleton />
        </View>
      )}

      {/* Your day */}
      {(myDay.data?.length ?? 0) > 0 && (
        <View className="mt-8">
          <T variant="sub">Your day at a glance</T>
          <View className="mt-3 bg-surface border border-line rounded-card overflow-hidden">
            {myDay.data!.map((s: any, idx: number) => (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/session/${s.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${s.title} at ${timeShort(s.start_at)}`}
                className={`flex-row items-center px-4 py-3 active:bg-surface-alt ${idx > 0 ? 'border-t border-line' : ''}`}
              >
                <View className="w-16">
                  <T variant="small" className="text-cta-deep font-sub">{timeShort(s.start_at)}</T>
                </View>
                <View className="flex-1">
                  <T variant="body" className="text-ink" numberOfLines={1}>{s.title}</T>
                  {s.room && <T variant="caption" className="normal-case tracking-normal">{s.room}</T>}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8B8EA6" />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Happening now */}
      {(happening.data?.length ?? 0) > 0 && (
        <View className="mt-8">
          <T variant="sub">Happening now</T>
          {happening.data!.map((s: any) => (
            <Card key={s.id} variant="feature" className="mt-3" onPress={() => router.push(`/session/${s.id}`)}>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-cta mr-2" />
                <T variant="caption" className="text-cta-deep normal-case tracking-normal">
                  Live until {timeShort(s.end_at)}
                </T>
              </View>
              <T variant="h3" className="mt-2">{s.title}</T>
              {s.room && <T variant="small" className="mt-1">{s.room}</T>}
            </Card>
          ))}
        </View>
      )}

      {/* Up next */}
      <View className="mt-8">
        <T variant="sub">Up next</T>
        {upNext.data && upNext.data.length > 0 ? (
          upNext.data.map((s: any) => (
            <Card key={s.id} className="mt-3" onPress={() => router.push(`/session/${s.id}`)}>
              <T variant="caption" className="text-cta-deep normal-case tracking-normal">
                {timeShort(s.start_at)}{s.room ? ` · ${s.room}` : ''}
              </T>
              <T variant="h3" className="mt-1">{s.title}</T>
              {upNext.data!.length > 1 && (
                <T variant="caption" className="mt-2 text-cta-deep normal-case tracking-normal">
                  Two sessions coming up — pick the one for you.
                </T>
              )}
            </Card>
          ))
        ) : (
          <Card className="mt-3">
            <T variant="body">
              Nothing on in the next half hour. A good moment to meet someone new below.
            </T>
          </Card>
        )}
      </View>

      {/* People to meet — horizontal carousel */}
      {(suggestions.data?.attendees?.length ?? 0) > 0 && (
        <View className="mt-8">
          <T variant="sub">People you should meet today</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-5 px-5">
            {suggestions.data!.attendees.map((p: any) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/attendees/${p.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Meet ${p.name}`}
                className="bg-surface border border-line rounded-card p-4 mr-3 w-56 active:opacity-90"
              >
                {p.photo_url ? (
                  <Image source={{ uri: p.photo_url }} className="w-14 h-14 rounded-full bg-surface-alt" />
                ) : (
                  <Monogram size={56} />
                )}
                <T variant="h3" className="mt-3" numberOfLines={1}>{p.name}</T>
                <T variant="small" className="text-ink-faint" numberOfLines={1}>
                  {[p.role, p.company].filter(Boolean).join(' · ')}
                </T>
                {suggestions.data?.rationale[p.id] && (
                  <T variant="small" className="mt-2 text-cta-deep" numberOfLines={2}>
                    {suggestions.data.rationale[p.id]}
                  </T>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Partner spotlight */}
      {(suggestions.data?.partners?.length ?? 0) > 0 && (
        <View className="mt-8">
          <T variant="sub">Partners worth a look</T>
          <View className="mt-3 gap-y-3">
            {suggestions.data!.partners.map((p: any) => (
              <Card key={p.id} onPress={() => router.push(`/partners/${p.id}`)}>
                <T variant="h3">{p.name}</T>
                {p.description && (
                  <T variant="body" className="mt-1" numberOfLines={2}>{p.description}</T>
                )}
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* Quick access */}
      <View className="mt-8">
        <T variant="sub">Quick access</T>
        <View className="flex-row flex-wrap gap-3 mt-3">
          {[
            { label: 'Auction', href: '/auction', icon: 'trophy-outline' },
            { label: 'Dining', href: '/dining', icon: 'restaurant-outline' },
            { label: 'My notes', href: '/notes', icon: 'document-text-outline' },
            { label: 'Ask a question', href: '/questions', icon: 'chatbubble-ellipses-outline' },
          ].map((q) => (
            <Pressable
              key={q.href}
              onPress={() => router.push(q.href as any)}
              accessibilityRole="button"
              accessibilityLabel={q.label}
              className="bg-surface border border-line rounded-card px-4 py-3 flex-row items-center active:bg-surface-alt"
            >
              <Ionicons name={q.icon as any} size={18} color="#B85F3D" />
              <T variant="small" className="ml-2 text-ink">{q.label}</T>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
