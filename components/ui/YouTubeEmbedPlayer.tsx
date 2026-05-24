"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type {
  YouTubeAPI,
  YouTubePlayer,
} from "@/lib/youtube-iframe-api";

/**
 * YouTube IFrame API player wrapper, parallel to SpotifyEmbedWithLyrics
 * but with the playback driven by YouTube's API. Exposes the same
 * controller shape (loadUri / play / pause / togglePlay / seek /
 * setVolume / destroy) so MusicPlayerSection can use either backend
 * with minimal branching.
 *
 * Key differences vs Spotify:
 *   - YouTube doesn't emit a `playback_update` event for position. We
 *     poll `getCurrentTime()` ~10x/sec while playing.
 *   - YouTube's setVolume uses 0-100; we convert from 0-1 at the
 *     controller boundary so callers can use the same scale.
 *   - `loadUri` accepts a bare video ID (not a `spotify:track:` URI) —
 *     callers must pass the 11-char YouTube ID directly.
 */

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

/** Module-level queue: YouTube only calls `onYouTubeIframeAPIReady` once
 *  per page load. We install a single hook that fans out to consumers. */
type ApiConsumer = (api: YouTubeAPI) => void;
const pendingConsumers: ApiConsumer[] = [];
let installedReadyHook = false;

function installReadyHookOnce(): void {
  if (typeof window === "undefined" || installedReadyHook) return;
  installedReadyHook = true;
  const existing = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (existing) existing();
    if (!window.YT) return;
    while (pendingConsumers.length > 0) {
      const fn = pendingConsumers.shift();
      try {
        fn?.(window.YT);
      } catch (err) {
        console.error("YouTube IFrame API consumer threw:", err);
      }
    }
  };
}

function requestApi(consumer: ApiConsumer): void {
  if (typeof window === "undefined") return;
  if (window.YT?.Player) {
    queueMicrotask(() => consumer(window.YT!));
    return;
  }
  installReadyHookOnce();
  pendingConsumers.push(consumer);
}

/** Shape exposed back up to MusicPlayerSection. Mirrors the methods
 *  that section uses from the Spotify controller. */
export interface YouTubePlayerController {
  /** Load a new track by YouTube video ID. */
  loadUri: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  /** Seek in SECONDS (matches the Spotify controller signature). */
  seek: (seconds: number) => void;
  /** Set volume in 0-1 range (we convert to YT's 0-100 internally). */
  setVolume: (volume: number) => void;
  destroy: () => void;
}

export interface YouTubePlaybackState {
  /** Current position in MILLISECONDS (matches Spotify's PlaybackState). */
  position: number;
  /** Total duration in MILLISECONDS. */
  duration: number;
  isPaused: boolean;
}

export interface YouTubeEmbedPlayerProps {
  /** Initial 11-char YouTube video ID to load. */
  initialVideoId: string;
  onPlaybackUpdate?: (state: YouTubePlaybackState) => void;
  onControllerReady?: (controller: YouTubePlayerController | null) => void;
  /** Loading-placeholder label. */
  loadingLabel?: string;
  className?: string;
}

export function YouTubeEmbedPlayer({
  initialVideoId,
  onPlaybackUpdate,
  onControllerReady,
  loadingLabel,
  className,
}: YouTubeEmbedPlayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  /* Keep callback refs current so the polling closure picks up the
   * latest handlers without re-creating the YT.Player on every render. */
  const onPlaybackUpdateRef = useRef(onPlaybackUpdate);
  const onControllerReadyRef = useRef(onControllerReady);
  useEffect(() => {
    onPlaybackUpdateRef.current = onPlaybackUpdate;
  }, [onPlaybackUpdate]);
  useEffect(() => {
    onControllerReadyRef.current = onControllerReady;
  }, [onControllerReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    requestApi((api) => {
      if (cancelled || !hostRef.current) return;
      const player = new api.Player(hostRef.current, {
        videoId: initialVideoId,
        height: "352",
        width: "100%",
        playerVars: {
          /* `playsinline:1` lets iOS Safari play in-line instead of
           * forcing fullscreen. `modestbranding:1` removes the YT
           * logo from the player chrome. `rel:0` keeps the
           * "suggested videos" overlay from showing other artists
           * after the song ends. */
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          /* origin must match where the iframe is loaded from for the
           * IFrame API postMessage handshake to work. */
          origin:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event) => {
            if (cancelled) {
              try {
                event.target.destroy();
              } catch {
                /* ok */
              }
              return;
            }
            playerRef.current = event.target;
            setIsReady(true);
            /* Start polling for position updates. YouTube doesn't push
             * playback events — we poll getCurrentTime / getDuration. */
            startPolling();
            /* Hand the controller to the parent. */
            onControllerReadyRef.current?.(buildController(event.target));
          },
          onStateChange: (event) => {
            /* Fire an immediate playback update on state changes so the
             * parent UI reacts to play/pause without waiting for the
             * next poll tick. */
            emitPlaybackUpdate(event.target);
          },
        },
      });
    });

    function startPolling() {
      if (pollTimerRef.current !== null) return;
      pollTimerRef.current = window.setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        try {
          emitPlaybackUpdate(p);
        } catch {
          /* getCurrentTime can throw if the player is being destroyed */
        }
      }, 100); // ~10 Hz, well within React's batch window
    }

    function emitPlaybackUpdate(p: YouTubePlayer) {
      const positionSec = p.getCurrentTime();
      const durationSec = p.getDuration();
      const state = p.getPlayerState();
      onPlaybackUpdateRef.current?.({
        position: positionSec * 1000,
        duration: durationSec * 1000,
        // YT.PlayerState.PAUSED = 2, ENDED = 0, BUFFERING = 3, UNSTARTED = -1
        // Anything other than PLAYING (1) is "not actively playing".
        isPaused: state !== 1,
      });
    }

    function buildController(p: YouTubePlayer): YouTubePlayerController {
      return {
        loadUri: (videoId: string) => {
          try {
            p.loadVideoById(videoId);
          } catch (err) {
            console.warn("YT loadVideoById failed:", err);
          }
        },
        play: () => {
          try {
            p.playVideo();
          } catch {
            /* ok */
          }
        },
        pause: () => {
          try {
            p.pauseVideo();
          } catch {
            /* ok */
          }
        },
        togglePlay: () => {
          try {
            const state = p.getPlayerState();
            if (state === 1) p.pauseVideo();
            else p.playVideo();
          } catch {
            /* ok */
          }
        },
        seek: (seconds: number) => {
          try {
            p.seekTo(seconds, true);
          } catch {
            /* ok */
          }
        },
        setVolume: (volume: number) => {
          try {
            // YT expects 0-100; we accept 0-1 to match Spotify's signature.
            const clamped = Math.max(0, Math.min(1, volume));
            p.setVolume(Math.round(clamped * 100));
          } catch {
            /* ok */
          }
        },
        destroy: () => {
          try {
            p.destroy();
          } catch {
            /* ok */
          }
        },
      };
    }

    return () => {
      cancelled = true;
      setIsReady(false);
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      const p = playerRef.current;
      if (p) {
        try {
          p.destroy();
        } catch {
          /* ok */
        }
        playerRef.current = null;
      }
      onControllerReadyRef.current?.(null);
    };
    // initialVideoId is intentionally NOT in deps — changing it should
    // happen via the controller's loadUri, not by re-creating the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <Script
        src={IFRAME_API_SRC}
        strategy="afterInteractive"
        onReady={() => installReadyHookOnce()}
        onLoad={() => installReadyHookOnce()}
      />
      <div className="relative min-h-[352px]">
        {loadingLabel && !isReady && (
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-50">
            <span className="text-xs text-neutral-400 animate-pulse">
              {loadingLabel}
            </span>
          </div>
        )}
        {/* YT IFrame API replaces this div with the iframe — the wrapper
         *  keeps a stacking context so the iframe paints above the
         *  loading skeleton. */}
        <div className="relative z-10">
          <div ref={hostRef} />
        </div>
      </div>
    </div>
  );
}
