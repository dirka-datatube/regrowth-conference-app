import { View } from 'react-native';
import { T } from './Type';

// REGROWTH is always typed in capitals. The ® must appear after the wordmark
// on first use per screen — pass `withMark` for the first instance only.
export function Wordmark({ withMark = false, className }: { withMark?: boolean; className?: string }) {
  return (
    <View className={className}>
      <T variant="h2" className="font-heading">
        REGROWTH{withMark ? '®' : ''}
      </T>
    </View>
  );
}
