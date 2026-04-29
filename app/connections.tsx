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
import { QrModal } from '@/components/QrModal';
import { ScannerModal } from '@/components/ScannerModal';

export default function Connections() {
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

  const handleScan = useMutation({
    mutationFn: async (qrToken: string) => {
      if (!me) return;
      const { data, error } = await supabase.functions.invoke('qr-connect', {
        body: { scanner_id: me.id, scanned_qr_token: qrToken },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (res: any) => {
      setShowScanner(false);
      qc.invalidateQueries({ queryKey: ['my-connections', me?.id] });
      Alert.alert(
        res?.already ? 'Already connected' : 'Connected',
        'They\'re now in your contacts. Have a great conversation.',
      );
    },
    onError: (e: any) => Alert.alert("That didn't scan", e?.message ?? 'Try again.'),
  });

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">Connection Hub</T>
      </View>
      <T variant="h1" className="mt-2">Your people</T>

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

      <View className="mt-8">
        <T variant="sub">Connections</T>
        <View className="mt-3 gap-y-2">
          {connections?.length ? (
            connections.map((c) => (
              <Card key={c.id} onPress={() => router.push(`/attendees/${c.other.id}`)}>
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <T variant="h3">{c.other.name}</T>
                    <T variant="small">{[c.other.role, c.other.company].filter(Boolean).join(' · ')}</T>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${c.other.email}`)}
                    hitSlop={10}
                    className="bg-snow/5 rounded-pill px-3 py-2"
                  >
                    <Ionicons name="mail" size={16} color="#D17F5D" />
                  </Pressable>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <T variant="body" className="text-cloud/80">
                Scan someone's QR to start your contact list. Long-press your own to share.
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
          onScanned={(token) => handleScan.mutate(token)}
        />
      )}
    </Screen>
  );
}
