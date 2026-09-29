import { View, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EpisodeCover } from './EpisodeCover';
import { clockLabel, durationLabel, episodeDate, type PodcastPlayer } from '@/lib/hooks/usePodcast';
import type { PodcastEpisode } from '@/types/database';
import { colors } from '@/lib/theme';

/** Elapsed over total, as a thin bar with its times. */
export function EpisodeProgress({ positionMs, durationMs }: { positionMs: number; durationMs: number | null }) {
  const fraction = durationMs ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;
  return (
    <View className="gap-y-1.5">
      <View
        className="h-1 overflow-hidden rounded-pill bg-snow/15"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      >
        <View className="h-1 rounded-pill bg-earth" style={{ width: `${fraction * 100}%` }} />
      </View>
      <View className="flex-row justify-between">
        <Text className="font-data text-[11px] text-quiet">{clockLabel(positionMs)}</Text>
        <Text className="font-data text-[11px] text-quiet">{clockLabel(durationMs)}</Text>
      </View>
    </View>
  );
}

function SkipButton({ seconds, onPress, disabled }: { seconds: number; onPress: () => void; disabled: boolean }) {
  const back = seconds < 0;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={back ? `Back ${-seconds} seconds` : `Forward ${seconds} seconds`}
      className={`h-11 w-11 items-center justify-center rounded-pill border border-glass-line bg-glass ${disabled ? 'opacity-40' : ''}`}
    >
      <Ionicons name={back ? 'play-back' : 'play-forward'} size={16} color={colors.snow} />
      <Text className="font-data text-[9px] font-semibold text-snow">{Math.abs(seconds)}s</Text>
    </Pressable>
  );
}

/** The play / pause disc, earth like the comps' highlights. Visual only. */
export function PlayDisc({ playing, loading, size = 56 }: { playing: boolean; loading: boolean; size?: number }) {
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center rounded-pill bg-earth">
      {loading ? (
        <ActivityIndicator size="small" color={colors.snow} />
      ) : (
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={Math.round(size * 0.42)}
          color={colors.snow}
          // The play triangle sits optically left of centre.
          style={playing ? undefined : { marginLeft: Math.round(size * 0.06) }}
        />
      )}
    </View>
  );
}

/**
 * The latest episode as a large card with the full controls — the featured
 * card on the Podcast screen (206:755).
 */
export function EpisodePlayer({ episode, player }: { episode: PodcastEpisode; player: PodcastPlayer }) {
  const active = player.episodeId === episode.id;
  const duration = durationLabel(episode.duration_seconds);
  const meta = [episodeDate(episode.published_at), duration].filter(Boolean).join(' · ');
  return (
    <View className="overflow-hidden rounded-feature border border-hairline bg-scrim-strong">
      <EpisodeCover size="large" />
      <View className="gap-y-2 px-5 pb-5 pt-4">
        <Text className="font-label text-[11px] font-bold uppercase tracking-widest text-earth">{meta}</Text>
        <Text className="font-data text-[18px] font-semibold leading-[24px] text-snow">{episode.title}</Text>
        {!!episode.description && (
          <Text className="font-body text-[13px] leading-[19px] text-snow/90" numberOfLines={3}>
            {episode.description}
          </Text>
        )}

        <View className="mt-2">
          <EpisodeProgress
            positionMs={active ? player.positionMs : 0}
            durationMs={active ? player.durationMs : episode.duration_seconds ? episode.duration_seconds * 1000 : null}
          />
        </View>

        <View className="flex-row items-center justify-center gap-x-8">
          <SkipButton seconds={-15} onPress={() => player.skip(-15_000)} disabled={!active || player.loading} />
          <Pressable
            onPress={() => player.toggle(episode)}
            accessibilityRole="button"
            accessibilityLabel={`${active && player.playing ? 'Pause' : 'Play'} ${episode.title}`}
          >
            <PlayDisc playing={active && player.playing} loading={active && player.loading} />
          </Pressable>
          <SkipButton seconds={30} onPress={() => player.skip(30_000)} disabled={!active || player.loading} />
        </View>

        {active && !!player.error && (
          <Text className="text-center font-data text-[12px] text-quiet">{player.error}</Text>
        )}
        {!!episode.episode_url && (
          <Pressable
            onPress={() => Linking.openURL(episode.episode_url!)}
            accessibilityRole="link"
            className="flex-row items-center justify-center gap-x-1.5 pt-1"
          >
            <Text className="font-data text-[12px] font-semibold text-snow/80">Open episode page</Text>
            <Ionicons name="open-outline" size={13} color={colors.snow} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
