import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { signOut } from '@/lib/auth';

const MENU = [
  { label: 'My Gallery', href: '/gallery', icon: 'images-outline' },
  { label: 'Speakers', href: '/speakers', icon: 'mic-outline' },
  { label: 'Partners', href: '/partners', icon: 'business-outline' },
  { label: 'Attendees', href: '/attendees', icon: 'people-outline' },
  { label: 'Connection Hub', href: '/connections', icon: 'qr-code-outline' },
  { label: 'Solutions to Support Your Business', href: '/solutions', icon: 'briefcase-outline' },
  { label: 'Charity Auction', href: '/auction', icon: 'trophy-outline' },
  { label: 'Dining Experience', href: '/dining', icon: 'restaurant-outline' },
  { label: 'Impact & Influence Podcast', href: '/podcast', icon: 'mic-circle-outline' },
  { label: 'FAQs', href: '/faqs', icon: 'help-circle-outline' },
  { label: 'CommBank', href: '/commbank', icon: 'card-outline' },
  { label: 'Submit Your Questions', href: '/questions', icon: 'chatbubble-ellipses-outline' },
] as const;

export default function Menu() {
  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-2">
        <T variant="caption">Menu</T>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="mt-6 gap-y-1">
        {MENU.map((m) => (
          <Pressable
            key={m.href}
            onPress={() => {
              router.back();
              router.push(m.href as any);
            }}
            className="flex-row items-center py-4 border-b border-snow/10"
          >
            <Ionicons name={m.icon as any} size={22} color="#D17F5D" />
            <T variant="body" className="ml-4 flex-1">{m.label}</T>
            <Ionicons name="chevron-forward" size={20} color="#8A8DA6" />
          </Pressable>
        ))}
      </View>

      <View className="mt-12">
        <Pressable onPress={() => router.push('/profile')} className="py-4 flex-row items-center">
          <Ionicons name="person-circle-outline" size={22} color="#FFFFFF" />
          <T variant="body" className="ml-4">My profile</T>
        </Pressable>
        <Pressable onPress={() => signOut()} className="py-4 flex-row items-center">
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <T variant="body" className="ml-4">Sign out</T>
        </Pressable>
      </View>
    </Screen>
  );
}
