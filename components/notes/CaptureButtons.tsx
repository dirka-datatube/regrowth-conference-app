import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * The two header discs on Create Note (93:1081 / 134:998): the mic on an
 * earth tint starts and stops a recording; the moon on an ocean tint keeps it
 * going with the screen off.
 *
 * A control only the native app can deliver keeps its place with the Insights
 * capture button's "App" badge (components/Fab.tsx), and sends people to the
 * app rather than disappearing.
 */

function Disc({
  tint,
  icon,
  iconColor,
  label,
  onPress,
  selected,
  needsApp,
}: {
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
  needsApp?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole={selected === undefined ? 'button' : 'switch'}
      accessibilityLabel={needsApp ? `${label} — needs the REGROWTH app` : label}
      aria-checked={selected}
    >
      <View
        className={`h-[38px] w-[41px] items-center justify-center rounded-pill ${tint} ${
          needsApp ? 'opacity-70' : ''
        }`}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      {needsApp && (
        <View className="absolute -bottom-1.5 -right-2 rounded-pill bg-accent-soft px-1.5 py-px">
          <Text className="font-ui text-meta text-snow">App</Text>
        </View>
      )}
    </Pressable>
  );
}

export function CaptureButtons({
  recording,
  onMic,
  micNeedsApp,
  onMoon,
  moonOn,
  moonNeedsApp,
}: {
  recording: boolean;
  onMic: () => void;
  micNeedsApp: boolean;
  onMoon: () => void;
  /** Native: screen-off recording is on. */
  moonOn: boolean;
  moonNeedsApp: boolean;
}) {
  return (
    // Lifted to centre on the 20px title — ScreenHeader aligns its row to the top.
    <View className="-mt-1.5 flex-row items-center gap-x-2.5">
      <Disc
        tint="bg-earth/40"
        icon="mic-outline"
        iconColor={colors.cloud}
        label={recording ? 'Stop recording' : 'Record a voice note'}
        onPress={onMic}
        needsApp={micNeedsApp}
      />
      <Disc
        tint={moonOn ? 'bg-ocean' : 'bg-ocean/40'}
        icon="moon"
        iconColor={moonOn ? colors.snow : colors.indicator}
        label="Keep recording with the screen off"
        onPress={onMoon}
        selected={moonNeedsApp ? undefined : moonOn}
        needsApp={moonNeedsApp}
      />
    </View>
  );
}
