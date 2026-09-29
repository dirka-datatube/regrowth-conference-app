import { ScrollView, Pressable, Text } from 'react-native';
import { SUGGESTIONS } from '@/lib/support';

/** Quick questions under the conversation (73:453 suggestion-chips). */
export function SuggestionChips({ onPick }: { onPick: (question: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, columnGap: 8 }}
    >
      {SUGGESTIONS.map((s) => (
        <Pressable
          key={s.label}
          onPress={() => onPick(s.question)}
          accessibilityRole="button"
          accessibilityLabel={`Ask: ${s.question}`}
          className="h-8 justify-center rounded-pill border border-card-line bg-tile px-3"
        >
          <Text className="font-ui text-[12px] text-snow">{s.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
