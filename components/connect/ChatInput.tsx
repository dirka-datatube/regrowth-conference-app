import { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dictationAvailable, startDictation } from '@/lib/support';
import { colors } from '@/lib/theme';

// The container's border shows focus instead of the browser's outline ring.
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object;

/**
 * The input bar (73:453 bottom-input-bar): mic, message, round send button.
 * The mic dictates where the browser can (lib/support.ts) and is hidden where
 * it cannot.
 */
export function ChatInput({
  value,
  onChangeText,
  onSend,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  const canDictate = dictationAvailable();
  const canSend = value.trim().length > 0;

  useEffect(() => () => stop.current?.(), []);

  function toggleDictation() {
    if (listening) {
      stop.current?.();
      return;
    }
    const before = value.trim();
    setListening(true);
    stop.current = startDictation(
      (text) => onChangeText(before ? `${before} ${text}` : text),
      () => {
        setListening(false);
        stop.current = null;
      },
    );
  }

  return (
    <View
      className={`h-12 flex-row items-center gap-x-2 rounded-pill border bg-well pl-3.5 pr-2 ${
        focused ? 'border-snow/40' : 'border-card-line'
      }`}
    >
      {canDictate && (
        <Pressable
          onPress={toggleDictation}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Stop dictation' : 'Dictate a message'}
          accessibilityState={{ selected: listening }}
        >
          <Ionicons name={listening ? 'mic' : 'mic-outline'} size={18} color={listening ? colors.earth : colors.snow} />
        </Pressable>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSend}
        placeholder={listening ? 'Listening…' : 'Type your question…'}
        placeholderTextColor={colors.quiet}
        returnKeyType="send"
        blurOnSubmit={false}
        maxLength={2000}
        accessibilityLabel="Message"
        style={noOutline}
        className="h-full flex-1 font-data text-[15px] text-snow"
      />
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send"
        accessibilityState={{ disabled: !canSend }}
        className={`h-8 w-8 items-center justify-center rounded-pill ${canSend ? 'bg-ocean' : 'bg-snow/15'}`}
      >
        <Ionicons name="arrow-forward" size={16} color={colors.snow} />
      </Pressable>
    </View>
  );
}
