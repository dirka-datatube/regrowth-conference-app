import { useEffect, useState } from 'react';
import { View, Pressable, TextInput, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function Questions() {
  const params = useLocalSearchParams<{ session_id?: string; speaker_id?: string }>();
  const me = useAppStore((s) => s.attendee);
  const qc = useQueryClient();

  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const { data: questions } = useQuery({
    queryKey: ['questions', me?.event_id, params.session_id, params.speaker_id],
    enabled: !!me?.event_id,
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select('id, body, anonymous, upvotes, status, attendee:attendees(name)')
        .eq('event_id', me!.event_id)
        .eq('status', 'approved');
      if (params.session_id) query = query.eq('session_id', params.session_id);
      if (params.speaker_id) query = query.eq('speaker_id', params.speaker_id);
      const { data, error } = await query.order('upvotes', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime — refresh when a question is approved or upvoted.
  useEffect(() => {
    if (!me?.event_id) return;
    const channel = supabase
      .channel(`questions:${me.event_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        qc.invalidateQueries({ queryKey: ['questions', me.event_id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me?.event_id, qc]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!me) return;
      const { error } = await supabase.from('questions').insert({
        event_id: me.event_id,
        attendee_id: me.id,
        session_id: params.session_id ?? null,
        speaker_id: params.speaker_id ?? null,
        body: body.trim(),
        anonymous,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody('');
      Alert.alert('Got it', "We've sent it to the moderators. It'll show up here once approved.");
      qc.invalidateQueries({ queryKey: ['questions', me?.event_id] });
    },
    onError: (e: any) => Alert.alert("Couldn't submit", e?.message ?? 'Try again.'),
  });

  const upvote = useMutation({
    mutationFn: async (questionId: string) => {
      if (!me) return;
      const { error } = await supabase
        .from('question_upvotes')
        .insert({ question_id: questionId, attendee_id: me.id });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions', me?.event_id] }),
  });

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">Submit a question</T>
      </View>
      <T variant="h1" className="mt-2">Ask anything</T>

      <View className="mt-6">
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="What would you like to ask?"
          placeholderTextColor="#8A8DA6"
          className="bg-snow/5 border border-snow/15 rounded-card px-4 py-4 text-snow font-body text-body min-h-32"
          textAlignVertical="top"
        />

        <View className="flex-row items-center mt-3">
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ true: '#D17F5D', false: '#3a3d5c' }}
            thumbColor="#FFFFFF"
          />
          <T variant="small" className="ml-3">Submit anonymously</T>
        </View>

        <View className="mt-4">
          <Button
            label="Submit question"
            disabled={body.trim().length < 5}
            loading={submit.isPending}
            onPress={() => submit.mutate()}
          />
        </View>
      </View>

      <View className="mt-10">
        <T variant="sub">Top questions</T>
        <View className="mt-3 gap-y-2">
          {questions?.map((q: any) => (
            <Card key={q.id}>
              <T variant="body">{q.body}</T>
              <View className="flex-row items-center justify-between mt-3">
                <T variant="caption" className="normal-case tracking-normal text-cloud/70">
                  {q.anonymous ? 'Anonymous' : q.attendee?.name ?? 'Attendee'}
                </T>
                <Pressable
                  onPress={() => upvote.mutate(q.id)}
                  className="flex-row items-center bg-snow/5 rounded-pill px-3 py-1"
                >
                  <Ionicons name="arrow-up" size={14} color="#D17F5D" />
                  <T variant="small" className="ml-1 text-snow">{q.upvotes}</T>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
