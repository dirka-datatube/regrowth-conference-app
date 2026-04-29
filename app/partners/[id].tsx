import { View, Image, Pressable, Linking, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function PartnerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();

  const { data: partner } = useQuery({
    queryKey: ['partner', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('partners').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: alreadyInterested } = useQuery({
    queryKey: ['partner-interest', id, attendeeId],
    enabled: !!id && !!attendeeId,
    queryFn: async () => {
      const { count } = await supabase
        .from('partner_interest')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', id!)
        .eq('attendee_id', attendeeId!);
      return (count ?? 0) > 0;
    },
  });

  const expressInterest = useMutation({
    mutationFn: async () => {
      if (!attendeeId || !id) return;
      const { error } = await supabase.from('partner_interest').insert({
        partner_id: id,
        attendee_id: attendeeId,
      });
      if (error) throw error;

      // Fire AC event so the partner gets the lead via their automation.
      await supabase.functions.invoke('ac-event-emit', {
        body: {
          attendee_id: attendeeId,
          event_name: 'partner_interest',
          event_data: { partner_id: id, partner_name: partner?.name },
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-interest', id, attendeeId] });
      Alert.alert(
        "We've passed it on",
        `${partner?.name} will be in touch soon. We've added them to your connections too.`,
      );
    },
    onError: (e: any) => Alert.alert('Hmm', e?.message ?? 'Try again in a moment.'),
  });

  if (!partner) return null;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} className="pt-2">
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
      </Pressable>

      {partner.logo_url && (
        <View className="bg-cloud rounded-card mt-4 p-6 items-center">
          <Image source={{ uri: partner.logo_url }} className="w-40 h-24" resizeMode="contain" />
        </View>
      )}

      <View className="mt-6">
        <T variant="h1">{partner.name}</T>
        {partner.description && (
          <T variant="body" className="mt-3 text-cloud/90">{partner.description}</T>
        )}
      </View>

      {partner.solutions_content && (
        <View className="mt-6">
          <T variant="sub">Solutions for your business</T>
          <T variant="body" className="mt-2 text-cloud/90">{partner.solutions_content}</T>
        </View>
      )}

      <View className="mt-8 gap-y-3">
        <Button
          label={alreadyInterested ? "We've shared your details" : "I'm interested"}
          disabled={alreadyInterested}
          loading={expressInterest.isPending}
          onPress={() => expressInterest.mutate()}
        />
        {partner.website_url && (
          <Button
            label="Visit website"
            variant="ghost"
            onPress={() => Linking.openURL(partner.website_url!)}
          />
        )}
      </View>
    </Screen>
  );
}
