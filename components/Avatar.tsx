import { View, Text, Image } from 'react-native';

/**
 * A person's photo, or their initials on a brand disc when there is none —
 * the agenda speaker chips ("AT", "DSK"), attendee rows and speaker cards.
 */
export function initials(name: string) {
  return name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function Avatar({
  name,
  uri,
  size = 44,
  tone = 'bg-ocean',
}: {
  name: string;
  uri?: string | null;
  size?: number;
  /** Background class for the initials disc. */
  tone?: string;
}) {
  const box = { width: size, height: size };
  if (uri) {
    return <Image source={{ uri }} style={box} className="rounded-pill" accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={box} className={`items-center justify-center rounded-pill ${tone}`} accessibilityLabel={name}>
      <Text style={{ fontSize: Math.max(9, Math.round(size * 0.36)) }} className="font-data font-semibold text-snow">
        {initials(name)}
      </Text>
    </View>
  );
}
