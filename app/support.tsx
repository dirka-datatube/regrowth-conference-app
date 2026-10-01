import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';

import { ChatHeader } from '@/components/connect/ChatHeader';
import { ChatBubble } from '@/components/connect/ChatBubble';
import { ChatInput } from '@/components/connect/ChatInput';
import { SuggestionChips } from '@/components/connect/SuggestionChips';
import { EscalationCard } from '@/components/connect/EscalationCard';
import { Loading } from '@/components/connect/NoticeCard';
import { useAppStore } from '@/lib/store';
import { useAttendee } from '@/lib/hooks/useAttendee';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { useSupportChat } from '@/lib/hooks/useSupportChat';
import { supportGlow } from '@/lib/support';
import { NAVIGATE } from '@/lib/events';

/**
 * Customer Support (73:453) — full screen, outside the tabs. "Chat with Us"
 * and the support chip open it (lib/content.ts).
 *
 * The REGROWTH Assistant answers common questions on the device and links to
 * the screen with the facts (lib/support.ts); Connect hands the chat to the
 * team, whose replies land in the same thread. `?draft=` pre-fills the input
 * (Find A Referral sends what the attendee searched for).
 *
 * The comp draws the tab bar under this frame; the brief makes support a
 * full-screen route, so the input bar sits at the foot of the screen instead.
 */

const glow = Platform.select({
  web: { backgroundImage: supportGlow.web },
  default: { backgroundColor: supportGlow.native },
}) as object;

export default function CustomerSupport() {
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  // Opened straight from a link, the tabs have not loaded the attendee yet.
  useAttendee();
  const attendee = useAppStore((s) => s.attendee);
  const profile = useAppStore((s) => s.profile);
  const { tickets } = useRegistrations();

  const eventId = tickets[0]?.eventId ?? NAVIGATE.id;
  const firstName = profile?.first_name || attendee?.name?.split(' ')[0] || undefined;
  const ctx = useMemo(() => ({ eventId, firstName }), [eventId, firstName]);
  const chat = useSupportChat(ctx);

  const [text, setText] = useState(typeof draft === 'string' ? draft : '');
  const scroll = useRef<ScrollView>(null);

  async function sendDraft() {
    const value = text.trim();
    if (!value) return;
    setText('');
    if (!(await chat.send(value))) setText(value);
  }

  function escalate() {
    if (chat.mode === 'signed-out') router.push('/(auth)/welcome');
    else chat.requestTeam();
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={glow} className="absolute inset-x-0 top-0 h-[400px]" />

      <ChatHeader onClose={close} />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          className="flex-1"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 4 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          <View className="gap-y-4 px-5">
            {chat.items.map((item) => (
              <ChatBubble key={item.id} item={item} />
            ))}
            {chat.loading && <Loading label="Loading your conversation…" />}
            {chat.loadFailed && (
              <Text className="text-center font-data text-[12px] text-quiet">
                Earlier messages couldn’t load. They’ll appear when you’re back online.
              </Text>
            )}
          </View>
          <View className="mt-4">
            <SuggestionChips onPick={(question) => chat.send(question)} />
          </View>
        </ScrollView>

        <View className="gap-y-3 px-5 pb-3 pt-2">
          {chat.sendFailed && (
            <Text className="text-center font-data text-[12px] text-quiet">
              That message didn’t send. Check your connection and try again.
            </Text>
          )}
          <EscalationCard
            state={chat.mode === 'signed-out' ? 'signed-out' : chat.team}
            onPress={escalate}
          />
          <ChatInput value={text} onChangeText={setText} onSend={sendDraft} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
