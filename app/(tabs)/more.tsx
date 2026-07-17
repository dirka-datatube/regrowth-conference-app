import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Monogram } from '@/components/Monogram';
import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';

const GROUPS: { title: string; items: { label: string; href: string; icon: string }[] }[] = [
  {
    title: 'Experience',
    items: [
      { label: 'Dining Experience', href: '/dining', icon: 'restaurant-outline' },
      { label: 'Charity Auction', href: '/auction', icon: 'trophy-outline' },
      { label: 'My Gallery', href: '/gallery', icon: 'images-outline' },
    ],
  },
  {
    title: 'Learn',
    items: [
      { label: 'Speakers', href: '/speakers', icon: 'mic-outline' },
      { label: 'Impact & Influence Podcast', href: '/podcast', icon: 'headset-outline' },
      { label: 'Solutions for Your Business', href: '/solutions', icon: 'briefcase-outline' },
      { label: 'Partners', href: '/partners', icon: 'business-outline' },
      { label: 'My Notes', href: '/notes', icon: 'document-text-outline' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Submit Your Questions', href: '/questions', icon: 'chatbubble-ellipses-outline' },
      { label: 'FAQs', href: '/faqs', icon: 'help-circle-outline' },
      { label: 'CommBank', href: '/commbank', icon: 'card-outline' },
    ],
  },
];

export default function More() {
  const me = useAppStore((s) => s.attendee);

  return (
    <Screen>
      <View className="pt-2">
        <T variant="caption">More</T>
        <T variant="h1" className="mt-2">Everything else</T>
      </View>

      {/* Profile row */}
      <Pressable
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel="My profile"
        className="mt-6 bg-surface border border-line rounded-card p-4 flex-row items-center active:opacity-90"
      >
        <Monogram size={44} />
        <View className="ml-4 flex-1">
          <T variant="h3">{me?.name ?? 'Your profile'}</T>
          <T variant="small" className="text-ink-faint">
            Profile, interests & notification choices
          </T>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8B8EA6" />
      </Pressable>

      {GROUPS.map((group) => (
        <View key={group.title} className="mt-8">
          <T variant="sub">{group.title}</T>
          <View className="mt-2 bg-surface border border-line rounded-card overflow-hidden">
            {group.items.map((m, idx) => (
              <Pressable
                key={m.href}
                onPress={() => router.push(m.href as any)}
                accessibilityRole="button"
                accessibilityLabel={m.label}
                className={`flex-row items-center px-4 py-4 active:bg-surface-alt ${idx > 0 ? 'border-t border-line' : ''}`}
              >
                <Ionicons name={m.icon as any} size={20} color="#B85F3D" />
                <T variant="body" className="ml-4 flex-1 text-ink">{m.label}</T>
                <Ionicons name="chevron-forward" size={18} color="#8B8EA6" />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => signOut()}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        className="mt-8 py-4 flex-row items-center justify-center"
      >
        <Ionicons name="log-out-outline" size={18} color="#8B8EA6" />
        <T variant="small" className="ml-2 text-ink-faint">Sign out</T>
      </Pressable>
    </Screen>
  );
}
