import { View } from 'react-native';
import { T } from './Type';
import { Monogram } from './Monogram';

// Brand voice rule: solutions-focused, never problem-focused.
export function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <View className="items-center justify-center py-12 px-6">
      <View className="opacity-30 mb-4">
        <Monogram size={40} />
      </View>
      <T variant="h3" className="text-center mb-2">
        {title}
      </T>
      {description && (
        <T variant="body" className="text-center mb-4">
          {description}
        </T>
      )}
      {cta}
    </View>
  );
}
