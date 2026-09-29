import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeading } from '@/components/SectionHeading';
import { colors } from '@/lib/theme';

/**
 * The AI summary in a tile card, and the follow-up questions under it — what
 * the claude-summarise-notes edge function writes back to the note.
 */

function generatedLine(iso: string | null): string {
  if (!iso) return 'Generated from this note';
  const when = new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `Generated ${when}`;
}

export function SummarySection({
  summary,
  questions,
  generatedAt,
  busy,
  error,
  canSummarise,
  onSummarise,
}: {
  summary: string | null;
  questions: string[];
  generatedAt: string | null;
  busy: boolean;
  error: string | null;
  /** False while the note is empty or cannot be saved. */
  canSummarise: boolean;
  onSummarise: () => void;
}) {
  const disabled = busy || !canSummarise;
  return (
    <View className="mt-8 gap-y-8">
      <View className="gap-y-3">
        <SectionHeading
          title="AI Summary"
          subtitle={summary ? generatedLine(generatedAt) : 'A short summary and three follow-up questions from this note.'}
        />
        {summary ? (
          <View className="rounded-card border border-hairline bg-tile p-4">
            <Text className="font-body text-[14px] leading-[21px] text-lede">{summary}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={onSummarise}
          disabled={disabled}
          accessibilityRole="button"
          aria-busy={busy}
          className={`flex-row items-center justify-center gap-x-2 self-start rounded-cta bg-ocean px-4 py-2.5 ${
            disabled && !busy ? 'opacity-50' : ''
          }`}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.snow} />
          ) : (
            <Ionicons name="sparkles-outline" size={16} color={colors.snow} />
          )}
          <Text className="font-data text-[13px] font-semibold text-snow">
            {busy ? 'Summarising…' : summary ? 'Summarise Again' : 'Summarise with AI'}
          </Text>
        </Pressable>
        {error ? <Text className="font-data text-[12px] leading-[17px] text-quiet">{error}</Text> : null}
        {!canSummarise && !busy && !error ? (
          <Text className="font-data text-[12px] text-quiet">Write or record something first.</Text>
        ) : null}
      </View>

      {questions.length > 0 && (
        <View className="gap-y-3">
          <SectionHeading title="Follow-up Questions" />
          <View className="gap-y-3 rounded-card border border-hairline bg-tile p-4">
            {questions.map((q) => (
              <View key={q} className="flex-row gap-x-2.5">
                <Ionicons name="help-circle-outline" size={16} color={colors.quiet} />
                <Text className="flex-1 font-body text-[14px] leading-[20px] text-lede">{q}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
