import { ReactNode } from 'react';
import { ScrollView, View, RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export function Screen({
  children,
  scroll = true,
  refreshControl,
  className,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  className?: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />
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
