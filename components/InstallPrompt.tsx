import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from './Glass';
import { getInstallState, promptInstall, onInstallAvailabilityChange, type InstallState } from '@/lib/pwa';

/**
 * Add-to-home-screen card.
 *
 * Not a nag — it earns its place. On iOS, web push simply does not work until
 * the page is installed, so session reminders depend on this card being
 * actioned. We say why, rather than asking for the install on faith, and we
 * render nothing once the app is installed.
 */
export function InstallPrompt() {
  const [state, setState] = useState<InstallState>('unavailable');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setState(getInstallState());
    const unsubscribe = onInstallAvailabilityChange(() => setState(getInstallState()));
    return () => {
      unsubscribe();
    };
  }, []);

  if (dismissed || state === 'installed' || state === 'unavailable') return null;

  return (
    <GlassPanel tone="sunken" className="p-4">
      <View className="flex-row items-start gap-x-4">
        <View className="h-10 w-10 items-center justify-center rounded-note bg-accent-soft">
          <Ionicons name="phone-portrait-outline" size={20} color="#FFFFFF" />
        </View>

        <View className="flex-1">
          <Text className="font-data text-note-title text-snow">Add REGROWTH to your home screen</Text>
          <Text className="mt-1 font-body text-note-body text-snow/80">
            {state === 'manual-ios'
              ? 'Tap Share, then "Add to Home Screen". Session reminders only reach you once it is installed.'
              : 'Opens full screen and lets us send you session reminders.'}
          </Text>

          {state === 'promptable' && (
            <Pressable
              onPress={() => promptInstall()}
              className="mt-3 self-start rounded-pill bg-accent-soft px-4 py-2"
            >
              <Text className="font-ui text-tab text-snow">Add to home screen</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => setDismissed(true)} hitSlop={10} accessibilityLabel="Dismiss">
          <Ionicons name="close" size={20} color="#B9C0C9" />
        </Pressable>
      </View>
    </GlassPanel>
  );
}
