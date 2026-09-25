import { ReactNode } from 'react';
import { ScrollView, View, RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SupportChip } from './SupportChip';

/**
 * Scaffold for the v2 tab roots: a fixed header, a scrolling body of sections
 * 24px apart, and the floating support chip.
 *
 * The body has no side padding so a section can run edge to edge (the
 * Featured row); everything else sits in <Section>.
 */
export function TabScreen({
  header,
  children,
  supportChip = true,
  refreshControl,
}: {
  header?: ReactNode;
  children: ReactNode;
  supportChip?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />
      {header && <View className="px-5 pt-2">{header}</View>}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 200, rowGap: 24 }}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
      {supportChip && <SupportChip />}
    </SafeAreaView>
  );
}

/** A body section on the 20px screen gutter. */
export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={`px-5 ${className ?? ''}`}>{children}</View>;
}
