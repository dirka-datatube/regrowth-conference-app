import { useState } from 'react';
import { View, Pressable, Alert, Switch, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { Photo } from '@/components/Photo';
import { Monogram } from '@/components/Monogram';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { INTEREST_TAXONOMY } from '@/lib/interests';
import type { AttendeeVisibility } from '@/types/database';

// Three steps, under a minute, skippable. We never re-ask what we already
// know — name/email/dietary come pre-filled from registration.
export default function Onboarding() {
  const me = useAppStore((s) => s.attendee);
  const setAttendee = useAppStore((s) => s.setAttendee);
  const setOnboardingSeen = useAppStore((s) => s.setOnboardingSeen);
  const [step, setStep] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(me?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [interests, setInterests] = useState<string[]>(me?.interests ?? []);
  const [visibility, setVisibility] = useState<AttendeeVisibility>(me?.visibility ?? 'public');
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    (me?.notification_prefs as Record<string, boolean>) ?? {},
  );
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    if (!me) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (res.canceled || !res.assets[0]?.base64) return;
    setUploading(true);
    try {
      const bytes = Uint8Array.from(atob(res.assets[0].base64), (c) => c.charCodeAt(0));
      const path = `${me.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('headshots')
        .upload(path, bytes.buffer, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('headshots').getPublicUrl(path);
      // Cache-bust so the fresh avatar shows immediately.
      setPhotoUrl(`${data.publicUrl}?v=${Date.now()}`);
    } catch (e: any) {
      Alert.alert("That didn't upload", e?.message ?? 'Try a different photo.');
    } finally {
      setUploading(false);
    }
  }

  function toggleInterest(tag: string) {
    setInterests((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    );
  }

  async function finish() {
    if (!me) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('attendees')
        .update({
          photo_url: photoUrl,
          interests,
          visibility,
          notification_prefs: prefs,
        })
        .eq('id', me.id)
        .select()
        .single();
      if (error) throw error;
      setAttendee(data);
      setOnboardingSeen(true);
      supabase.functions
        .invoke('ac-event-emit', { body: { event_name: 'onboarding_complete' } })
        .catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Hmm', e?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    setOnboardingSeen(true);
    router.replace('/(tabs)');
  }

  const firstName = (me?.name ?? '').split(' ')[0];

  return (
    <Screen scroll={false}>
      <View className="flex-1 pt-6">
        {/* Progress + skip */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-1.5">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className={`h-1.5 rounded-pill ${i <= step ? 'bg-cta w-8' : 'bg-line w-4'}`}
              />
            ))}
          </View>
          <Pressable onPress={skip} hitSlop={10} accessibilityRole="button" accessibilityLabel="Skip for now">
            <T variant="caption">Skip for now</T>
          </Pressable>
        </View>

        {step === 0 && (
          <View className="flex-1 pt-10">
            <T variant="script">Hello {firstName},</T>
            <T variant="h1" className="mt-2">Let's make this week yours</T>
            <T variant="body" className="mt-3">
              A photo helps the people you meet remember you — and helps us
              introduce you well.
            </T>
            <View className="items-center mt-10">
              <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Add profile photo">
                {photoUrl ? (
                  <Photo uri={photoUrl} width={320} className="w-40 h-40 rounded-full bg-surface-alt" />
                ) : (
                  <View className="w-40 h-40 rounded-full bg-surface border border-line items-center justify-center">
                    <Monogram size={56} />
                    <T variant="caption" className="mt-2">Add photo</T>
                  </View>
                )}
              </Pressable>
              {photoUrl && (
                <Pressable onPress={pickPhoto} className="mt-4" accessibilityRole="button" accessibilityLabel="Change photo">
                  <T variant="caption" className="text-cta-deep">Change photo</T>
                </Pressable>
              )}
            </View>
            <View className="flex-1" />
            <Button label={uploading ? 'Uploading…' : 'Continue'} loading={uploading} onPress={() => setStep(1)} />
          </View>
        )}

        {step === 1 && (
          <View className="flex-1 pt-10">
            <T variant="h1">What lights you up?</T>
            <T variant="body" className="mt-3">
              Pick three or more — we'll use them to suggest the right people
              and partners all week.
            </T>
            <ScrollView className="mt-6 flex-1" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2 pb-6">
                {INTEREST_TAXONOMY.map((tag) => {
                  const on = interests.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleInterest(tag)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={tag}
                      className={`rounded-pill px-4 py-2 ${on ? 'bg-cta' : 'bg-surface border border-line'}`}
                    >
                      <T variant="small" className={on ? 'text-snow' : 'text-ink'}>{tag}</T>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Button
              label={interests.length >= 3 ? 'Continue' : `Pick ${3 - interests.length} more`}
              disabled={interests.length < 3}
              onPress={() => setStep(2)}
            />
          </View>
        )}

        {step === 2 && (
          <View className="flex-1 pt-10">
            <T variant="h1">Your comfort, your call</T>

            <View className="mt-6 bg-surface border border-line rounded-card p-4">
              <T variant="sub">Directory visibility</T>
              {(
                [
                  ['public', 'Everyone at the event can find me'],
                  ['connections_only', 'Only people I connect with see my details'],
                  ['hidden', 'Keep me out of the directory'],
                ] as [AttendeeVisibility, string][]
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  onPress={() => setVisibility(value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: visibility === value }}
                  className="flex-row items-center py-3"
                >
                  <Ionicons
                    name={visibility === value ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={visibility === value ? '#B85F3D' : '#8B8EA6'}
                  />
                  <T variant="body" className="ml-3 flex-1">{label}</T>
                </Pressable>
              ))}
            </View>

            <View className="mt-4 bg-surface border border-line rounded-card p-4">
              <T variant="sub">Notifications</T>
              <T variant="small" className="mt-1 text-ink-faint">
                Never more than four a day — we promise. Fine-tune categories
                any time in your profile.
              </T>
              <View className="flex-row items-center justify-between mt-3">
                <T variant="body">Session reminders</T>
                <Switch
                  value={prefs.session_starting !== false}
                  onValueChange={(v) => setPrefs((p) => ({ ...p, session_starting: v }))}
                  trackColor={{ true: '#D17F5D', false: '#E5E2D9' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <T variant="body">People to meet</T>
                <Switch
                  value={prefs.people_to_meet !== false}
                  onValueChange={(v) => setPrefs((p) => ({ ...p, people_to_meet: v }))}
                  trackColor={{ true: '#D17F5D', false: '#E5E2D9' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View className="flex-1" />
            <Button label="You're all set" loading={saving} onPress={finish} />
          </View>
        )}
      </View>
    </Screen>
  );
}
