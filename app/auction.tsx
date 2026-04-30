import { useEffect, useState } from 'react';
import { View, Image, Pressable, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoAuction } from '@/lib/demo';

export default function Auction() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const meId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();
  const [bids, setBids] = useState<Record<string, string>>({});

  const { data: items } = useQuery({
    queryKey: ['auction', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (IS_DEMO) return demoAuction;
      const { data, error } = await supabase
        .from('auction_items')
        .select('*')
        .eq('event_id', eventId!)
        .eq('is_open', true)
        .order('ends_at');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime — refresh on any bid update.
  useEffect(() => {
    if (!eventId || IS_DEMO) return;
    const channel = supabase
      .channel(`auction:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_items' }, () => {
        qc.invalidateQueries({ queryKey: ['auction', eventId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, qc]);

  const placeBid = useMutation({
    mutationFn: async ({ itemId, amount }: { itemId: string; amount: number }) => {
      if (!meId) return;
      const { error } = await supabase.from('bids').insert({
        item_id: itemId,
        attendee_id: meId,
        amount,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auction', eventId] }),
    onError: (e: any) => Alert.alert("That didn't go through", e?.message ?? 'Try again.'),
  });

  function confirmBid(itemId: string, current: number, starting: number) {
    const raw = bids[itemId];
    const amount = Number(raw);
    const min = (current ?? starting) + 1;
    if (!Number.isFinite(amount) || amount < min) {
      Alert.alert('Bid a little higher', `The next valid bid is $${min}.`);
      return;
    }
    Alert.alert('Confirm bid', `Place a $${amount} bid?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Bid', onPress: () => placeBid.mutate({ itemId, amount }) },
    ]);
  }

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">Charity Auction</T>
      </View>
      <T variant="h1" className="mt-2">Bid for good</T>
      <T variant="body" className="mt-2 text-cloud/80">
        Every dollar goes to the cause we're supporting this year.
      </T>

      <View className="mt-6 gap-y-4">
        {items?.map((item) => (
          <Card key={item.id}>
            {item.photo_url && (
              <Image source={{ uri: item.photo_url }} className="w-full h-40 rounded-card mb-3" />
            )}
            <T variant="h3">{item.name}</T>
            {item.description && <T variant="body" className="mt-1 text-cloud/80">{item.description}</T>}

            <View className="flex-row mt-4 items-end">
              <View className="flex-1">
                <T variant="caption">Current bid</T>
                <T variant="h2" className="text-earth">
                  ${(item.current_bid ?? item.starting_bid).toFixed(0)}
                </T>
                <T variant="caption" className="normal-case tracking-normal">
                  Closes {new Date(item.ends_at).toLocaleString()}
                </T>
              </View>
            </View>

            <View className="flex-row gap-2 mt-3">
              <TextInput
                value={bids[item.id] ?? ''}
                onChangeText={(v) => setBids((b) => ({ ...b, [item.id]: v }))}
                keyboardType="numeric"
                placeholder={`$${(item.current_bid ?? item.starting_bid) + 1}`}
                placeholderTextColor="#8A8DA6"
                className="flex-1 bg-snow/5 border border-snow/15 rounded-pill px-4 py-3 text-snow font-body text-body"
              />
              <View>
                <Button
                  label="Bid"
                  fullWidth={false}
                  onPress={() => confirmBid(item.id, item.current_bid ?? 0, item.starting_bid)}
                />
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
