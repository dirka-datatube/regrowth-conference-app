import { useState } from 'react';
import { View, Image, Alert, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function BusinessCard() {
  const me = useAppStore((s) => s.attendee);
  const [image, setImage] = useState<{ base64: string; uri: string; mime: 'image/jpeg' | 'image/png' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<{ name?: string; company?: string; email?: string; phone?: string } | null>(null);

  async function pick() {
    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      const a = res.assets[0];
      setImage({
        base64: a.base64!,
        uri: a.uri,
        mime: a.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
      });
    }
  }

  async function process() {
    if (!image || !me) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('business-card-ocr', {
        body: { initiator_id: me.id, image_base64: image.base64, mime_type: image.mime },
      });
      if (error) throw error;
      setExtracted(data?.extracted ?? null);
    } catch (e: any) {
      Alert.alert("That didn't work", e?.message ?? 'Try a clearer photo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">Business card</T>
      </View>
      <T variant="h1" className="mt-2">Capture a card</T>
      <T variant="body" className="mt-2 text-cloud/80">
        Take a photo and we'll extract the details. They'll go into your
        connections as a pending contact until you confirm.
      </T>

      {image ? (
        <View className="mt-6">
          <Image source={{ uri: image.uri }} className="w-full h-56 rounded-card" resizeMode="cover" />
          <View className="mt-4">
            <Button label={loading ? 'Reading…' : 'Extract details'} loading={loading} onPress={process} />
          </View>
        </View>
      ) : (
        <View className="mt-6">
          <Button label="Open camera" onPress={pick} />
        </View>
      )}

      {extracted && (
        <Card className="mt-6">
          <T variant="sub">We found</T>
          {([
            ['Name', extracted.name],
            ['Company', extracted.company],
            ['Email', extracted.email],
            ['Phone', extracted.phone],
          ] as const).map(([k, v]) => (
            <View key={k} className="flex-row mt-2">
              <T variant="caption" className="w-20 normal-case tracking-normal">{k}</T>
              <T variant="body" className="flex-1">{v ?? '—'}</T>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
