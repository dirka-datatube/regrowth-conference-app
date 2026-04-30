import { View, Pressable, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['note', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*, session:sessions(title, start_at, room)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!data) return null;
  const session = (data as any).session;

  function share() {
    Share.share({
      message: [
        session?.title ?? 'Session notes',
        '',
        data!.body,
        data!.ai_summary ? `\nSummary:\n${data!.ai_summary}` : '',
      ].join('\n'),
    });
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={share} hitSlop={10}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {session && (
        <T variant="caption" className="text-earth normal-case tracking-normal mt-4">
          {session.title}
        </T>
      )}
      <T variant="h2" className="mt-2">Your notes</T>

      <Card className="mt-4">
        <T variant="body">{data.body || '(no notes yet)'}</T>
      </Card>

      {data.ai_summary && (
        <View className="mt-6">
          <T variant="sub">AI summary</T>
          <Card className="mt-3" variant="earth">
            <T variant="body">{data.ai_summary}</T>
          </Card>
        </View>
      )}

      {data.follow_up_questions?.length > 0 && (
        <View className="mt-6">
          <T variant="sub">Follow-up questions</T>
          <Card className="mt-3">
            {data.follow_up_questions.map((q, i) => (
              <T variant="body" key={i} className={i > 0 ? 'mt-2' : ''}>• {q}</T>
            ))}
          </Card>
        </View>
      )}

      <View className="mt-8">
        <Button
          label="Edit notes"
          variant="ghost"
          onPress={() => router.push({ pathname: '/notes/new', params: { session_id: data.session_id } })}
        />
      </View>
    </Screen>
  );
}
