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
import { IS_DEMO, demoQuestions } from '@/lib/demo';
import * as Haptics from 'expo-haptics';

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
      if (IS_DEMO) return demoQuestions;
      // public_questions is a server-side view that masks authors of
      // anonymous questions — never join attendees directly here.
      let query = supabase
        .from('public_questions' as any)
        .select('id, body, anonymous, upvotes, author_name');
      if (params.session_id) query = query.eq('session_id', params.session_id);
      if (params.speaker_id) query = query.eq('speaker_id', params.speaker_id);
      const { data, error } = await query.order('upvotes', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: myUpvotes } = useQuery({
    queryKey: ['my-upvotes', me?.id],
    enabled: !!me?.id && !IS_DEMO,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_upvotes')
        .select('question_id')
        .eq('attendee_id', me!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.question_id));
    },
  });

  // Realtime — refresh when a question is approved or upvoted.
  useEffect(() => {
    if (!me?.event_id || IS_DEMO) return;
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setBody('');
      Alert.alert('Got it', "We've sent it to the moderators. It'll show up here once approved.");
      qc.invalidateQueries({ queryKey: ['questions', me?.event_id] });
    },
    onError: (e: any) => Alert.alert("Couldn't submit", e?.message ?? 'Try again.'),
  });

  const upvote = useMutation({
    mutationFn: async (questionId: string) => {
      if (!me) return;
      // Toggle: second tap removes the upvote.
      if (myUpvotes?.has(questionId)) {
        const { error } = await supabase
          .from('question_upvotes')
          .delete()
          .eq('question_id', questionId)
          .eq('attendee_id', me.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_upvotes')
          .insert({ question_id: questionId, attendee_id: me.id });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', me?.event_id] });
      qc.invalidateQueries({ queryKey: ['my-upvotes', me?.id] });
    },
  });

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#04072F" />
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
          placeholderTextColor="#8B8EA6"
          className="bg-surface border border-line rounded-card px-4 py-4 text-ink font-body text-body min-h-32"
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
                <T variant="caption" className="normal-case tracking-normal text-ink-faint">
                  {q.anonymous ? 'Anonymous' : q.author_name ?? q.attendee?.name ?? 'Attendee'}
                </T>
                <Pressable
                  onPress={() => upvote.mutate(q.id)}
                  className={`flex-row items-center rounded-pill px-3 py-1 ${myUpvotes?.has(q.id) ? 'bg-cta' : 'bg-surface'}`}
                >
                  <Ionicons name="arrow-up" size={14} color={myUpvotes?.has(q.id) ? '#FFFFFF' : '#D17F5D'} />
                  <T variant="small" className={`ml-1 ${myUpvotes?.has(q.id) ? 'text-snow' : 'text-ink'}`}>{q.upvotes}</T>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
