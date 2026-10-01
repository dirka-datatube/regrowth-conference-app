import { ReactNode } from 'react';
import { RefreshControlProps } from 'react-native';
import { TabScreen } from './TabScreen';
import { ScreenHeader } from './ScreenHeader';

/**
 * Scaffold for a screen pushed inside a tab: the v2 header with a back
 * chevron, title and one-line purpose over a rule, then the scrolling body.
 * The tab bar stays visible underneath, as in the v2 sub-screen frames.
 */
export function SubScreen({
  title,
  subtitle,
  right,
  children,
  supportChip = false,
  refreshControl,
}: {
  title: string;
  subtitle?: string;
  /** Header controls, e.g. the event notification bell. */
  right?: ReactNode;
  children: ReactNode;
  supportChip?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  return (
    <TabScreen
      supportChip={supportChip}
      refreshControl={refreshControl}
      header={<ScreenHeader title={title} subtitle={subtitle} right={right} />}
    >
      {children}
    </TabScreen>
  );
}
