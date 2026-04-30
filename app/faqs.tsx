import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoFaqs } from '@/lib/demo';

export default function Faqs() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const [open, setOpen] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['faqs', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (IS_DEMO) return demoFaqs;
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('event_id', eventId!)
        .order('order_index');
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">FAQs</T>
      </View>
      <T variant="h1" className="mt-2">Good to know</T>

      <View className="mt-6">
        {data?.map((f) => {
          const isOpen = open === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setOpen(isOpen ? null : f.id)}
              className="border-b border-snow/10 py-4"
            >
              <View className="flex-row items-center justify-between">
                <T variant="h3" className="flex-1 pr-4">{f.question}</T>
                <Ionicons
                  name={isOpen ? 'remove' : 'add'}
                  size={22}
                  color="#D17F5D"
                />
              </View>
              {isOpen && <T variant="body" className="mt-3 text-cloud/80">{f.answer}</T>}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
