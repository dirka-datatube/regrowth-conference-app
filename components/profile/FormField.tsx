import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { colors } from '@/lib/theme';

/**
 * A labelled text field for the Profile forms (Edit Profile, Contact, Rate
 * App). The sign-up comp (34:767) draws fields as translucent wells with a
 * hairline edge; in-app forms add a label above, since they open prefilled.
 */
export function FormField({
  label,
  error,
  hint,
  optional,
  multiline,
  ...input
}: {
  label: string;
  /** Replaces the hint and outlines the field in red. */
  error?: string | null;
  hint?: string;
  optional?: boolean;
} & Omit<TextInputProps, 'placeholderTextColor' | 'className'>) {
  return (
    <View className="gap-y-1.5">
      <Text className="font-data text-[12px] font-semibold text-quiet">
        {label}
        {optional && <Text className="font-normal text-quiet/70"> (optional)</Text>}
      </Text>
      <TextInput
        {...input}
        multiline={multiline}
        accessibilityLabel={input.accessibilityLabel ?? label}
        placeholderTextColor={colors.muted}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-cta border bg-well px-3.5 font-data text-[15px] text-snow ${
          multiline ? 'min-h-[120px] py-3 leading-[21px]' : 'h-12'
        } ${error ? 'border-alert-action' : 'border-card-line'}`}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" className="font-data text-[12px] text-alert-action">
          {error}
        </Text>
      ) : hint ? (
        <Text className="font-data text-[12px] leading-[17px] text-quiet">{hint}</Text>
      ) : null}
    </View>
  );
}
