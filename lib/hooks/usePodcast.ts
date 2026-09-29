import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { IS_DEMO } from '@/lib/demo';
import { demoEpisodes } from '@/lib/demo-connect';
import type { PodcastEpisode } from '@/types/database';

/** Impact & Influence Podcast (206:755): the episodes, newest first. */
const NO_EPISODES: PodcastEpisode[] = [];

export function usePodcastEpisodes() {
  const query = useQuery({
    queryKey: ['connect-podcast'],
    queryFn: async (): Promise<PodcastEpisode[]> => {
      if (IS_DEMO) return demoEpisodes;
      // RLS scopes episodes to the viewer's event.
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('id, event_id, title, description, audio_url, episode_url, duration_seconds, published_at')
        .order('published_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as PodcastEpisode[];
    },
  });
  // React Query's result types resolve to `any` under TypeScript 5.3.
  return {
    episodes: (query.data as PodcastEpisode[] | undefined) ?? NO_EPISODES,
    isLoading: query.isLoading as boolean,
    isError: query.isError as boolean,
    isRefetching: query.isRefetching as boolean,
    refetch: () => void query.refetch(),
  };
}

export type PodcastPlayer = {
  /** The episode loaded into the player, if any. */
  episodeId: string | null;
  playing: boolean;
  loading: boolean;
  positionMs: number;
  durationMs: number | null;
  error: string | null;
  toggle: (episode: PodcastEpisode) => void;
  skip: (deltaMs: number) => void;
};

type State = Omit<PodcastPlayer, 'toggle' | 'skip'> & { ended: boolean };

const IDLE: State = { episodeId: null, playing: false, loading: false, positionMs: 0, durationMs: null, error: null, ended: false };

/**
 * One expo-av Sound for the screen (expo-av plays through an <audio> element
 * on the web). Leaving the screen stops playback: there is no mini-player
 * elsewhere in the app to keep controlling it from.
 */
export function usePodcastPlayer(): PodcastPlayer {
  const sound = useRef<Audio.Sound | null>(null);
  const loadId = useRef(0);
  const [state, setState] = useState<State>(IDLE);

  useEffect(
    () => () => {
      loadId.current += 1;
      sound.current?.unloadAsync().catch(() => {});
      sound.current = null;
    },
    [],
  );

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setState((s) => ({ ...s, playing: false, loading: false, error: 'This episode can’t be played right now.' }));
      }
      return;
    }
    const duration = status.durationMillis;
    setState((s) => ({
      ...s,
      loading: false,
      positionMs: status.positionMillis,
      // The web reports NaN until the file's metadata arrives.
      durationMs: duration && Number.isFinite(duration) ? duration : s.durationMs,
      ended: status.didJustFinish,
      // The web only reports isPlaying once time has advanced, so it keeps the
      // tap's intent; native reports interruptions (a call) as they happen.
      playing: status.didJustFinish
        ? false
        : Platform.OS === 'web'
          ? s.playing
          : status.isPlaying || status.isBuffering,
    }));
  }, []);

  const toggle = useCallback(
    async (episode: PodcastEpisode) => {
      const current = sound.current;
      // A second tap while the episode is still loading cancels it.
      if (state.episodeId === episode.id && state.loading) {
        loadId.current += 1;
        setState((s) => ({ ...s, playing: false, loading: false }));
        return;
      }
      if (current && state.episodeId === episode.id) {
        try {
          if (state.playing) {
            setState((s) => ({ ...s, playing: false }));
            await current.pauseAsync();
          } else {
            setState((s) => ({ ...s, playing: true, ended: false, error: null }));
            if (state.ended) await current.replayAsync();
            else await current.playAsync();
          }
        } catch {
          setState((s) => ({ ...s, playing: false, error: 'This episode can’t be played right now.' }));
        }
        return;
      }

      const id = ++loadId.current;
      sound.current = null;
      current?.unloadAsync().catch(() => {});
      setState({
        ...IDLE,
        episodeId: episode.id,
        playing: true,
        loading: true,
        durationMs: episode.duration_seconds ? episode.duration_seconds * 1000 : null,
      });
      try {
        // Podcasts should play with the iPhone's silent switch on.
        if (Platform.OS !== 'web') await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: next } = await Audio.Sound.createAsync(
          { uri: episode.audio_url },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          // A replaced episode's last updates must not land on the new one.
          (status) => {
            if (id === loadId.current) onStatus(status);
          },
        );
        if (id !== loadId.current) {
          next.unloadAsync().catch(() => {});
          return;
        }
        sound.current = next;
      } catch {
        if (id === loadId.current) {
          setState((s) => ({ ...s, playing: false, loading: false, error: 'This episode can’t be played right now.' }));
        }
      }
    },
    [state.episodeId, state.playing, state.ended, state.loading, onStatus],
  );

  const skip = useCallback(
    (deltaMs: number) => {
      const current = sound.current;
      if (!current) return;
      const max = state.durationMs ?? Number.MAX_SAFE_INTEGER;
      const to = Math.min(Math.max(0, state.positionMs + deltaMs), max);
      setState((s) => ({ ...s, positionMs: to, ended: false }));
      current.setPositionAsync(to).catch(() => {});
    },
    [state.durationMs, state.positionMs],
  );

  const { ended: _ended, ...visible } = state;
  return { ...visible, toggle, skip };
}

/** 2400 → "40 min" */
export function durationLabel(seconds: number | null | undefined) {
  if (!seconds) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} hr${rest ? ` ${rest} min` : ''}`;
}

/** 83000 → "1:23" */
export function clockLabel(ms: number | null | undefined) {
  if (ms == null || !Number.isFinite(ms)) return '–:––';
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** "12 Sep 2026" */
export function episodeDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
