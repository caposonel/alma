"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { YouTubePlayerController } from "@/components/ui/YouTubeEmbedPlayer";

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
  controller: YouTubePlayerController | null;
  setController: (controller: YouTubePlayerController | null) => void;
  currentTrack: CurrentTrack | null;
  setCurrentTrack: (track: CurrentTrack | null) => void;
  positionMs: number;
  durationMs: number;
  isPaused: boolean;
  /** Volume, 0..1. Initial value is 1 (matches Spotify embed default). */
  volume: number;
  setVolume: (volume: number) => void;
  updatePlaybackState: (state: {
    positionMs: number;
    durationMs: number;
    isPaused: boolean;
  }) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [controller, setController] = useState<YouTubePlayerController | null>(
    null
  );
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolumeState] = useState(1);

  const updatePlaybackState = useCallback(
    (state: { positionMs: number; durationMs: number; isPaused: boolean }) => {
      setPositionMs(state.positionMs);
      setDurationMs(state.durationMs);
      setIsPaused(state.isPaused);
    },
    []
  );

  /* Set the Spotify embed's volume.
   *
   * Spotify's IFrame API doesn't officially document a setVolume method,
   * so we attempt to set it three ways and hope one sticks:
   *   1. controller.setVolume(0-1) — exists on some IFrame API builds
   *   2. postMessage to the iframe with command names Spotify might
   *      respond to (`set_volume`, `volume`)
   *   3. Update our local state regardless, so the slider UI moves.
   *
   * If none of the underlying methods work, the slider becomes a
   * cosmetic control (visible movement, no audio change). The Spotify
   * embed format we use doesn't have its own volume UI, so visitors
   * still need device-level volume to actually change loudness. */
  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);

      // 1) Try the (undocumented but sometimes present) controller method
      try {
        controller?.setVolume?.(clamped);
      } catch {
        /* swallow */
      }

      // 2) postMessage fallback — find Spotify's iframe in the DOM and
      // send the volume command using known/guessed payload shapes.
      // Spotify's iframe lives at /embed/iframe-api/v1 (or similar)
      // under their `open.spotify.com` origin.
      try {
        const iframe = document.querySelector<HTMLIFrameElement>(
          'iframe[src*="open.spotify.com/embed"]'
        );
        if (iframe?.contentWindow) {
          // Spotify expects messages stringified with a specific shape;
          // we send several variants because Spotify has shipped
          // different message formats across IFrame API versions.
          for (const payload of [
            { command: "set_volume", value: clamped },
            { command: "volume", value: clamped },
            { type: "set_volume", value: clamped },
            { type: "volume", value: clamped },
          ]) {
            iframe.contentWindow.postMessage(payload, "*");
          }
        }
      } catch {
        /* swallow */
      }
    },
    [controller]
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
      volume,
      setVolume,
      updatePlaybackState,
    }),
    [
      controller,
      currentTrack,
      positionMs,
      durationMs,
      isPaused,
      volume,
      setVolume,
      updatePlaybackState,
    ]
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
