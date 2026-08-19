import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Search field with voice input — Insights screen.
 *
 * The microphone is in the design and is the entry point for dictating a
 * note. On the PWA it maps to the Web Speech API where available; the button
 * is hidden rather than shown-and-broken when it isn't.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  onVoice,
  voiceAvailable = true,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  onVoice?: () => void;
  voiceAvailable?: boolean;
}) {
  return (
    <View className="h-9 flex-row items-center gap-x-1.5 rounded-note bg-field px-2">
      <Ionicons name="search" size={16} color="#FFFBFB" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#FFFBFB"
        className="flex-1 font-sans text-field text-snow"
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {voiceAvailable && (
        <Pressable onPress={onVoice} hitSlop={10} accessibilityLabel="Dictate a note">
          <Ionicons name="mic-outline" size={18} color="#FFFBFB" />
        </Pressable>
      )}
    </View>
  );
}
