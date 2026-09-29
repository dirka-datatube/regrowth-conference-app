import { forwardRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * The translucent auth input (Log in 25:260, Sign up 34:767): 15% white over
 * midnight, a 1px 40%-white border, square-ish corners, a white Butler
 * placeholder that is also the field's accessible name. Focus brightens the
 * border; an error turns it red and says why underneath. `secure` adds the
 * show/hide toggle for passwords.
 *
 * 16px text on purpose: iOS Safari zooms the page into smaller inputs.
 */

// The comp's faint shadow along the inside top edge. Web only — React Native
// has no inset shadows.
const webField = Platform.select({
  web: { boxShadow: 'inset 0px 3px 6px 0px rgba(4,7,47,0.35)' },
  default: {},
}) as object;

// The border shows focus; the browser's own focus ring would double it.
const webInput = Platform.select({ web: { outlineStyle: 'none' }, default: {} }) as object;

type Props = Omit<TextInputProps, 'placeholder' | 'secureTextEntry'> & {
  label: string;
  error?: string;
  align?: 'left' | 'center';
  secure?: boolean;
};

export const AuthField = forwardRef<TextInput, Props>(function AuthField(
  { label, error, align = 'left', secure = false, onFocus, onBlur, ...input },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const centred = align === 'center';
  const border = error ? 'border-alert-action' : focused ? 'border-snow/80' : 'border-snow/40';
  // Centred text keeps equal room both sides so the eye toggle cannot push it off centre.
  const padding = centred ? 'px-9' : secure ? 'pl-[11px] pr-10' : 'px-[11px]';

  return (
    <View className="w-full">
      <View style={webField} className={`h-[38px] justify-center rounded-[2px] border bg-snow/15 ${border}`}>
        <TextInput
          ref={ref}
          {...input}
          placeholder={label}
          placeholderTextColor={colors.snow}
          accessibilityLabel={label}
          accessibilityHint={error}
          secureTextEntry={secure && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={webInput}
          className={`h-full font-body text-[16px] text-snow ${padding} ${centred ? 'text-center' : ''}`}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={`${revealed ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            hitSlop={8}
            className="absolute bottom-0 right-2.5 top-0 justify-center"
          >
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.indicator} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className={`mt-1 font-data text-[11px] leading-[14px] text-alert-action ${centred ? 'text-center' : ''}`}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});
