import { useEffect, useState } from 'react';
import { View, Pressable, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

// Quick note capture during a live session. Auto-saves on every change so we
// never lose what someone wrote if the app backgrounds.
export default function NewNote() {
  const { session_id } = useLocalSearchParams<{ session_id?: string }>();
  const me = useAppStore((s) => s.attendee);
  const [body, setBody] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);

  // Resolve or create the note as soon as we mount.
  useEffect(() => {
    (async () => {
      if (!me || !session_id) return;
      const { data: existing } = await supabase
        .from('notes')
        .select('id, body, session:sessions(title)')
        .eq('attendee_id', me.id)
        .eq('session_id', session_id)
        .maybeSingle();
      if (existing) {
        setNoteId(existing.id);
        setBody(existing.body ?? '');
        setSessionTitle((existing as any).session?.title ?? null);
      } else {
        const { data: created, error } = await supabase
          .from('notes')
          .insert({ attendee_id: me.id, session_id })
          .select('id, session:sessions(title)')
          .single();
        if (error) Alert.alert('Hmm', error.message);
        else {
          setNoteId(created!.id);
          setSessionTitle((created as any).session?.title ?? null);
        }
      }
    })();
  }, [me, session_id]);

  // Debounced autosave.
  useEffect(() => {
    if (!noteId) return;
    const t = setTimeout(() => {
      supabase.from('notes').update({ body }).eq('id', noteId);
    }, 500);
    return () => clearTimeout(t);
  }, [body, noteId]);

  async function summarise() {
    if (!noteId) return;
    const { error } = await supabase.functions.invoke('claude-summarise-notes', {
      body: { note_id: noteId },
    });
    if (error) Alert.alert('Summary unavailable', error.message);
    else router.replace(`/notes/${noteId}`);
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption">Notes saved automatically</T>
      </View>

      {sessionTitle && <T variant="caption" className="text-earth normal-case tracking-normal mt-4">{sessionTitle}</T>}
      <T variant="h2" className="mt-2">Capture as you go</T>

      <View className="mt-4 flex-1">
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="What's resonating? What will you act on?"
          placeholderTextColor="#8A8DA6"
          className="bg-snow/5 border border-snow/15 rounded-card px-4 py-4 text-snow font-body text-body min-h-64"
          textAlignVertical="top"
          autoFocus
        />
      </View>

      <View className="mt-6">
        <Button label="Generate summary" variant="secondary" onPress={summarise} />
      </View>
    </Screen>
  );
}
