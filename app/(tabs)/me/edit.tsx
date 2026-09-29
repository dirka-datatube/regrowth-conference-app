import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { Avatar } from '@/components/Avatar';
import { FormField } from '@/components/profile/FormField';
import { SelectChip } from '@/components/profile/SelectChip';
import { CtaButton } from '@/components/profile/CtaButton';
import { pickPhoto, type PickedPhoto } from '@/components/profile/photo';
import { useSettingsPhotoUpload, useSettingsSaveProfile } from '@/lib/hooks/useSettings';
import { useAppStore, type AccountProfile } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import { colors } from '@/lib/theme';
import type { Attendee } from '@/types/database';

/**
 * Edit Profile — no frame in the file; opened from the profile card (145:1505)
 * and App Settings. Built in the v2 language of the sign-up form (34:767) and
 * the Profile screen; re-check when a frame exists.
 *
 * The attendee's photo, name, role, company, bio, interests and dietary needs.
 * They live on the registration (`attendees`, what other attendees see) and,
 * for the name, role, company and photo, on the account's profile too; both
 * are saved (lib/hooks/useSettings.ts). Registration details — event, email,
 * ticket, QR — are REGROWTH's and are never sent. An account without a
 * registration edits its profile only.
 */

const SUGGESTED_INTERESTS = [
  'leadership', 'coaching', 'sales', 'marketing', 'mindset', 'tech',
  'recruitment', 'culture', 'growth', 'property management',
];

const MAX_INTERESTS = 12;

type PhotoChange = { kind: 'keep' } | { kind: 'new'; photo: PickedPhoto } | { kind: 'remove' };

const label = (interest: string) => interest.charAt(0).toUpperCase() + interest.slice(1);
const orNull = (s: string) => s.trim() || null;

function splitName(name: string | null | undefined): [string, string] {
  const [first = '', ...rest] = (name ?? '').trim().split(/\s+/);
  return [first, rest.join(' ')];
}

function EditForm({ attendee, profile }: { attendee: Attendee | null; profile: AccountProfile | null }) {
  const [fallbackFirst, fallbackLast] = splitName(attendee?.name);
  const [first, setFirst] = useState(profile?.first_name ?? fallbackFirst);
  const [last, setLast] = useState(profile?.last_name ?? fallbackLast);
  const [role, setRole] = useState(attendee?.role ?? profile?.role ?? '');
  const [company, setCompany] = useState(attendee?.company ?? profile?.company ?? '');
  const [bio, setBio] = useState(attendee?.bio ?? '');
  const [dietary, setDietary] = useState(attendee?.dietary ?? '');
  const [interests, setInterests] = useState<string[]>(attendee?.interests ?? []);
  const [newInterest, setNewInterest] = useState('');
  const [photo, setPhoto] = useState<PhotoChange>({ kind: 'keep' });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const upload = useSettingsPhotoUpload();
  const save = useSettingsSaveProfile();
  const saving = upload.isPending || save.isPending;

  // A headshot is stored under the registration (see useSettingsPhotoUpload).
  const canChangePhoto = IS_DEMO || !!attendee;
  const currentPhoto = attendee?.photo_url ?? profile?.photo_url ?? null;
  const shownPhoto = photo.kind === 'new' ? photo.photo.uri : photo.kind === 'remove' ? null : currentPhoto;
  const fullName = [first.trim(), last.trim()].filter(Boolean).join(' ');

  const options = useMemo(
    () => [...interests, ...SUGGESTED_INTERESTS.filter((s) => !interests.includes(s))],
    [interests],
  );

  function toggleInterest(interest: string) {
    setInterests((list) =>
      list.includes(interest)
        ? list.filter((i) => i !== interest)
        : list.length < MAX_INTERESTS
          ? [...list, interest]
          : list,
    );
  }

  function addInterest() {
    const value = newInterest.trim().toLowerCase().slice(0, 30);
    setNewInterest('');
    if (value && !interests.includes(value) && interests.length < MAX_INTERESTS) setInterests([...interests, value]);
  }

  async function changePhoto() {
    setPhotoError(null);
    try {
      const picked = await pickPhoto({ source: 'library', maxSide: 800, square: true });
      if (picked) setPhoto({ kind: 'new', photo: picked });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'That photo could not be read. Try another.');
    }
  }

  async function submit() {
    setTried(true);
    setFailure(null);
    if (!first.trim()) return;

    let photoUrl: string | null | undefined;
    if (photo.kind === 'new') {
      try {
        photoUrl = await upload.uploadAsync(photo.photo);
      } catch {
        setFailure('We couldn’t upload your photo. Try again, or undo the new photo and save the rest.');
        return;
      }
    }
    if (photo.kind === 'remove') photoUrl = null;

    const shared = {
      role: orNull(role),
      company: orNull(company),
      ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
    };
    try {
      await save.saveAsync({
        attendee: attendee
          ? { name: fullName, bio: orNull(bio), interests, dietary: orNull(dietary), ...shared }
          : null,
        profile: { first_name: first.trim(), last_name: orNull(last), ...shared },
      });
    } catch {
      setFailure('We couldn’t save your changes. Check your connection and try again.');
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/me');
  }

  return (
    <>
      <Section>
        <View className="items-center gap-y-3">
          <Pressable
            onPress={canChangePhoto ? changePhoto : undefined}
            disabled={!canChangePhoto}
            accessibilityRole="button"
            accessibilityLabel={shownPhoto ? 'Change your photo' : 'Add a photo'}
          >
            {shownPhoto || fullName ? (
              <Avatar name={fullName} uri={shownPhoto} size={104} />
            ) : (
              <View className="h-[104px] w-[104px] items-center justify-center rounded-pill bg-glass">
                <Ionicons name="person" size={44} color={colors.snow} />
              </View>
            )}
            {canChangePhoto && (
              <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-pill border-2 border-midnight bg-ocean">
                <Ionicons name="camera" size={16} color={colors.snow} />
              </View>
            )}
          </Pressable>
          {canChangePhoto ? (
            <View className="flex-row items-center gap-x-2">
              <CtaButton label={shownPhoto ? 'Change Photo' : 'Add Photo'} tone="quiet" onPress={changePhoto} />
              {photo.kind !== 'keep' ? (
                <CtaButton label="Undo" tone="quiet" onPress={() => setPhoto({ kind: 'keep' })} />
              ) : (
                !!shownPhoto && <CtaButton label="Remove" tone="quiet" onPress={() => setPhoto({ kind: 'remove' })} />
              )}
            </View>
          ) : (
            <Text className="text-center font-data text-[12px] text-quiet">
              You can add a photo once you’re registered for an event.
            </Text>
          )}
          {!!photoError && <Text className="text-center font-data text-[12px] text-alert-action">{photoError}</Text>}
        </View>
      </Section>

      <Section className="gap-y-4">
        <SectionHeading title="About You" subtitle="How other attendees see you." />
        <View className="flex-row gap-x-3">
          <View className="flex-1">
            <FormField
              label="First name"
              value={first}
              onChangeText={setFirst}
              autoComplete="given-name"
              textContentType="givenName"
              maxLength={60}
              error={tried && !first.trim() ? 'Enter your first name' : null}
            />
          </View>
          <View className="flex-1">
            <FormField
              label="Last name"
              value={last}
              onChangeText={setLast}
              autoComplete="family-name"
              textContentType="familyName"
              maxLength={60}
            />
          </View>
        </View>
        <FormField label="Role" value={role} onChangeText={setRole} placeholder="e.g. Sales Director" maxLength={80} />
        <FormField label="Company" value={company} onChangeText={setCompany} placeholder="Your agency or business" maxLength={80} />
        {attendee || IS_DEMO ? (
          <FormField
            label="Bio"
            optional
            value={bio}
            onChangeText={setBio}
            placeholder="A line or two about you and what you’re working on."
            multiline
            maxLength={500}
            hint={`${bio.length}/500`}
          />
        ) : null}
      </Section>

      {(attendee || IS_DEMO) && (
        <Section className="gap-y-3">
          <SectionHeading title="Interests" subtitle="We use these to suggest people to meet." />
          <View className="flex-row flex-wrap gap-2">
            {options.map((interest) => (
              <SelectChip
                key={interest}
                label={label(interest)}
                selected={interests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
          <View className="flex-row items-center gap-x-2">
            <TextInput
              value={newInterest}
              onChangeText={setNewInterest}
              onSubmitEditing={addInterest}
              placeholder="Add your own"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              maxLength={30}
              accessibilityLabel="Add an interest"
              className="h-10 flex-1 rounded-cta border border-card-line bg-well px-3.5 font-data text-[14px] text-snow"
            />
            <CtaButton label="Add" icon="add" tone="outline" onPress={newInterest.trim() ? addInterest : undefined} />
          </View>
          {interests.length >= MAX_INTERESTS && (
            <Text className="font-data text-[12px] text-quiet">That’s the most you can choose — remove one to add another.</Text>
          )}
        </Section>
      )}

      {(attendee || IS_DEMO) && (
        <Section>
          <FormField
            label="Dietary requirements"
            optional
            value={dietary}
            onChangeText={setDietary}
            placeholder="e.g. Vegetarian, no nuts"
            maxLength={120}
            hint="Helps the REGROWTH team plan catering at your events."
          />
        </Section>
      )}

      <Section className="gap-y-3">
        <View className="flex-row items-center gap-x-3 rounded-tile border border-card-line px-4 py-3">
          <Ionicons name="lock-closed-outline" size={16} color={colors.quiet} />
          <View className="flex-1">
            <Text className="font-data text-[12px] font-semibold text-quiet">Email</Text>
            <Text className="font-data text-[14px] text-snow" numberOfLines={1}>
              {attendee?.email ?? profile?.email ?? '—'}
            </Text>
          </View>
          <CtaButton label="Change" tone="quiet" onPress={() => router.push('/me/contact')} accessibilityLabel="Ask us to change your email" />
        </View>
        {!attendee && !IS_DEMO && (
          <Text className="font-data text-[12px] leading-[17px] text-quiet">
            Your bio, interests and dietary requirements belong to an event registration. They appear here once you’re
            registered.
          </Text>
        )}
      </Section>

      <Section className="gap-y-3">
        <CtaButton label={saving ? 'Saving…' : 'Save Changes'} icon="checkmark" block loading={saving} onPress={submit} />
        {!!failure && (
          <Text accessibilityLiveRegion="polite" className="text-center font-data text-[13px] text-alert-action">
            {failure}
          </Text>
        )}
      </Section>
    </>
  );
}

export default function EditProfile() {
  const attendee = useAppStore((s) => s.attendee);
  const profile = useAppStore((s) => s.profile);

  return (
    <SubScreen title="Edit Profile" subtitle="How other attendees see you">
      {/* Keyed so the form starts from the account once it has loaded. */}
      <EditForm key={`${attendee?.id ?? 'none'}|${profile?.id ?? 'none'}`} attendee={attendee} profile={profile} />
    </SubScreen>
  );
}
