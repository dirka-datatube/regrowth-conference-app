import { useState } from 'react';
import { View, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { T } from '@/components/Type';
import { Photo } from '@/components/Photo';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoGallery } from '@/lib/demo';

export default function Gallery() {
  const me = useAppStore((s) => s.attendee);
  const eventId = me?.event_id;
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ['gallery', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (IS_DEMO) return demoGallery;
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function addPhoto() {
    if (!me || IS_DEMO) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (res.canceled || !res.assets[0]?.base64) return;
    setUploading(true);
    try {
      const bytes = Uint8Array.from(atob(res.assets[0].base64), (c) => c.charCodeAt(0));
      const path = `${me.event_id}/${me.id}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('gallery')
        .upload(path, bytes.buffer, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('gallery').getPublicUrl(path);
      const { error } = await supabase.from('gallery_items').insert({
        event_id: me.event_id,
        url: pub.publicUrl,
        taken_by: me.id,
        taken_at: new Date().toISOString(),
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['gallery', eventId] });
    } catch (e: any) {
      Alert.alert("That didn't upload", e?.message ?? 'Try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen>
      <Header label="Gallery" />
      <T variant="h1" className="mt-2">Moments</T>
      <T variant="body" className="mt-1">
        The week as we see it — add your favourites for everyone.
      </T>

      <View className="mt-4">
        <Button
          label={uploading ? 'Uploading…' : 'Add a photo'}
          loading={uploading}
          variant="secondary"
          onPress={addPhoto}
        />
      </View>

      {data?.length ? (
        <View className="flex-row flex-wrap mt-6 -mx-1">
          {data.map((g: any) => (
            <View key={g.id} className="w-1/3 p-1">
              <Photo uri={g.url} width={360} className="w-full aspect-square rounded-card bg-surface" />
              {g.is_official && (
                <View className="absolute top-2 left-2 bg-moment/70 rounded-pill px-2 py-0.5">
                  <T variant="caption" className="text-moment-ink normal-case tracking-normal">REGROWTH</T>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          title="The first photo is yours"
          description="Add a moment from today — the gallery grows as we all contribute."
        />
      )}
    </Screen>
  );
}
