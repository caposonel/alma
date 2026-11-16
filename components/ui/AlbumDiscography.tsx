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
        <ul className="mt-4 space-y-1">
          {album.tracks.map((track, i) => {
            const title = track.titleHe;
            const isActive = track.spotifyTrackId === currentTrackId;
            return (
              <li key={track.slug} className="flex items-center gap-1">
                <motion.button
                  type="button"
                  onClick={() => onSelectTrack(track)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300",
                    isActive
                      ? "bg-blush-600 text-white shadow-sm"
                      : "text-ink hover:bg-blush-50 hover:text-blush-600"
                  )}
                  aria-pressed={isActive}
                >
                  <span
                    className={cn(
                      "w-6 text-xs tabular-nums",
                      isActive ? "text-white/80" : "text-blush-300"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate font-medium">{title}</span>
                  {isActive && (
                    <span aria-hidden="true" className="flex items-end gap-0.5">
                      <EqualizerBar delay={0} />
                      <EqualizerBar delay={0.15} />
                      <EqualizerBar delay={0.3} />
                    </span>
                  )}
                </motion.button>
                {track.lyricsHe?.trim() && (
                  <Link
                    href={`/lyrics/${encodeURIComponent(track.slug)}`}
                    aria-label={`מילים לשיר ${title}`}
                    className="shrink-0 rounded-md px-2 py-2 text-xs font-medium text-blush-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
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
      className="inline-flex items-center gap-1.5 rounded-full border border-blush-200 bg-paper px-3 py-1 text-xs text-ink-soft transition-colors hover:border-blush-400 hover:text-blush-500"
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
