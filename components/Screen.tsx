import { ReactNode } from 'react';
import { ScrollView, View, RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Light-first canvas. variant="moment" keeps the dramatic Midnight look for
// hero screens (welcome, QR display, scanner, live session).
export function Screen({
  children,
  scroll = true,
  refreshControl,
  variant = 'light',
  className,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  variant?: 'light' | 'moment';
  className?: string;
}) {
  const bg = variant === 'moment' ? 'bg-moment' : 'bg-canvas';
  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={['top']}>
      <StatusBar style={variant === 'moment' ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView
          className={`flex-1 ${className ?? ''}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 px-5 ${className ?? ''}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}
