/**
 * Type declarations for Spotify's public IFrame API.
 *
 * Spotify exposes a JavaScript library hosted at
 * https://open.spotify.com/embed/iframe-api/v1 that allows pages to swap a
 * regular Spotify embed iframe for a controllable player. No Spotify
 * developer account or API key is involved — the IFrame API uses the same
 * public open.spotify.com origin as the regular embed.
 *
 * Docs:
 * https://developer.spotify.com/documentation/embeds/references/iframe-api
 *
 * Loading the script (`https://open.spotify.com/embed/iframe-api/v1`) sets
 * `window.onSpotifyIframeApiReady` as the callback the API invokes once the
 * library is ready. The callback receives a `SpotifyIFrameAPI` instance the
 * caller can use to create one or more `SpotifyEmbedController`s.
 */

export interface SpotifyPlaybackData {
  /**
   * Currently-playing track URI (format: `"spotify:track:XXXX"`).
   *
   * NOTE: Spotify ships TWO field names depending on the API version. Newer
   * builds (the ones currently served at `open.spotify.com/embed/iframe-api/v1`
   * as of 2026-05) use `playingURI`. Older / some payloads use `uri`. ALWAYS
   * read both with a fallback (`data.playingURI ?? data.uri`) — reading just
   * `uri` silently breaks track detection on album/playlist embeds where
   * `uri` is empty/missing.
   */
  uri?: string;
  /** Same as `uri` — current production field name. */
  playingURI?: string;
  /** Current playback position in milliseconds. */
  position: number;
  /** Total track duration in milliseconds. */
  duration: number;
  /** Whether playback is currently paused. */
  isPaused: boolean;
  /** Whether the player is currently buffering. */
  isBuffering: boolean;
}

export type SpotifyEmbedEvent =
  | "ready"
  | "playback_update"
  | "playback_started";

export interface SpotifyEmbedController {
  /** Swap the currently-loaded URI. Accepts any Spotify URI (track/album/playlist/episode). */
  loadUri: (uri: string) => void;
  /** Start playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Toggle between play and pause. */
  togglePlay: () => void;
  /** Seek to a position. Argument is seconds (not milliseconds). */
  seek: (seconds: number) => void;
  /** Subscribe to playback events. */
  addListener: (
    event: SpotifyEmbedEvent,
    callback: (event: { data: SpotifyPlaybackData }) => void
  ) => void;
  /** Unsubscribe from a previously registered event listener. */
  removeListener: (
    event: SpotifyEmbedEvent,
    callback?: (event: { data: SpotifyPlaybackData }) => void
  ) => void;
  /** Tear down the embed (removes the underlying iframe). */
  destroy: () => void;
}

export interface SpotifyEmbedOptions {
  /** Initial Spotify URI to load. */
  uri: string;
  /** Embed width — number (pixels) or CSS string (e.g. `"100%"`). */
  width?: string | number;
  /** Embed height — number (pixels) or CSS string (e.g. `"352"`). */
  height?: string | number;
  /** Theme: 0 = light, 1 = dark. Default 0. */
  theme?: 0 | 1;
}

export interface SpotifyIFrameAPI {
  /**
   * Mount a Spotify embed into the given element. The `callback` is invoked
   * once with the resulting controller. Note: the API REPLACES the passed
   * element with an iframe — pass a placeholder you don't mind losing.
   */
  createController: (
    element: HTMLElement,
    options: SpotifyEmbedOptions,
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

declare global {
  interface Window {
    /**
     * Spotify invokes this hook once after the IFrame API script finishes
     * loading. The IFrame API library only calls this ONCE per page load
     * regardless of how many embeds you mount — multiple consumers must
     * cooperate via the queue pattern in `SpotifyEmbedWithLyrics`.
     */
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
    /**
     * Cached `SpotifyIFrameAPI` instance set by the queue helper once the API
     * is ready. Used so secondary consumers mounted AFTER the API loads can
     * still get a reference without registering their own callback.
     */
    SpotifyIframeAPI?: SpotifyIFrameAPI;
  }
}
