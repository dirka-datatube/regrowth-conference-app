import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoAlerts } from '@/lib/demo';

export default function Alerts() {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const { data } = useQuery({
    queryKey: ['my-alerts', attendeeId],
    enabled: !!attendeeId,
    queryFn: async () => {
      if (IS_DEMO) return demoAlerts;
      const { data, error } = await supabase
        .from('notification_recipients')
        .select(
          `delivered_at, opened_at,
           notification:notifications(id, title, body, type, sent_at, data)`,
        )
        .eq('attendee_id', attendeeId!)
        .order('delivered_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Screen>
      <View className="pt-2">
        <T variant="caption">Alerts</T>
        <T variant="h1" className="mt-2">What's happened</T>
      </View>

      <View className="mt-6 gap-y-3">
        {data?.length ? (
          data.map((r: any) => (
            <Card key={r.notification.id}>
              <T variant="caption" className="text-earth normal-case tracking-normal">
                {labelForType(r.notification.type)}
              </T>
              <T variant="h3" className="mt-1">{r.notification.title}</T>
              <T variant="body" className="mt-1 text-cloud/80">{r.notification.body}</T>
            </Card>
          ))
        ) : (
          <EmptyState
            title="All quiet for now"
            description="We'll ping you here when there's something worth knowing."
          />
        )}
      </View>
    </Screen>
  );
}

function labelForType(t: string) {
  return {
    session_starting: 'Session starting',
    dont_miss: 'Don\'t miss this',
    people_to_meet: 'People to meet',
    partner_spotlight: 'Partner spotlight',
    auction: 'Auction',
    admin_announcement: 'From the team',
  }[t] ?? 'Update';
}
