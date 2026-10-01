import { View, RefreshControl } from 'react-native';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { NeedHelp } from '@/components/NeedHelp';
import { EpisodePlayer } from '@/components/connect/EpisodePlayer';
import { EpisodeRow } from '@/components/connect/EpisodeRow';
import { NoticeCard, Loading } from '@/components/connect/NoticeCard';
import { usePodcastEpisodes, usePodcastPlayer } from '@/lib/hooks/usePodcast';
import { colors } from '@/lib/theme';

/**
 * Impact & Influence Podcast (206:755). The frame is 1376px tall and has no
 * layer tree here, so it is built from the frame name, the Connect card's copy
 * and the v2 patterns; re-check against 206:755 when Figma reads are
 * available.
 *
 * The latest episode leads with the full player; earlier episodes play in
 * place. Episodes stream in the app (expo-av, an <audio> element on the web)
 * rather than handing off to a podcast app.
 */
export default function Podcast() {
  const { episodes, isLoading, isError, isRefetching, refetch } = usePodcastEpisodes();
  const player = usePodcastPlayer();
  const [latest, ...earlier] = episodes;

  return (
    <SubScreen
      title="Impact & Influence Podcast"
      subtitle="Listen to inspiring conversations, leadership insights and real-world success stories."
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.earth} />}
    >
      {isLoading ? (
        <Section>
          <Loading label="Loading episodes…" />
        </Section>
      ) : isError ? (
        <Section>
          <NoticeCard
            icon="cloud-offline-outline"
            title="Couldn’t load the podcast"
            body="Check your connection and try again."
            action={{ label: 'Try again', onPress: refetch }}
          />
        </Section>
      ) : !latest ? (
        <Section>
          <NoticeCard
            icon="mic-outline"
            title="Episodes are on their way"
            body="Impact & Influence episodes appear here as they’re released to attendees."
          />
        </Section>
      ) : (
        <>
          <Section className="gap-y-3">
            <SectionHeading title="Latest Episode" />
            <EpisodePlayer episode={latest} player={player} />
          </Section>

          {earlier.length > 0 && (
            <Section className="gap-y-3">
              <SectionHeading
                title="More Episodes"
                subtitle={`${earlier.length} ${earlier.length === 1 ? 'episode' : 'episodes'}`}
              />
              <View className="gap-y-3">
                {earlier.map((ep) => (
                  <EpisodeRow key={ep.id} episode={ep} player={player} />
                ))}
              </View>
            </Section>
          )}
        </>
      )}

      <Section>
        <NeedHelp />
      </Section>
    </SubScreen>
  );
}
