import { View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { tokenFromQr } from '@/lib/qr';
import { colors } from '@/lib/theme';
import { IS_DEMO, demoOtherAttendees } from '@/lib/demo';

/**
 * Where a badge QR lands when a phone's own camera scans it (lib/qr.ts).
 *
 * Opening the link never connects anyone by itself — a link can be sent to
 * someone who never scanned anything — so connecting takes a tap. Door
 * check-in by staff arrives in Sprint 14 and branches from here.
 */

type Holder = { id: string; name: string; role: string | null; company: string | null; photo_url: string | null };

export default function BadgeLink() {
  const params = useLocalSearchParams<{ token: string }>();
  const token = tokenFromQr(String(params.token ?? ''));
  const session = useAppStore((s) => s.session);
  const me = useAppStore((s) => s.attendee);

  const { data: holder, isLoading } = useQuery<Holder | null>({
    queryKey: ['badge-holder', token],
    enabled: !!token && !!me,
    queryFn: async () => {
      if (IS_DEMO) return { ...demoOtherAttendees[0] };
      // RLS returns the holder only if they are at the same event and visible.
      const { data, error } = await supabase
        .from('attendees')
        .select('id, name, role, company, photo_url')
        .eq('qr_token', token!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const connect = useMutation({
    mutationFn: async () => {
      if (IS_DEMO || !me || !token) return;
      const { error } = await supabase.functions.invoke('qr-connect', {
        body: { scanner_id: me.id, scanned_qr_token: token },
      });
      if (error) throw error;
    },
    onSuccess: () => router.replace('/connections'),
  });

  let title = 'REGROWTH event badge';
  let body = 'Sign in to the REGROWTH app to connect with the person wearing this badge.';
  if (!token) {
    title = 'Not a REGROWTH badge';
    body = 'This link does not belong to a REGROWTH event badge.';
  } else if (me && !isLoading && !holder) {
    body = 'This badge belongs to someone at a different event, or to someone who keeps their profile private.';
  } else if (holder) {
    title = holder.name;
    body = [holder.role, holder.company].filter(Boolean).join(' | ');
  }

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />
      <View className="px-5 pt-2">
        <ScreenHeader title="Scanned badge" subtitle="Connect with fellow attendees" />
      </View>

      <View className="mx-5 mt-6 items-center gap-y-3 rounded-card border border-card-line bg-well p-6">
        {holder?.photo_url ? (
          <Image source={{ uri: holder.photo_url }} className="h-16 w-16 rounded-pill" accessibilityIgnoresInvertColors />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-pill bg-glass">
            <Ionicons name={token ? 'person' : 'alert'} size={28} color={colors.snow} />
          </View>
        )}
        <Text className="text-center font-data text-[18px] font-bold text-snow">{title}</Text>
        {!!body && <Text className="text-center font-data text-[13px] text-quiet">{body}</Text>}

        {holder && holder.id !== me?.id && (
          <Pressable
            onPress={() => connect.mutate()}
            disabled={connect.isPending}
            className="mt-2 w-full items-center rounded-cta bg-ocean py-3"
          >
            <Text className="font-data text-[13px] font-semibold text-snow">
              {connect.isPending ? 'Connecting…' : 'Connect'}
            </Text>
          </Pressable>
        )}
        {connect.isError && (
          <Text className="text-center font-data text-[12px] text-quiet">
            That did not work. Try again, or scan from Connections.
          </Text>
        )}
        {!session && token && (
          <Pressable
            onPress={() => router.replace('/(auth)/welcome')}
            className="mt-2 w-full items-center rounded-cta bg-ocean py-3"
          >
            <Text className="font-data text-[13px] font-semibold text-snow">Sign in</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
