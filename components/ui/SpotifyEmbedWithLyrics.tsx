"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type {
  SpotifyEmbedController,
  SpotifyIFrameAPI,
  SpotifyPlaybackData,
} from "@/lib/spotify-iframe-api";

// Re-export so consumers can type their `useRef<SpotifyEmbedController>`
// without having to dig into the internal types file.
export type { SpotifyEmbedController } from "@/lib/spotify-iframe-api";

const IFRAME_API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

/**
 * Queue of pending IFrame API consumers. Spotify only calls
 * `window.onSpotifyIframeApiReady` ONCE per page load, so we install a single
 * dispatch hook that fans the API instance out to every consumer that mounts.
 *
 * The first call also caches the API on `window.SpotifyIframeAPI` so any
 * component mounted AFTER the API loaded can grab it without registering a
 * fresh callback (the API would never fire it).
 */
type ApiConsumer = (api: SpotifyIFrameAPI) => void;
const pendingConsumers: ApiConsumer[] = [];
let installedReadyHook = false;

function installReadyHookOnce(): void {
  if (typeof window === "undefined" || installedReadyHook) return;
  installedReadyHook = true;
  // Don't overwrite a previously installed dispatcher; if some other module
  // already set the hook for its own queue, just chain.
  const existing = window.onSpotifyIframeApiReady;
  window.onSpotifyIframeApiReady = (api: SpotifyIFrameAPI) => {
    window.SpotifyIframeAPI = api;
    if (existing) existing(api);
    while (pendingConsumers.length > 0) {
      const fn = pendingConsumers.shift();
      try {
        fn?.(api);
      } catch (err) {
        console.error("Spotify IFrame API consumer threw:", err);
      }
    }
  };
}

function requestApi(consumer: ApiConsumer): void {
  if (typeof window === "undefined") return;
  if (window.SpotifyIframeAPI) {
    // Already loaded — call back synchronously on the next microtask so the
    // consumer can attach its own state setters without re-entrancy worries.
    queueMicrotask(() => consumer(window.SpotifyIframeAPI!));
    return;
  }
  installReadyHookOnce();
  pendingConsumers.push(consumer);
}

/**
 * Extract the bare 22-character Spotify track ID from a Spotify URI or URL.
 *
 * Handles every shape Spotify embeds have been observed to emit:
 *   - `"spotify:track:XXX"`  — canonical URI form
 *   - `"spotify:track:XXX?si=…"`  — URI with query string (rare but seen)
 *   - `"https://open.spotify.com/track/XXX"`  — URL form
 *   - `"https://open.spotify.com/track/XXX?si=…&utm_source=…"`  — URL with params
 *
 * Returns null for non-track URIs, empty / whitespace-only strings, or
 * anything that doesn't match a track pattern.
 *
 * @example
 *   parseTrackId("spotify:track:06rEa14xVbsmU6xrUDM5jR")
 *   // → "06rEa14xVbsmU6xrUDM5jR"
 *   parseTrackId("https://open.spotify.com/track/7pI1mmkZFDu1vnADznBotF?si=xx")
 *   // → "7pI1mmkZFDu1vnADznBotF"
 *   parseTrackId("spotify:album:7DEvEtOMZIcNVfWN3p84w1")
 *   // → null
 */
function parseTrackId(uri: string | undefined | null): string | null {
  if (!uri) return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;
  // URI form — `spotify:track:XXX` optionally followed by `?...` / `:...`.
  const uriMatch = /^spotify:track:([A-Za-z0-9]+)/.exec(trimmed);
  if (uriMatch) return uriMatch[1];
  // URL form — `open.spotify.com/track/XXX` optionally followed by `?...` / `/...`.
  const urlMatch = /open\.spotify\.com\/(?:[a-z-]+\/)?track\/([A-Za-z0-9]+)/.exec(
    trimmed
  );
  if (urlMatch) return urlMatch[1];
  return null;
}

export interface PlaybackState {
  trackId: string | null;
  position: number;
  duration: number;
  isPaused: boolean;
}

export interface SpotifyEmbedWithLyricsProps {
  /** Initial album/playlist/track URI to load (e.g. `"spotify:album:7DEvEtOMZIcNVfWN3p84w1"`). */
  initialUri: string;
  /** Called whenever the currently-playing track changes. `trackId` is the bare 22-character Spotify ID, or null when nothing is playing. */
  onTrackChange?: (trackId: string | null) => void;
  /** Optional fine-grained playback updates (position, isPaused, etc.). Fires every position tick — wrap in your own throttle if needed. */
  onPlaybackUpdate?: (state: PlaybackState) => void;
  /**
   * Called once the IFrame API has finished mounting the iframe and the
   * `SpotifyEmbedController` is available. The parent can stash this and
   * imperatively call `controller.loadUri(...)` / `controller.play()` to
   * drive playback from outside the embed (e.g. a custom track picker).
   * Called again with `null` when the embed unmounts.
   */
  onControllerReady?: (controller: SpotifyEmbedController | null) => void;
  /** Loading-placeholder label. */
  loadingLabel?: string;
  className?: string;
}

export function SpotifyEmbedWithLyrics({
  initialUri,
  onTrackChange,
  onPlaybackUpdate,
  onControllerReady,
  loadingLabel,
  className,
}: SpotifyEmbedWithLyricsProps) {
  /** The host element the IFrame API mounts INTO. The API replaces this node with its own iframe. */
  const hostRef = useRef<HTMLDivElement | null>(null);
  /** The controller handle, kept so we can `.destroy()` on unmount. */
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  /** Last-seen track URI — used to suppress duplicate `onTrackChange` calls on every position update. */
  const lastTrackUriRef = useRef<string | null>(null);
  /**
   * True once `createController`'s callback has fired and the iframe is in
   * the DOM. Drives whether we render the loading skeleton — important
   * because the IFrame API REPLACES the host node with its iframe, dropping
   * any z-index we'd put on the host itself. If we left the skeleton up
   * after the iframe mounted, it would paint OVER the iframe (positioned
   * elements paint after non-positioned siblings in source order).
   */
  const [isReady, setIsReady] = useState(false);
  /** Latest callback refs, kept current so the IFrame API listener (set up once) sees fresh values without re-creating the controller. */
  const onTrackChangeRef = useRef(onTrackChange);
  const onPlaybackUpdateRef = useRef(onPlaybackUpdate);
  const onControllerReadyRef = useRef(onControllerReady);
  useEffect(() => {
    onTrackChangeRef.current = onTrackChange;
  }, [onTrackChange]);
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

    const handlePlaybackUpdate = (event: { data: SpotifyPlaybackData }) => {
      const data = event.data;
      // Spotify ships TWO field names for the current URI depending on API
      // version: newer payloads use `playingURI`, older use `uri`. Reading
      // only one silently breaks track detection on album/playlist embeds
      // (which is how the /music page uses this — the album URI is the
      // initial URI; per-track URIs only arrive in playback events).
      const currentUri = data.playingURI ?? data.uri ?? null;
      const trackId = parseTrackId(currentUri);
      // Only fire onTrackChange when the URI ACTUALLY changes (otherwise it
      // would fire on every position tick, dozens of times a second).
      if (currentUri !== lastTrackUriRef.current) {
        lastTrackUriRef.current = currentUri;
        onTrackChangeRef.current?.(trackId);
      }
      onPlaybackUpdateRef.current?.({
        trackId,
        position: data.position,
        duration: data.duration,
        isPaused: data.isPaused,
      });
    };

    requestApi((api) => {
      if (cancelled || !hostRef.current) return;
      api.createController(
        hostRef.current,
        { uri: initialUri, width: "100%", height: 352, theme: 0 },
        (controller) => {
          if (cancelled) {
            controller.destroy();
            return;
          }
          controllerRef.current = controller;
          controller.addListener("playback_update", handlePlaybackUpdate);
          // The iframe is mounted — drop the skeleton so it stops painting
          // over the (newly-static, no-z-index) iframe.
          setIsReady(true);
          // Hand the controller to the parent so it can drive playback
          // imperatively (track picker → loadUri → play).
          onControllerReadyRef.current?.(controller);
        }
      );
    });

    return () => {
      cancelled = true;
      setIsReady(false);
      const c = controllerRef.current;
      if (c) {
        try {
          c.removeListener("playback_update", handlePlaybackUpdate);
        } catch {
          // Spotify's controller throws if the listener wasn't registered;
          // safe to ignore here.
        }
        try {
          c.destroy();
        } catch {
          // Destroying an already-torn-down controller is a no-op for us.
        }
        controllerRef.current = null;
      }
      lastTrackUriRef.current = null;
      // Tell the parent the controller is gone.
      onControllerReadyRef.current?.(null);
    };
    // `initialUri` is intentionally treated as load-only — changing it after
    // mount would re-create the embed. Use the controller imperatively if
    // dynamic URI changes are needed later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <Script
        src={IFRAME_API_SRC}
        strategy="afterInteractive"
        // Pre-install the dispatch hook BEFORE the API script runs so the
        // first `onSpotifyIframeApiReady` call doesn't overwrite our queue.
        onReady={() => installReadyHookOnce()}
        onLoad={() => installReadyHookOnce()}
      />
      {/* `min-h-[352px]` keeps the layout stable BEFORE the iframe mounts —
          otherwise the relative wrapper collapses to zero height (the host
          div is empty, the skeleton is absolutely positioned) and the
          skeleton is invisible if the IFrame API fails to load. */}
      <div className="relative min-h-[352px]">
        {/* Skeleton placeholder. Hidden once `isReady` flips true (i.e. the
            IFrame API has created its controller and the iframe is in the
            DOM). Kept up otherwise — including if the API script never
            loads — so the user sees SOMETHING in the embed slot. */}
        {loadingLabel && !isReady && (
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-50">
            <span className="text-xs text-neutral-400 animate-pulse">
              {loadingLabel}
            </span>
          </div>
        )}
        {/* The host gets REPLACED by the IFrame API with its own iframe,
            losing any classes/z-index applied to it. Wrap it in a positioned,
            z-indexed div so the iframe ends up inside that stacking context
            and reliably paints ABOVE the skeleton. */}
        <div className="relative z-10">
          <div ref={hostRef} />
        </div>
      </div>
    </div>
  );
}
