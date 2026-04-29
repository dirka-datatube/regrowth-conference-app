import { View } from 'react-native';
import { T } from './Type';

// Brand voice rule: solutions-focused, never problem-focused. Default copy
// here uses "we" and "opportunity" framing.
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
      <T variant="h3" className="text-center mb-2">
        {title}
      </T>
      {description && (
        <T variant="body" className="text-center text-cloud/80 mb-4">
          {description}
        </T>
      )}
      {cta}
    </View>
  );
}
