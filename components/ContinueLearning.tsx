import { View, Text, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { SectionHeading } from './SectionHeading';
import { learningGradient } from '@/lib/theme';

/**
 * "Continue Learning → Explore Programs" (132:599). Replaces August's
 * "Beyond Events" row and lands in the same place, REGROWTH's programs.
 */

const fill = Platform.select({
  web: { backgroundImage: learningGradient.web },
  default: { backgroundColor: learningGradient.native },
}) as object;

export function ContinueLearning() {
  return (
    <View className="gap-y-3">
      <SectionHeading title="Continue Learning" />
      <View style={fill} className="items-start gap-y-3 rounded-card border border-hairline p-4">
        <Text className="font-data text-[14px] font-medium text-lede">
          Explore REGROWTH’s workshops, online training and leadership development programs.
        </Text>
        <Pressable
          onPress={() => router.push('/solutions')}
          accessibilityRole="button"
          className="rounded-cta bg-ocean px-4 py-2"
        >
          <Text className="font-data text-[12px] font-semibold text-snow">Explore Programs</Text>
        </Pressable>
      </View>
    </View>
  );
}
