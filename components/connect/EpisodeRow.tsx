import { View, Text, Pressable } from 'react-native';
import { EpisodeCover } from './EpisodeCover';
import { EpisodeProgress, PlayDisc } from './EpisodePlayer';
import { durationLabel, episodeDate, type PodcastPlayer } from '@/lib/hooks/usePodcast';
import type { PodcastEpisode } from '@/types/database';

/** An earlier episode: tap to play or pause; the playing one shows its progress. */
export function EpisodeRow({ episode, player }: { episode: PodcastEpisode; player: PodcastPlayer }) {
  const active = player.episodeId === episode.id;
  const meta = [episodeDate(episode.published_at), durationLabel(episode.duration_seconds)].filter(Boolean).join(' · ');
  return (
    <View className={`gap-y-3 rounded-card border p-3 ${active ? 'border-card-line bg-well' : 'border-hairline bg-tile'}`}>
      <Pressable
        onPress={() => player.toggle(episode)}
        accessibilityRole="button"
        accessibilityLabel={`${active && player.playing ? 'Pause' : 'Play'} ${episode.title}`}
        className="flex-row items-center gap-x-3"
      >
        <EpisodeCover />
        <View className="flex-1 gap-y-1">
          <Text className="font-data text-[14px] font-semibold leading-[19px] text-snow" numberOfLines={2}>
            {episode.title}
          </Text>
          <Text className="font-data text-[12px] text-quiet">{meta}</Text>
        </View>
        <PlayDisc size={38} playing={active && player.playing} loading={active && player.loading} />
      </Pressable>
      {active && (
        <>
          <EpisodeProgress positionMs={player.positionMs} durationMs={player.durationMs} />
          {!!player.error && <Text className="font-data text-[12px] text-quiet">{player.error}</Text>}
        </>
      )}
    </View>
  );
}
