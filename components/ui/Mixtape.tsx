"use client";

import { motion } from "framer-motion";
import { Heart, Star, MusicNote, Tape } from "@/components/decorative";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface MixtapeTrack {
  /** Hebrew title shown on the tracklist */
  title: string;
  /** Optional duration string like "3:42" */
  duration?: string;
  /** Spotify track URL (public, no auth) — opens in new tab */
  spotifyUrl?: string;
}

interface MixtapeProps {
  /** Hand-lettered title on the cassette case spine (e.g., "השירים שמלווים אותי השנה") */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** The tracklist */
  tracks: MixtapeTrack[];
  /** Optional handwritten note in the corner */
  note?: string;
  /** Header above the tracklist (e.g., "רצועות" / "Tracks") */
  tracksHeading?: string;
  /** Small label at the bottom of the cover (e.g., "פלייליסט / Mixtape") */
  playlistLabel?: string;
  className?: string;
}

/**
 * Mixtape — a hand-drawn cassette case lying open with a Hebrew tracklist.
 *
 * Visual concept: scrapbook diary aesthetic. The outer container is the
 * "J-card" cassette case (paper-warm with dashed blush border + soft shadow),
 * split into two paper panels:
 *   - Left visual side (`flex`'s first child in RTL is on the right) — the
 *     "cover": big handwritten title + subtitle + washi tape decoration.
 *   - Right visual side — the "tracklist": numbered Hebrew rows, each a
 *     clickable <a target="_blank"> when `spotifyUrl` is present.
 *
 * A small "sticky note" with `note` sits at the bottom-end corner. Floating
 * doodles (Heart / Star / MusicNote) decorate the outside corners.
 *
 * The wrapping `motion.div` tilts -1deg by default and straightens on hover.
 * All motion is dropped when `prefers-reduced-motion: reduce` is set.
 *
 * No API calls, no auth — every Spotify URL is just an external link-out.
 */
export function Mixtape({
  title,
  subtitle,
  tracks,
  note,
  tracksHeading,
  playlistLabel,
  className = "",
}: MixtapeProps) {
  const reducedMotion = useReducedMotion();

  // Inner card — the two-panel cassette case
  const card = (
    <>
      {/* Decorative floating doodles — sit outside the dashed border */}
      <Heart className="pointer-events-none absolute -top-3 -end-3 h-6 w-6 rotate-12 opacity-90" />
      <Star
        className="pointer-events-none absolute -bottom-2 -start-2 h-6 w-6 -rotate-12 opacity-60"
        variant="filled"
      />
      <MusicNote className="pointer-events-none absolute -top-2 start-1/3 h-5 w-4 -rotate-6 opacity-50" />

      {/* The cassette J-card itself — flex on desktop, stacked on mobile */}
      <div
        className={cn(
          "relative grid gap-6 rounded-md border-2 border-dashed border-blush-200",
          "bg-paper-warm p-6 shadow-lg md:grid-cols-2 md:gap-10 md:p-8"
        )}
      >
        {/* ───────── LEFT PANEL (visual RIGHT in RTL) — the "cover" ───────── */}
        <div className="relative flex flex-col justify-between gap-6">
          {/* Washi tape strip at the top-start corner */}
          <div className="pointer-events-none absolute -top-3 start-4 -rotate-6">
            <Tape className="h-4 w-20" />
          </div>

          {/* Title block */}
          <div className="pt-4">
            <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
              {title}
              <Heart className="ms-2 inline-block h-5 w-5 align-baseline" />
            </h2>
            {subtitle && (
              <p className="mt-3 font-display text-xl text-ink-soft">
                {subtitle}
              </p>
            )}

            {/* Scattered decoration inside the cover */}
            <div className="mt-4 flex items-center gap-3 opacity-70">
              <MusicNote className="h-4 w-3" />
              <MusicNote className="h-5 w-4 rotate-12" />
              <MusicNote className="h-4 w-3 -rotate-6" />
            </div>
          </div>

          {/* Bottom "Mixtape" label */}
          {playlistLabel && (
            <p className="font-display text-xl uppercase tracking-widest text-blush-700">
              {playlistLabel}
            </p>
          )}
        </div>

        {/* ───────── RIGHT PANEL (visual LEFT in RTL) — the tracklist ───────── */}
        <div className="relative">
          {tracksHeading && (
            <h3 className="mb-4 text-center font-display text-xl text-ink-soft">
              {tracksHeading}
            </h3>
          )}
          <ol className="space-y-0">
            {tracks.map((track, i) => {
              const rowInner = (
                <>
                  {/* Track number — sits at the start (visual right in RTL) */}
                  <span className="me-3 inline-block w-6 shrink-0 font-display text-xl text-blush-700">
                    {i + 1}.
                  </span>
                  {/* Title takes remaining space */}
                  <span className="min-w-0 flex-1 font-body text-base font-medium text-ink">
                    {track.title}
                  </span>
                  {/* Duration — sits at the end (visual left in RTL) */}
                  {track.duration && (
                    <span className="ms-3 shrink-0 font-body text-sm tabular-nums text-ink-soft">
                      {track.duration}
                    </span>
                  )}
                </>
              );

              const rowClasses =
                "flex items-center border-b border-dashed border-blush-200 px-1 py-2.5 transition-colors";

              return (
                <li key={i}>
                  {track.spotifyUrl ? (
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        rowClasses,
                        "hover:text-blush-700 [&:hover_span]:text-blush-700"
                      )}
                    >
                      {rowInner}
                    </a>
                  ) : (
                    <div className={rowClasses}>{rowInner}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ───────── Sticky-note handwritten note ───────── */}
      {note && (
        <div
          className="absolute -bottom-4 end-4 max-w-[60%] -rotate-3 rounded-sm bg-white px-3 py-2 shadow-md md:max-w-[40%]"
          aria-label="handwritten note"
        >
          <p className="font-display text-xl font-medium leading-snug text-ink md:text-2xl">
            {note}
          </p>
        </div>
      )}
    </>
  );

  // Reduced-motion path: render the static card with no animations.
  if (reducedMotion) {
    return (
      <div
        className={cn("relative inline-block w-full", className)}
        style={{ transform: "rotate(-1deg)" }}
      >
        {card}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative inline-block w-full", className)}
      style={{ rotate: -1 }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{
        scale: 1.01,
        rotate: 0,
        transition: { type: "spring", damping: 22, stiffness: 180 },
      }}
    >
      {card}
    </motion.div>
  );
}
