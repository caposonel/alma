"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SpotifyEmbedController } from "@/components/ui/SpotifyEmbedWithLyrics";

/**
 * Global music-player state shared between the `/music` page (which owns the
 * Spotify embed and the IFrame-API controller) and the sticky MailingBar at
 * the bottom of every page (which renders the mini-player controls).
 *
 * Architecture:
 *  - The Spotify embed itself lives ONLY on `/music` — its iframe is bound to
 *    `MusicPlayerSection`'s lifecycle and gets destroyed when the user
 *    navigates away. So the mini-player in the MailingBar is meaningful
 *    *while the user is on the music page* (which is when music is actually
 *    playing). Outside that, `controller` is null and the MailingBar simply
 *    hides its play/pause + progress controls.
 *  - `MusicPlayerSection` calls `setController(controller)` on the embed's
 *    `onControllerReady` callback, and updates position/duration/isPaused on
 *    each throttled `playback_update` tick.
 *  - The MailingBar reads `controller`, `currentTrack`, `positionMs`,
 *    `durationMs`, `isPaused` and renders the mini-player when all three of
 *    `controller`, `currentTrack`, and `durationMs > 0` are truthy.
 */

export interface CurrentTrack {
  /** Bare 22-character Spotify track ID. */
  id: string;
  /** Display title for the mini-player (locale-resolved). */
  title: string;
}

interface MusicPlayerContextValue {
  controller: SpotifyEmbedController | null;
  setController: (controller: SpotifyEmbedController | null) => void;
  currentTrack: CurrentTrack | null;
  setCurrentTrack: (track: CurrentTrack | null) => void;
  positionMs: number;
  durationMs: number;
  isPaused: boolean;
  updatePlaybackState: (state: {
    positionMs: number;
    durationMs: number;
    isPaused: boolean;
  }) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [controller, setController] = useState<SpotifyEmbedController | null>(
    null
  );
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const updatePlaybackState = useCallback(
    (state: { positionMs: number; durationMs: number; isPaused: boolean }) => {
      setPositionMs(state.positionMs);
      setDurationMs(state.durationMs);
      setIsPaused(state.isPaused);
    },
    []
  );

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      controller,
      setController,
      currentTrack,
      setCurrentTrack,
      positionMs,
      durationMs,
      isPaused,
      updatePlaybackState,
    }),
    [controller, currentTrack, positionMs, durationMs, isPaused, updatePlaybackState]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

/**
 * Returns the music-player context, or `null` if the consumer isn't wrapped
 * in a `<MusicPlayerProvider>`. Returns null rather than throwing because the
 * MailingBar lives in the layout and may render before the provider in some
 * test/preview scenarios — gracefully degrading to "no mini-player" is
 * better than crashing the whole bar.
 */
export function useMusicPlayer(): MusicPlayerContextValue | null {
  return useContext(MusicPlayerContext);
}
