import { useEffect, useState } from 'react';
import { View, Pressable, TextInput, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { NotificationCategory } from '@/types/database';

const CATEGORIES: { key: NotificationCategory; label: string; description: string }[] = [
  { key: 'session_starting', label: 'Sessions starting', description: 'When something on your schedule is 15 mins away.' },
  { key: 'dont_miss', label: "Don't miss this", description: 'When concurrent sessions are coming and you haven\'t picked one.' },
  { key: 'people_to_meet', label: 'People to meet', description: 'A daily nudge with someone we think you\'d enjoy meeting.' },
  { key: 'partner_spotlight', label: 'Partner spotlight', description: 'One or two a day, max.' },
  { key: 'auction', label: 'Auction', description: 'Only if you\'ve been outbid.' },
];

export default function Profile() {
  const me = useAppStore((s) => s.attendee);
  const setAttendee = useAppStore((s) => s.setAttendee);
  const [name, setName] = useState(me?.name ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [interests, setInterests] = useState((me?.interests ?? []).join(', '));
  const [prefs, setPrefs] = useState(me?.notification_prefs ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(me?.name ?? '');
    setBio(me?.bio ?? '');
    setInterests((me?.interests ?? []).join(', '));
    setPrefs(me?.notification_prefs ?? {});
  }, [me]);

  async function save() {
    if (!me) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('attendees')
        .update({
          name,
          bio,
          interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
          notification_prefs: prefs,
        })
        .eq('id', me.id)
        .select()
        .single();
      if (error) throw error;
      setAttendee(data);
      Alert.alert('Saved');
    } catch (e: any) {
      Alert.alert('Hmm', e?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!me) return null;

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">My profile</T>
      </View>
      <T variant="h1" className="mt-2">Your details</T>

      <View className="mt-6 gap-y-4">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="About" value={bio} onChange={setBio} multiline />
        <Field label="Interests (comma-separated)" value={interests} onChange={setInterests} />
      </View>

      <View className="mt-8">
        <T variant="sub">Notifications</T>
        <Card className="mt-3">
          {CATEGORIES.map((c, idx) => (
            <View
              key={c.key}
              className={`flex-row items-start py-3 ${idx > 0 ? 'border-t border-snow/10' : ''}`}
            >
              <View className="flex-1 pr-4">
                <T variant="body">{c.label}</T>
                <T variant="small" className="mt-1">{c.description}</T>
              </View>
              <Switch
                value={prefs[c.key] !== false}
                onValueChange={(v) => setPrefs((p) => ({ ...p, [c.key]: v }))}
                trackColor={{ true: '#D17F5D', false: '#3a3d5c' }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </Card>
        <T variant="caption" className="mt-3 normal-case tracking-normal text-cloud/70">
          Admin announcements always come through — they're how we tell you about
          surprises and room changes.
        </T>
      </View>

      <View className="mt-8">
        <Button label="Save" loading={saving} onPress={save} />
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View>
      <T variant="caption" className="mb-2">{label}</T>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor="#8A8DA6"
        className={`bg-snow/5 border border-snow/15 rounded-card px-4 py-4 text-snow font-body text-body ${multiline ? 'min-h-24' : ''}`}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
