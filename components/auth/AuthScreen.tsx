import { ReactNode } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RGMark } from './RGMark';

/**
 * Scaffold for the signed-out screens, in the language of Log in (25:260) and
 * Sign up (34:767): the RG mark, a caps Inter headline and a Butler sub-line
 * in the upper half; the form anchored to the lower half; an optional footer
 * pinned to the bottom (Sign up's legal line).
 *
 * Scrolls when the keyboard or a short screen needs the room. On wide or tall
 * windows the column keeps the comp's 402×874 proportions, centred.
 */
export function AuthScreen({
  title,
  subtitle,
  hero = false,
  children,
  footer,
}: {
  /** Set in capitals. A node so Welcome can add a small ® to the wordmark. */
  title: ReactNode;
  subtitle?: string;
  /** Welcome: a larger mark and a letter-spaced wordmark. */
  hero?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { height } = useWindowDimensions();
  // The comps put the mark 124px below the status bar of an 874px screen.
  const top = Math.round(Math.min(124, Math.max(32, height * 0.142)));

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className={`max-h-[874px] w-full max-w-[402px] flex-1 self-center px-[44px] ${footer ? 'pb-2' : 'pb-6'}`}
            style={{ paddingTop: top }}
          >
            <View className="items-center">
              <RGMark size={hero ? 112 : 84} />
              <Text
                accessibilityRole="header"
                className={`mt-[46px] text-center font-data uppercase text-snow ${
                  hero ? 'text-[26px] leading-[32px] tracking-[5px]' : 'text-[20px] leading-[24px]'
                }`}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text className="mt-1.5 text-center font-body text-[14px] leading-[19px] text-snow">{subtitle}</Text>
              ) : null}
            </View>

            {/* The comps leave the space between heading and form open; the
                form sits in the lower half. */}
            <View className="min-h-[40px] flex-[3]" />
            {children}
            {footer ? (
              <>
                <View className="min-h-[24px] flex-1" />
                {footer}
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
