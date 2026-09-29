import { View, Text, TextInput, type TextStyle } from 'react-native';
import { colors } from '@/lib/theme';

/**
 * The note body: borderless, Butler on midnight (93:1081), always editable.
 *
 * A transparent TextInput sits over a mirror of its own text. The mirror
 * sizes the editor to its content — a web textarea does not grow as text
 * arrives — and carries what the comp draws after the last word while
 * recording (134:998): the words still being heard, then a quiet "Typing in
 * the background…". Both layers share one set of type metrics, so the cue
 * lands exactly where the next words will.
 */

const TYPE = 'font-body text-[15px] leading-[20px]';
const INVISIBLE: TextStyle = { color: 'transparent' };
// No scrollbar may steal width from the input, or its lines would wrap
// differently from the mirror's.
const INPUT: TextStyle = { overflow: 'hidden' };

/** What goes between the note and the incoming words — see appendPhrase. */
function separator(value: string, newParagraph: boolean): string {
  const base = value.replace(/[ \t]+$/, '');
  if (!base.trim()) return '';
  if (newParagraph) return base.endsWith('\n\n') ? '' : base.endsWith('\n') ? '\n' : '\n\n';
  return /\s$/.test(value) ? '' : ' ';
}

export function NoteEditor({
  value,
  onChangeText,
  interim,
  listening,
  newParagraph,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  /** Words heard but not yet final. */
  interim: string;
  /** Recording with a transcript running: show the cue. */
  listening: boolean;
  /** The next phrase starts a paragraph (the first of a recording). */
  newParagraph: boolean;
  placeholder: string;
}) {
  const sep = separator(value, newParagraph);
  return (
    <View className="min-h-[200px]">
      <Text className={`${TYPE} text-snow`} selectable={false} aria-hidden>
        <Text style={INVISIBLE}>{value}</Text>
        {interim ? (
          <Text className="text-snow/60">
            {sep}
            {interim}
          </Text>
        ) : null}
        {listening ? (
          <Text className="text-quiet">
            {interim ? ' ' : sep}
            Typing in the background…
          </Text>
        ) : null}
        {'\n​'}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        scrollEnabled={false}
        textAlignVertical="top"
        placeholder={listening ? undefined : placeholder}
        placeholderTextColor={colors.quiet}
        selectionColor={colors.earth}
        accessibilityLabel="Note"
        className={`absolute inset-0 ${TYPE} text-snow web:outline-none`}
        style={INPUT}
      />
    </View>
  );
}
