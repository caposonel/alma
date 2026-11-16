"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SpotifyIcon, AppleMusicIcon, YoutubeIcon, BandcampIcon } from "./SocialIcons";
import type { AdminLyric } from "@/lib/admin-store";

/**
 * Album-card discography for `/music`.
 *
 * Each album card is a horizontal layout:
 *   [ Cover art (square)  ]   [ Title / year / track list / streaming links ]
 *
 * Clicking any track tile drives the IFrame-API embed at the top of the page
 * via `onSelectTrack(track)` → `controller.loadUri()` + `controller.play()`
 * AND updates the lyrics card locally. The currently-playing track is
 * highlighted blush-500/white so visitors can see what's active at a glance.
 *
 * Why this exists: Spotify's IFrame API does not reliably emit per-track
 * URIs for album/playlist embeds, so passive playback detection is broken.
 * Driving playback from this picker is the only way to keep the lyrics
 * card in sync. See the corresponding wiki log entry under
 * `/Websites_wiki/log.md` (2026-05-21 feature — TrackPicker UI) for the
 * full design rationale.
 */

export interface DiscographyAlbum {
  /** Display title (matches the `releaseTitle` field on `AdminLyric`). */
  releaseTitle: string;
  /** ISO date string — used to derive the year shown under the title. */
  releaseDate?: string;
  /** Album cover URL — typically Spotify's CDN thumbnail. Null falls back to a flat blush square. */
  coverUrl?: string | null;
  /** Tracks belonging to this release, in playback order. */
  tracks: AdminLyric[];
  /** Optional streaming links per album. */
  links?: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    bandcamp?: string;
  };
}

export interface AlbumDiscographyProps {
  albums: DiscographyAlbum[];
  currentTrackId: string | null;
  onSelectTrack: (track: AdminLyric) => void;
  /** Section heading rendered above the album list. */
  heading?: string;
  /** Short hint shown under the heading. */
  hint?: string;
}

export function AlbumDiscography({
  albums,
  currentTrackId,
  onSelectTrack,
  heading,
  hint,
}: AlbumDiscographyProps) {
  if (albums.length === 0) return null;

  return (
    <div>
      {(heading || hint) && (
        <div className="mb-8 text-center">
          {heading && (
            <h3 className="font-display text-3xl text-ink">{heading}</h3>
          )}
          {hint && (
            <p className="mt-2 text-sm text-ink-soft">{hint}</p>
          )}
        </div>
      )}

      <div className="space-y-12">
        {albums.map((album) => (
          <AlbumCard
            key={album.releaseTitle}
            album={album}
            currentTrackId={currentTrackId}
            onSelectTrack={onSelectTrack}
          />
        ))}
      </div>
    </div>
  );
}

function AlbumCard({
  album,
  currentTrackId,
  onSelectTrack,
}: {
  album: DiscographyAlbum;
  currentTrackId: string | null;
  onSelectTrack: (track: AdminLyric) => void;
}) {
  const year = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : null;
  const links = album.links ?? {};
  const hasLinks = !!(links.spotify || links.appleMusic || links.youtube || links.bandcamp);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
      {/* Cover art */}
      <div className="flex-shrink-0 md:w-56">
        <div className="relative aspect-square overflow-hidden rounded-sm bg-white p-2 shadow-md paper-shadow-lifted">
          {album.coverUrl ? (
            <Image
              src={album.coverUrl}
              alt={album.releaseTitle}
              width={500}
              height={500}
              unoptimized
              className="h-full w-full rounded-[2px] object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[2px] bg-gradient-to-br from-blush-100 to-blush-200">
              <span className="text-3xl">♪</span>
            </div>
          )}
        </div>
      </div>

      {/* Title + tracks + links */}
      <div className="flex flex-1 flex-col">
        <h4 className="font-display text-2xl text-ink md:text-3xl">
          {album.releaseTitle}
        </h4>
        {year !== null && (
          <p className="mt-1 text-sm font-medium text-ink-soft">{year}</p>
        )}

        {/* Track list — numbered, clickable, currently-playing track is highlighted */}
        <ul className="mt-4 space-y-0.5">
          {album.tracks.map((track, i) => {
            const title = track.titleHe;
            // The player runs on YouTube, so `currentTrackId` is a video id.
            const isActive =
              !!track.youtubeId && track.youtubeId === currentTrackId;
            const spotifyOnly = !track.youtubeId && !!track.spotifyTrackId;
            return (
              <li key={track.slug} className="flex min-h-11 items-center gap-1">
                {/* Rows hug their content so "מילים" sits right after the
                    song title (it used to be pushed to the far edge). */}
                {spotifyOnly ? (
                  <a
                    href={`https://open.spotify.com/track/${track.spotifyTrackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 text-start text-base text-ink transition-colors hover:bg-blush-50 hover:text-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
                  >
                    <span className="w-6 shrink-0 text-sm tabular-nums text-ink-soft">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <SpotifyIcon className="h-4 w-4 shrink-0 text-ink-soft" />
                    <span className="truncate font-medium">{title}</span>
                    <span className="shrink-0 text-sm text-ink-soft">ב-Spotify ↗</span>
                  </a>
                ) : (
                <motion.button
                  type="button"
                  onClick={() => onSelectTrack(track)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 text-start text-base transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300",
                    isActive
                      ? "bg-blush-600 text-white shadow-sm"
                      : "text-ink hover:bg-blush-50 hover:text-blush-700"
                  )}
                  aria-pressed={isActive}
                  aria-label={`השמעת ${title}`}
                >
                  <span
                    className={cn(
                      "w-6 shrink-0 text-sm tabular-nums",
                      isActive ? "text-white" : "text-ink-soft"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* Play affordance; the equalizer replaces it while playing. */}
                  {isActive ? (
                    <span aria-hidden="true" className="flex w-3.5 shrink-0 items-end gap-0.5">
                      <EqualizerBar delay={0} />
                      <EqualizerBar delay={0.15} />
                      <EqualizerBar delay={0.3} />
                    </span>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-blush-600" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  <span className="truncate font-medium">{title}</span>
                </motion.button>
                )}
                {track.lyricsHe?.trim() && (
                  <Link
                    href={`/lyrics/${encodeURIComponent(track.slug)}`}
                    aria-label={`מילים לשיר ${title}`}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium text-blush-700 underline underline-offset-4 decoration-blush-300 hover:decoration-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
                  >
                    מילים
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Streaming links */}
        {hasLinks && (
          <div className="mt-5 flex flex-wrap gap-2">
            {links.spotify && (
              <StreamingPill href={links.spotify} icon={<SpotifyIcon className="h-4 w-4" />} label="Spotify" />
            )}
            {links.appleMusic && (
              <StreamingPill href={links.appleMusic} icon={<AppleMusicIcon className="h-4 w-4" />} label="Apple Music" />
            )}
            {links.youtube && (
              <StreamingPill href={links.youtube} icon={<YoutubeIcon className="h-4 w-4" />} label="YouTube" />
            )}
            {links.bandcamp && (
              <StreamingPill href={links.bandcamp} icon={<BandcampIcon className="h-4 w-4" />} label="Bandcamp" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StreamingPill({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-blush-200 bg-paper px-4 text-sm text-ink transition-colors hover:border-blush-400 hover:text-blush-700"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

/** Tiny pulsing bar used as the "now playing" indicator next to the active track. */
function EqualizerBar({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block w-0.5 rounded-full bg-white/90"
      animate={{ height: ["6px", "12px", "6px"] }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}
