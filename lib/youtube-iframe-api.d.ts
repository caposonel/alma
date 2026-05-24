/**
 * Type declarations for YouTube's IFrame Player API.
 *
 * Spec:
 * https://developers.google.com/youtube/iframe_api_reference
 *
 * Loading `https://www.youtube.com/iframe_api` calls
 * `window.onYouTubeIframeAPIReady` once the library is ready. Consumers
 * then construct `new YT.Player(...)` to mount an embed they can control
 * programmatically — `setVolume`, `playVideo`, etc.
 */

export type YouTubePlayerState =
  | -1 // unstarted
  | 0 //  ended
  | 1 //  playing
  | 2 //  paused
  | 3 //  buffering
  | 5; // video cued

export interface YouTubePlayer {
  /** Load a new video by ID and start playback. */
  loadVideoById: (videoId: string | { videoId: string; startSeconds?: number }) => void;
  /** Cue (load but don't play) a video by ID. */
  cueVideoById: (videoId: string | { videoId: string; startSeconds?: number }) => void;
  /** Start playback. */
  playVideo: () => void;
  /** Pause playback. */
  pauseVideo: () => void;
  /** Stop playback completely. */
  stopVideo: () => void;
  /** Seek to a time. allowSeekAhead=true seeks even if not buffered yet. */
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  /** Set volume. Range 0-100 (NOT 0-1 like Spotify). */
  setVolume: (volume: number) => void;
  /** Read current volume, 0-100. */
  getVolume: () => number;
  /** Mute / unmute. */
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  /** Read current playback position in SECONDS (not ms). */
  getCurrentTime: () => number;
  /** Read total duration in SECONDS. */
  getDuration: () => number;
  /** Read current player state (see YouTubePlayerState). */
  getPlayerState: () => YouTubePlayerState;
  /** Tear down the player and remove the iframe. */
  destroy: () => void;
  /** Attach an event listener. */
  addEventListener: (event: string, listener: string | ((event: { data: number; target: YouTubePlayer }) => void)) => void;
}

export interface YouTubePlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    fs?: 0 | 1;
    modestbranding?: 1;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    origin?: string;
  };
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void;
    onStateChange?: (event: {
      data: YouTubePlayerState;
      target: YouTubePlayer;
    }) => void;
    onError?: (event: { data: number; target: YouTubePlayer }) => void;
  };
}

export interface YouTubeAPI {
  Player: new (
    element: HTMLElement | string,
    options: YouTubePlayerOptions
  ) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

declare global {
  interface Window {
    /** Set by us BEFORE the IFrame API script loads. YouTube invokes it
     *  once after the library is ready. */
    onYouTubeIframeAPIReady?: () => void;
    /** Populated by the IFrame API once loaded. */
    YT?: YouTubeAPI;
  }
}
