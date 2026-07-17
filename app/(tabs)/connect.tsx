import { useState } from 'react';
import { View, Pressable, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import * as Haptics from 'expo-haptics';
import { QrModal } from '@/components/QrModal';
import { ScannerModal } from '@/components/ScannerModal';

export default function Connect() {
  const me = useAppStore((s) => s.attendee);
  const qc = useQueryClient();
  const [showQr, setShowQr] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { data: connections } = useQuery({
    queryKey: ['my-connections', me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connections')
        .select(
          `id, source, created_at,
           a:attendees!connections_attendee_a_fkey(id, name, role, company, photo_url, email),
           b:attendees!connections_attendee_b_fkey(id, name, role, company, photo_url, email)`,
        )
        .or(`attendee_a.eq.${me!.id},attendee_b.eq.${me!.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => {
        const other = row.a.id === me!.id ? row.b : row.a;
        return { id: row.id, source: row.source, created_at: row.created_at, other };
      });
    },
  });

  const { data: pendingCards } = useQuery({
    queryKey: ['pending-connections', me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_connections')
        .select('id, captured_name, captured_company, captured_email, captured_phone, resolved_attendee_id, created_at')
        .eq('initiator_id', me!.id)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleScan = useMutation({
    mutationFn: async (payload: string) => {
      if (!payload.startsWith('regrowth:')) {
        throw new Error("That's not a REGROWTH attendee code.");
      }
      const { data, error } = await supabase.functions.invoke('qr-connect', {
        body: { scanned_qr_token: payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (res: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowScanner(false);
      qc.invalidateQueries({ queryKey: ['my-connections', me?.id] });
      Alert.alert(
        res?.already ? 'Already connected' : 'Connected',
        `${res?.name ?? 'They'} ${res?.already ? 'is already in' : 'is now in'} your contacts. Have a great conversation.`,
      );
    },
    onError: (e: any) => {
      setShowScanner(false);
      Alert.alert("That didn't scan", e?.message ?? 'Try again.');
    },
  });

  return (
    <Screen>
      <View className="pt-2">
        <T variant="caption">Connect</T>
        <T variant="h1" className="mt-2">Your people</T>
        <T variant="body" className="mt-1 text-ink-soft">
          Swap details in seconds — scan, share, remember everyone.
        </T>
      </View>

      <View className="mt-4">
        <Button
          label="Browse all attendees"
          variant="ghost"
          onPress={() => router.push('/attendees')}
        />
      </View>

      <View className="flex-row gap-3 mt-6">
        <View className="flex-1">
          <Button label="Scan QR" onPress={() => setShowScanner(true)} />
        </View>
        <View className="flex-1">
          <Button label="My QR" variant="secondary" onPress={() => setShowQr(true)} />
        </View>
      </View>

      <View className="mt-4">
        <Button
          label="Capture a business card"
          variant="ghost"
          onPress={() => router.push('/connections/card')}
        />
      </View>

      {pendingCards && pendingCards.length > 0 && (
        <View className="mt-8">
          <T variant="sub">From business cards</T>
          <View className="mt-3 gap-y-2">
            {pendingCards.map((p: any) => (
              <Card key={p.id}>
                <T variant="h3">{p.captured_name ?? 'Unknown'}</T>
                <T variant="small">
                  {[p.captured_company, p.captured_email, p.captured_phone].filter(Boolean).join(' · ')}
                </T>
                {p.captured_email && (
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${p.captured_email}`)}
                    className="mt-3 bg-surface rounded-pill px-4 py-2 self-start flex-row items-center"
                  >
                    <Ionicons name="mail" size={14} color="#D17F5D" />
                    <T variant="small" className="ml-2 text-ink">Follow up</T>
                  </Pressable>
                )}
              </Card>
            ))}
          </View>
        </View>
      )}

      <View className="mt-8">
        <T variant="sub">Connections</T>
        <View className="mt-3 gap-y-2">
          {connections?.length ? (
            connections.map((c: any) => (
              <Card key={c.id} onPress={() => router.push(`/attendees/${c.other.id}`)}>
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <T variant="h3">{c.other.name}</T>
                    <T variant="small">{[c.other.role, c.other.company].filter(Boolean).join(' · ')}</T>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${c.other.email}`)}
                    hitSlop={10}
                    className="bg-surface rounded-pill px-3 py-2"
                  >
                    <Ionicons name="mail" size={16} color="#D17F5D" />
                  </Pressable>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <T variant="body" className="text-ink-soft">
                Scan someone's QR to start your contact list. Show yours with "My QR".
              </T>
            </Card>
          )}
        </View>
      </View>

      {showQr && me && (
        <QrModal
          token={me.qr_token}
          name={me.name}
          subtitle={[me.role, me.company].filter(Boolean).join(' · ')}
          onClose={() => setShowQr(false)}
        />
      )}
      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onScanned={(payload) => handleScan.mutate(payload)}
        />
      )}
    </Screen>
  );
}
