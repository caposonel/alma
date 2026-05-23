"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LyricScroll, type SyncedLine } from "@/components/motion/LyricScroll";
import {
  SpotifyEmbedWithLyrics,
  type PlaybackState,
  type SpotifyEmbedController,
} from "./SpotifyEmbedWithLyrics";
import { AlbumDiscography, type DiscographyAlbum } from "./AlbumDiscography";
import { useMusicPlayer } from "@/lib/music-player-context";
import type { AdminLyric } from "@/lib/admin-store";

interface MusicPlayerSectionProps {
  /** Initial Spotify URI to load (album/playlist/track). */
  initialUri: string;
  /** All admin-stored lyrics, fetched server-side. Used to look up the
   * currently-playing track. */
  adminLyrics: AdminLyric[];
  /**
   * Album-grouped discography to render under the embed + lyrics card. Each
   * entry is a release with its cover, track list, and optional streaming
   * links. Clicking a track inside it drives the embed.
   */
  albums: DiscographyAlbum[];
  /** Static-fallback title shown before any track has been played. */
  fallbackTitle: string;
  /** Static-fallback lyric lines shown before any track has been played. */
  fallbackLines: string[];
  /** Static-fallback credit line ("מילים ולחן: עלמה גוב" etc.). */
  fallbackCredit?: string;
  /** Spotify-embed loading-placeholder label. */
  spotifyLoadingLabel?: string;
  /** Lyrics section heading (rendered above the LyricScroll card). */
  lyricsHeading: React.ReactNode;
  /** Container className passed straight to the Spotify embed wrapper. */
  embedClassName?: string;
  /** Container className for the lyrics card wrapper. */
  lyricsClassName?: string;
  /** The artist name to query LRCLIB with. Defaults to "Alma Gov". */
  artistName?: string;
  /** Discography section heading (e.g. "בחרי שיר"). */
  discographyHeading?: string;
  /** Short hint under the heading (e.g. "לחצי על שיר…"). */
  discographyHint?: string;
}

interface LyricsResponse {
  synced: SyncedLine[] | null;
  plain: string | null;
  duration: number | null;
}

/**
 * Stitches the IFrame-API-driven Spotify embed together with the lyrics card.
 *
 * Layered lookup, in priority order:
 *   1. LRCLIB synced lyrics → karaoke-style highlighting of the active line
 *      driven by `playback_update` position events from the IFrame API.
 *   2. LRCLIB plain lyrics or admin-stored `lyricsHe`/`lyricsEn` → static
 *      display, no highlight.
 *   3. Static `fallback*` props → when nothing else is available (no track
 *      playing yet, or no admin/LRCLIB match).
 *
 * The admin lyric record's `titleHe`/`titleEn` field is what we query LRCLIB
 * with. Alma's workflow: create a Lyric in admin with `titleHe` +
 * `spotifyTrackId` filled in and (optionally) lyric text. When a visitor
 * plays that track in the embed, the matching admin row is found by
 * Spotify track ID; LRCLIB is queried with the title to pull synced timing
 * data; lyrics then highlight in real time.
 */
export function MusicPlayerSection({
  initialUri,
  adminLyrics,
  albums,
  fallbackTitle,
  fallbackLines,
  fallbackCredit,
  spotifyLoadingLabel,
  lyricsHeading,
  embedClassName,
  lyricsClassName,
  artistName = "Alma Gov",
  discographyHeading,
  discographyHint,
}: MusicPlayerSectionProps) {
  /* The first track of the newest album is the "default" that drives the
   * lyrics card on first paint — so visitors landing on /music see real
   * lyrics immediately instead of a "click a song" placeholder. Computed
   * from the same `albums` array the discography renders. */
  const defaultTrack = useMemo<AdminLyric | null>(() => {
    return albums[0]?.tracks[0] ?? null;
  }, [albums]);
  const defaultTrackId = defaultTrack?.spotifyTrackId ?? null;

  const [currentTrackId, setCurrentTrackId] = useState<string | null>(
    defaultTrackId
  );
  const [currentPositionMs, setCurrentPositionMs] = useState<number>(0);
  /**
   * Total duration of the currently-loaded track, in ms. Used by LyricScroll
   * to ESTIMATE the active plain (non-synced) lyric line via `position/duration`
   * — gives the karaoke-style "past lines slide away" effect even when LRCLIB
   * has no LRC timing data for the track.
   */
  const [currentDurationMs, setCurrentDurationMs] = useState<number>(0);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[] | null>(null);
  const [lrclibPlain, setLrclibPlain] = useState<string | null>(null);
  /**
   * Tracks whether the LRCLIB lookup for `currentTrackId` is still in flight.
   * Starts true on initial mount (so SSR doesn't flash "lyrics coming soon"
   * before we've even tried to fetch). Flips false once the fetch resolves
   * (success or failure). Drives whether the "coming soon" placeholder is
   * rendered — we keep it hidden during the fetch window so the user doesn't
   * see a false-negative message that immediately gets replaced.
   */
  const [lyricsFetching, setLyricsFetching] = useState<boolean>(
    !!defaultTrackId
  );

  /* Imperative handle to the Spotify embed's controller. Stashed from the
   * embed's `onControllerReady` callback so the discography can drive
   * playback directly (loadUri + play), bypassing the unreliable
   * `playback_update.uri` detection path. */
  const spotifyControllerRef = useRef<SpotifyEmbedController | null>(null);

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

  // Locate the matching admin-lyric row, if any.
  const matched = currentTrackId
    ? adminLyrics.find((l) => l.spotifyTrackId === currentTrackId) ?? null
    : null;

  /* Push the current track title up to the global player whenever the
   * matched lyric row changes, so the MailingBar mini-player can show
   * "now playing: שיר ורוד" while a track is active. We deliberately read
   * `playerRef.current` instead of including `player` in deps — see the
   * note above the ref declaration. */
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (!matched || !currentTrackId) {
      p.setCurrentTrack(null);
      return;
    }
    p.setCurrentTrack({ id: currentTrackId, title: matched.titleHe });
  }, [matched, currentTrackId]);

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

  /* User picked a track in the TrackPicker. Switch the embed to that track
   * and update our local state at the SAME time — we don't wait for Spotify
   * to confirm the URI change, because the playback_update event sometimes
   * never reports the new URI (album/playlist embeds especially). */
  const handleSelectTrack = useCallback((track: AdminLyric) => {
    if (!track.spotifyTrackId) return;
    const uri = `spotify:track:${track.spotifyTrackId}`;
    const controller = spotifyControllerRef.current;
    if (controller) {
      try {
        controller.loadUri(uri);
        controller.play();
      } catch (err) {
        // The controller can throw if it's been destroyed mid-call (race
        // with route navigation). State still updates so the lyrics swap.
        console.warn("Spotify controller call failed:", err);
      }
    }
    // Drive the lyrics card locally — independent of any Spotify event.
    setCurrentTrackId(track.spotifyTrackId);
    // Reset position/duration so the karaoke teleprompter doesn't get stuck
    // showing a stale line from the previous track until Spotify reports
    // new playback state.
    setCurrentPositionMs(0);
    setCurrentDurationMs(0);
  }, []);

  /* When the current track changes, hit our LRCLIB proxy to pull synced
   * lyrics. Flips `lyricsFetching` true at the start and false when the
   * request settles (success OR failure) so the render can suppress the
   * "coming soon" placeholder during the in-flight window.
   *
   * No `lastFetchedTrackIdRef` dedup: an earlier version had one and it
   * created a strict-mode trap — in dev, React mounts → unmounts → mounts
   * each effect. The first mount started a fetch with `cancelled = false`,
   * the unmount set `cancelled = true`, and the re-mount early-returned on
   * the ref check (same trackId). The original IIFE then resolved with
   * `cancelled` true, skipped its `finally` `setLyricsFetching(false)`, and
   * `lyricsFetching` was stuck true forever — so every track's lyric body
   * just rendered the empty " " placeholder regardless of admin or LRCLIB
   * data. Removing the ref means strict mode does an extra fetch in dev
   * (no big deal — Next caches it for 24h), and lyrics always update. */
  useEffect(() => {
    if (!currentTrackId || !matched) {
      setSyncedLines(null);
      setLrclibPlain(null);
      setLyricsFetching(false);
      return;
    }
    setLyricsFetching(true);

    /* LRCLIB query title: Alma's catalog is released in Hebrew with Hebrew
     * song names — LRCLIB indexes them under those names. The previous
     * `matched.titleEn` fallback was a transliteration meant for UI display
     * in the now-removed English locale; we just use the Hebrew title. */
    const queryTitle = matched.titleHe || "";
    if (!queryTitle) {
      setSyncedLines(null);
      setLrclibPlain(null);
      setLyricsFetching(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const params = new URLSearchParams({
          track: queryTitle,
          artist: artistName,
        });
        const res = await fetch(`/api/lyrics?${params.toString()}`);
        if (cancelled) return;
        if (!res.ok) {
          setSyncedLines(null);
          setLrclibPlain(null);
          return;
        }
        const data = (await res.json()) as LyricsResponse;
        if (cancelled) return;
        setSyncedLines(data.synced && data.synced.length > 0 ? data.synced : null);
        setLrclibPlain(data.plain);
      } catch {
        if (cancelled) return;
        setSyncedLines(null);
        setLrclibPlain(null);
      } finally {
        /* ALWAYS flip the fetching flag false, even if `cancelled`. The
         * previous version gated this behind `!cancelled` which caused the
         * strict-mode bug described in the effect header — a cancelled
         * fetch would leave the loading state stuck on. The next mount
         * sets it back to true at the top, so we don't race. */
        setLyricsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrackId, matched, artistName]);

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
  function handlePlaybackUpdate(state: PlaybackState) {
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

  // Title: admin's title > fallback static title.
  const title = matched ? matched.titleHe : fallbackTitle;

  // Sync layer: LRCLIB synced > nothing.
  const useSynced = syncedLines && syncedLines.length > 0;

  // Plain-line fallback when no synced version exists. Priority:
  //   1. Admin-stored lyrics text (matches the displayed title's locale)
  //   2. LRCLIB plain lyrics
  //   3. Per-track "lyrics coming soon" message (when we KNOW which track is
  //      playing but have no text for it — better than showing the static
  //      placeholder lyrics for a different song)
  //   4. Static fallback lines from page props (used pre-playback)
  const adminText = matched
    ? matched.lyricsHe || null /* treat empty string as missing */
    : null;
  const plainSource = adminText ?? lrclibPlain ?? null;

  // Per-track "coming soon" placeholder — shown only once the LRCLIB fetch
  // has resolved (success or failure). During the in-flight window we show
  // an empty line instead, so visitors don't get a flash of "lyrics coming
  // soon" that immediately gets replaced when admin or LRCLIB data arrives.
  const comingSoonLines = matched
    ? ["המילים לשיר הזה יעלו בקרוב."]
    : fallbackLines;
  const placeholderLines = lyricsFetching ? [" "] : comingSoonLines;
  const plainLines = plainSource ? plainSource.split("\n") : placeholderLines;

  const credit = fallbackCredit;

  return (
    <>
      <SpotifyEmbedWithLyrics
        initialUri={initialUri}
        onTrackChange={setCurrentTrackId}
        onPlaybackUpdate={handlePlaybackUpdate}
        onControllerReady={(controller) => {
          spotifyControllerRef.current = controller;
          // Hand the controller to the global music-player context so the
          // sticky MailingBar's mini-player can call play/pause/seek.
          playerRef.current?.setController(controller);
        }}
        className={embedClassName}
        loadingLabel={spotifyLoadingLabel}
      />

      <div className={lyricsClassName}>
        {lyricsHeading}
        <LyricScroll
          title={title}
          credit={credit}
          currentTimeMs={currentPositionMs}
          durationMs={currentDurationMs}
          {...(useSynced
            ? { syncedLines: syncedLines! }
            : { lines: plainLines })}
        />
      </div>

      {/* Album discography — cover art + clickable tracks per release.
          Clicking a track drives both the embed AND the lyrics card.
          Necessary because the Spotify IFrame API does not reliably emit
          per-track URIs for album/playlist embeds, so passive detection
          alone leaves the lyrics card stuck on its initial state. */}
      <div className="mt-16">
        <AlbumDiscography
          albums={albums}
          currentTrackId={currentTrackId}
          onSelectTrack={handleSelectTrack}
          heading={discographyHeading}
          hint={discographyHint}
        />
      </div>
    </>
  );
}
