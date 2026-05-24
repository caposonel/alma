"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LyricScroll, type SyncedLine } from "@/components/motion/LyricScroll";
import {
  YouTubeEmbedPlayer,
  type YouTubePlaybackState,
  type YouTubePlayerController,
} from "./YouTubeEmbedPlayer";
import { AlbumDiscography, type DiscographyAlbum } from "./AlbumDiscography";
import { useMusicPlayer } from "@/lib/music-player-context";
import type { AdminLyric } from "@/lib/admin-store";
import { looksLikeLRC, parseLRC } from "@/lib/lrclib";

/* Karaoke comes from the admin store ONLY.
 *
 * Previous behaviour: on every track change we'd hit /api/lyrics → LRCLIB,
 * try 4 artist-name variants + a fuzzy /search, then maybe karaoke. That
 * meant up to 5 HTTP round-trips per track click before any visual
 * response — visitors saw the lyrics card flash empty during the lookup
 * and the next-track click felt sluggish.
 *
 * New flow: a one-off `scripts/bake-lrclib.ts` script populates each
 * track's `lyricsHe` in `data/content.json` with the LRC text. The runtime
 * just reads `matched.lyricsHe`, detects LRC format via `looksLikeLRC`,
 * parses it via `parseLRC`, and renders. Zero network calls.
 *
 * Tracks without LRC coverage (cleared by the bake script, or never
 * timed) have empty `lyricsHe` → no karaoke card shows at all (cleaner
 * UX than a static text block where karaoke is expected). */

interface MusicPlayerSectionProps {
  /** Initial YouTube video ID to load when the page first paints.
   *  Resolved by `app/[locale]/(site)/music/page.tsx` from the first
   *  track of the newest album. */
  initialVideoId: string;
  /** All admin-stored lyrics, fetched server-side. Used to look up the
   * currently-playing track. */
  adminLyrics: AdminLyric[];
  /**
   * Album-grouped discography to render under the embed + lyrics card. Each
   * entry is a release with its cover, track list, and optional streaming
   * links. Clicking a track inside it drives the embed.
   */
  albums: DiscographyAlbum[];
  /** Fallback title shown when no admin entry matches the playing track. */
  fallbackTitle: string;
  /** Credit line shown under the lyric card ("מילים ולחן: עלמה גוב" etc.). */
  fallbackCredit?: string;
  /** Embed loading-placeholder label. */
  spotifyLoadingLabel?: string;
  /** Lyrics section heading (rendered above the LyricScroll card). */
  lyricsHeading: React.ReactNode;
  /** Container className passed straight to the Spotify embed wrapper. */
  embedClassName?: string;
  /** Container className for the lyrics card wrapper. */
  lyricsClassName?: string;
  /** Discography section heading (e.g. "בחרי שיר"). */
  discographyHeading?: string;
  /** Short hint under the heading (e.g. "לחצי על שיר…"). */
  discographyHint?: string;
}

/**
 * Stitches the IFrame-API-driven Spotify embed together with the lyrics card.
 *
 * Karaoke source: the admin store's `lyricsHe` field, expected to be LRC
 * text (with `[mm:ss.xx]` line prefixes). Populate via
 * `scripts/bake-lrclib.ts` for tracks LRCLIB has timing for, or paste
 * LRC manually in the admin form. Tracks with plain-text or empty
 * lyrics show the embed + discography but no lyrics card.
 */
export function MusicPlayerSection({
  initialVideoId,
  adminLyrics,
  albums,
  fallbackTitle,
  fallbackCredit,
  spotifyLoadingLabel,
  lyricsHeading,
  embedClassName,
  lyricsClassName,
  discographyHeading,
  discographyHint,
}: MusicPlayerSectionProps) {
  /* The first track of the newest album with a YouTube ID is the
   * "default" that drives the player on first paint. We track the
   * current track by its YouTube videoId now (was Spotify trackId). */
  const defaultTrack = useMemo<AdminLyric | null>(() => {
    for (const album of albums) {
      const playable = album.tracks.find((t) => !!t.youtubeId);
      if (playable) return playable;
    }
    return null;
  }, [albums]);
  const defaultVideoId = defaultTrack?.youtubeId ?? null;

  const [currentVideoId, setCurrentVideoId] = useState<string | null>(
    defaultVideoId
  );
  const [currentPositionMs, setCurrentPositionMs] = useState<number>(0);
  /** Total duration of the currently-loaded track, in ms. Passed through
   *  to LyricScroll mainly for the mini-player progress bar wiring. */
  const [currentDurationMs, setCurrentDurationMs] = useState<number>(0);

  /* Imperative handle to the YouTube IFrame player's controller. Used by
   * the discography to drive playback (loadUri = loadVideoById + play). */
  const ytControllerRef = useRef<YouTubePlayerController | null>(null);

  /* Global music-player context — lets the sticky MailingBar at the bottom
   * of every page show a mini-player (pause/resume + progress) wired to the
   * same Spotify embed. May be null if the layout isn't wrapped in
   * MusicPlayerProvider (e.g. in isolated component tests).
   *
   * IMPORTANT: never include `player` directly in a `useEffect` dep array.
   * The provider re-memoizes its value object on every position tick
   * (~150ms during playback), so depending on `player` would re-fire the
   * effect 6+ times per second → infinite update loop. Always go through
   * `playerRef.current` (declared just below) so we read the latest player
   * without subscribing to its identity. */
  const player = useMusicPlayer();
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Locate the matching admin-lyric row by YouTube videoId.
  const matched = currentVideoId
    ? adminLyrics.find((l) => l.youtubeId === currentVideoId) ?? null
    : null;

  /* Push the current track title up to the global player whenever the
   * matched lyric row changes. */
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (!matched || !currentVideoId) {
      p.setCurrentTrack(null);
      return;
    }
    p.setCurrentTrack({ id: currentVideoId, title: matched.titleHe });
  }, [matched, currentVideoId]);

  /* Clear out player context state when this section unmounts (route nav
   * away from /music). The Spotify embed inside us gets destroyed with the
   * page, so the controller reference goes stale — null it explicitly so
   * the MailingBar hides its mini-player. */
  useEffect(() => {
    return () => {
      const p = playerRef.current;
      if (!p) return;
      p.setController(null);
      p.setCurrentTrack(null);
      p.updatePlaybackState({ positionMs: 0, durationMs: 0, isPaused: true });
    };
  }, []);

  /* User picked a track in the discography. Switch the YouTube embed
   * to that track's video and update local state. */
  const handleSelectTrack = useCallback((track: AdminLyric) => {
    if (!track.youtubeId) return;
    const controller = ytControllerRef.current;
    if (controller) {
      try {
        controller.loadUri(track.youtubeId);
      } catch (err) {
        console.warn("YouTube controller call failed:", err);
      }
    }
    setCurrentVideoId(track.youtubeId);
    setCurrentPositionMs(0);
    setCurrentDurationMs(0);
    // Reset global mini-player state so the MailingBar doesn't show
    // stale position/duration during the brief gap before YT reports.
    playerRef.current?.updatePlaybackState({
      positionMs: 0,
      durationMs: 0,
      isPaused: false,
    });
  }, []);

  /* Throttle position updates to ~16x/sec (60ms). The IFrame API itself
   * emits at roughly 100-150ms intervals, so 60ms is faster than the
   * upstream — effectively NO drops — while still giving React headroom
   * to batch when the API occasionally double-fires.
   *
   * Previous value was 150ms, which dropped about half of all upstream
   * ticks AND added up to 150ms of perceived karaoke-highlight lag on
   * songs with synced LRCLIB lyrics. Cutting it to 60ms makes the
   * highlight feel ~90ms snappier.
   *
   * Also fans out to the global player context (via `playerRef`, declared
   * up top) so the MailingBar's mini-player progress bar advances in
   * lockstep with the embed. */
  const lastPositionWriteRef = useRef(0);
  function handlePlaybackUpdate(state: YouTubePlaybackState) {
    const now = performance.now();
    if (now - lastPositionWriteRef.current < 60) return;
    lastPositionWriteRef.current = now;
    setCurrentPositionMs(state.position);
    // Duration only changes when the track changes — but it's cheap to set
    // every tick (React skips the re-render when the value matches) and
    // means the LyricScroll teleprompter always has the latest value.
    setCurrentDurationMs(state.duration);
    playerRef.current?.updatePlaybackState({
      positionMs: state.position,
      durationMs: state.duration,
      isPaused: state.isPaused,
    });
  }

  /* ----- Decide what to render in the LyricScroll ----- */

  const title = matched ? matched.titleHe : fallbackTitle;

  // The admin store's `lyricsHe` may contain LRC-formatted text (baked in
  // by `scripts/bake-lrclib.ts`, or pasted manually) or plain text or be
  // empty. We auto-detect LRC via `looksLikeLRC` and parse on the fly.
  // Empty / plain text → no karaoke card.
  const adminText = matched ? matched.lyricsHe || null : null;
  const adminIsLRC = adminText ? looksLikeLRC(adminText) : false;
  const adminSyncedLines = useMemo<SyncedLine[] | null>(() => {
    if (!adminText || !adminIsLRC) return null;
    const parsed = parseLRC(adminText);
    return parsed.length > 0 ? parsed : null;
  }, [adminText, adminIsLRC]);

  const useSynced = adminSyncedLines !== null;
  const credit = fallbackCredit;

  return (
    <>
      <YouTubeEmbedPlayer
        initialVideoId={initialVideoId}
        onPlaybackUpdate={handlePlaybackUpdate}
        onControllerReady={(controller) => {
          ytControllerRef.current = controller;
          // Hand the YT controller to the global music-player context
          // so the MailingBar mini-player's play/pause/seek/volume
          // buttons can drive it.
          playerRef.current?.setController(controller);
        }}
        className={embedClassName}
        loadingLabel={spotifyLoadingLabel}
      />

      {/* Lyrics card — ONLY rendered when the admin store has LRC-format
          timing data for the current track. Tracks with plain-text or
          empty lyrics don't show the card at all: visitors aren't shown
          a static block of text where karaoke is expected. */}
      {useSynced && (
        <div className={lyricsClassName}>
          {lyricsHeading}
          <LyricScroll
            title={title}
            credit={credit}
            currentTimeMs={currentPositionMs}
            durationMs={currentDurationMs}
            syncedLines={adminSyncedLines!}
          />
        </div>
      )}

      {/* Album discography — cover art + clickable tracks per release.
          Clicking a track drives both the embed AND the lyrics card.
          Necessary because the Spotify IFrame API does not reliably emit
          per-track URIs for album/playlist embeds, so passive detection
          alone leaves the lyrics card stuck on its initial state. */}
      <div className="mt-16">
        <AlbumDiscography
          albums={albums}
          currentTrackId={currentVideoId}
          onSelectTrack={handleSelectTrack}
          heading={discographyHeading}
          hint={discographyHint}
        />
      </div>
    </>
  );
}
