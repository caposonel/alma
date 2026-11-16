"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export interface SyncedLine {
  /** Start time of the line, in seconds (matches LRCLIB's parsed shape). */
  time: number;
  text: string;
}

interface LyricScrollProps {
  title: string;
  credit?: string;
  /**
   * Plain non-synced lyric lines. Used when `syncedLines` is not provided
   * (e.g. static fallback, or admin-stored lyrics without LRC timing).
   */
  lines?: string[];
  /**
   * Time-stamped lines from LRCLIB. When present, takes precedence over
   * `lines` and the LyricScroll renders one line per timestamp with the
   * currently-active line highlighted.
   */
  syncedLines?: SyncedLine[];
  /**
   * Current playback position in milliseconds. Drives which line is
   * "active" — for synced lyrics that's an exact match against `time`;
   * for plain lyrics it's a uniform estimate of `position / duration`.
   */
  currentTimeMs?: number;
  /**
   * Total song duration in milliseconds. Used together with `currentTimeMs`
   * to estimate which plain-lyric line is active when no LRC timing exists.
   * Ignored in synced mode (timestamps tell us directly).
   */
  durationMs?: number;
}

/* -------------------------------------------------------------------- */
/*  Active-line index calculation                                       */
/* -------------------------------------------------------------------- */

/* How much earlier (in seconds) we switch the highlight relative to when a
 * line is supposed to start being sung. Apple Music / Spotify both
 * highlight a line slightly BEFORE the singer hits it — the human brain
 * processes the visual cue with a few-frame lag and the line being sung
 * always feels "the one I just read", which is what we want.
 *
 * 0.22s is the sweet spot from manual testing: enough to feel anticipatory
 * without skipping past lines that are quickly followed by the next. */
const LYRIC_LEAD_SECONDS = 0.22;

function findActiveLineIndex(
  syncedLines: SyncedLine[],
  timeMs: number
): number {
  const timeSec = timeMs / 1000 + LYRIC_LEAD_SECONDS;
  let active = -1;
  for (let i = 0; i < syncedLines.length; i++) {
    if (syncedLines[i].time <= timeSec) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}

/* Plain (non-synced) lyric-line estimator REMOVED on 2026-05-23.
 *
 * It used to compute `(position / duration) * lineCount` to highlight a
 * "currently active" line during playback when LRCLIB had no synced data.
 * Problem: uniform interpolation across duration doesn't match how songs
 * are actually sung — intros, instrumental breaks, choruses repeating,
 * different line lengths all break the assumption. The result was
 * seemingly-random words getting highlighted instead of what was being
 * sung, which looked worse than no highlight at all.
 *
 * Alma's Hebrew indie folk catalog has no LRCLIB coverage, so the
 * estimator was the only path active in practice. Now we just render the
 * full lyric statically when no synced data is available — visitors can
 * read at their own pace. The karaoke highlight stays available for any
 * future tracks that do get LRCLIB entries.
 */

/* -------------------------------------------------------------------- */
/*  Scroll-style animation tuning. ALL the lines render in a vertical   */
/*  stack inside a clipped container; the inner stack translates UP so  */
/*  the active line sits at the top of the visible window. Past lines   */
/*  scroll above the clip and disappear naturally; upcoming lines slide */
/*  up from below. Single transform per index change — exactly what     */
/*  Apple Music, Spotify, and Musixmatch do, and it's the only way to   */
/*  get a genuinely smooth karaoke effect (popLayout/exit animations    */
/*  fight the browser's layout engine and never feel right).            */
/* -------------------------------------------------------------------- */

/** Apple Music's lyric easing — slow-start, fast-middle, slow-stop —
 *  applied to BOTH the stack scroll and the per-line emphasis crossfade
 *  so they land on the same beat. */
const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

/** Tween for the container's translateY. Tween (not spring) because
 *  spring impulses stack unpredictably from the throttled playback
 *  ticks; tweens give the same buttery glide regardless.
 *
 *  Duration dropped from 0.65s → 0.4s. The longer value felt luxurious
 *  on slow ballads but made fast-paced songs (where lines change every
 *  ~1-1.5s) constantly mid-transition when the next line arrived,
 *  reading as visible lag. 0.4s is short enough that even back-to-back
 *  line transitions finish before the next one starts, while keeping
 *  the Apple-easing curve's smoothness. */
const SCROLL_TRANSITION = {
  duration: 0.4,
  ease: APPLE_EASE,
} as const;

/** Tween for per-line opacity/scale. Same duration + easing as the scroll
 *  so the active-line emphasis arrives at the same moment the stack
 *  finishes gliding. */
const HIGHLIGHT_TRANSITION = {
  duration: 0.4,
  ease: APPLE_EASE,
} as const;

export function LyricScroll({
  title,
  credit,
  lines,
  syncedLines,
  currentTimeMs,
  durationMs,
}: LyricScrollProps) {
  const reducedMotion = useReducedMotion();
  const hasSynced = syncedLines && syncedLines.length > 0;

  /* Normalize both modes to the same shape so the render path is shared. */
  const lineTexts: string[] = hasSynced
    ? syncedLines!.map((l) => l.text || " ")
    : (lines ?? []);

  // -1 = no active line. Set when there's no synced data (so we render the
  // full lyric static rather than highlight a wrong line per the uniform
  // estimator). `durationMs` is intentionally unused now — kept in the
  // prop signature so callers don't break, in case we re-enable the
  // estimator behind a per-track flag later.
  void durationMs;
  const activeIndex = hasSynced
    ? findActiveLineIndex(syncedLines!, currentTimeMs ?? 0)
    : -1;

  /* The translateY we apply to the inner stack. Driven via a `MotionValue`
   * (not React state) so framer-motion controls the animation directly
   * — avoids the gotcha where `animate={{ y: stateValue }}` doesn't always
   * re-run the animation reliably when the underlying state was set inside
   * a useLayoutEffect that fires very frequently. */
  const innerRef = useRef<HTMLDivElement | null>(null);
  const y = useMotionValue(0);

  /* The clipped window element — used to compute its height so we can
   * center the active line inside it (matches Apple Music / Spotify; the
   * active line at the dead-center is the visual anchor your eye follows). */
  const viewportRef = useRef<HTMLDivElement | null>(null);

  /* Compute the target translateY so the active line ends up centered in
   * the viewport (rather than flush at the top — top alignment puts the
   * active line under the top mask gradient and it visually dims, which
   * is exactly the bug you saw). */
  const computeTargetY = (): number => {
    if (activeIndex < 0) return 0;
    const inner = innerRef.current;
    const viewport = viewportRef.current;
    if (!inner || !viewport) return 0;
    const activeEl = inner.querySelector<HTMLElement>(
      `[data-line-index="${activeIndex}"]`
    );
    if (!activeEl) return 0;
    const viewportH = viewport.clientHeight;
    const lineH = activeEl.offsetHeight;
    const lineTop = activeEl.offsetTop;
    // Center the active line: scroll so its top is at (viewportH - lineH) / 2.
    return -(lineTop - (viewportH - lineH) / 2);
  };

  /* Measure + animate on every active-line change. useLayoutEffect runs
   * post-DOM-mutation pre-paint so the centered target is correct on the
   * very first frame. */
  useLayoutEffect(() => {
    const target = computeTargetY();
    const controls = reducedMotion
      ? animate(y, target, { duration: 0 })
      : animate(y, target, SCROLL_TRANSITION);
    return () => controls.stop();
    // computeTargetY closes over activeIndex and refs only — the lint
    // wants it in deps but adding it would loop (function identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, lineTexts.length, reducedMotion, y]);

  /* On window resize, wrapped-line heights and viewport height both
   * change → re-measure + snap (no transition, the user is mid-resize
   * gesture and a glide would feel wrong).
   *
   * Also listen to `visualViewport.resize` — on iOS the address bar
   * collapses on scroll without firing a regular `resize` event, which
   * left the active lyric line drifting off-center until the user
   * orientation-changed or rotated the device. The visualViewport API
   * fires reliably for both URL-bar collapse and software keyboard show. */
  useEffect(() => {
    const onResize = () => {
      y.set(computeTargetY());
    };
    window.addEventListener("resize", onResize, { passive: true });
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    vv?.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, y]);

  return (
    <div
      className="relative mx-auto max-w-2xl rounded-sm bg-white px-8 py-10 shadow-md md:px-12 md:py-14"
      style={{
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 27px, rgba(229, 160, 160, 0.12) 27px, rgba(229, 160, 160, 0.12) 28px)",
      }}
    >
      <div className="absolute top-0 bottom-0 end-12 w-px bg-blush-200/40" />
      <h3 className="mb-8 text-center font-display text-3xl text-ink">
        {title}
      </h3>

      {/* Fixed-height clipped window — the inner stack translates inside
          it. Mask-image only fades at the very edges (5% each side)
          because the active line is now centered, NOT at top — a heavier
          top mask was dimming the active line itself, which is the bug
          you saw.
          When there's no synced data (no karaoke), we drop the height
          clip + edge mask so the FULL lyric renders inline. Otherwise
          long lyrics would be truncated invisibly with no scrolling
          hint to the visitor (they'd only see the first ~6 lines). */}
      <div
        ref={viewportRef}
        className={cn(
          "relative text-center",
          hasSynced
            ? "h-[50vh] min-h-[400px] overflow-hidden"
            : "overflow-visible"
        )}
        style={
          hasSynced
            ? {
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
              }
            : undefined
        }
      >
        <motion.div
          ref={innerRef}
          // `y` here is a MotionValue driven by the imperative `animate()`
          // calls in the useLayoutEffect above. Using `style.y` (not
          // `animate.y`) means framer-motion writes directly to the
          // transform on each frame without going through React.
          style={{ y, willChange: "transform" }}
        >
          {lineTexts.map((text, i) => {
            // Karaoke styling is ONLY applied when we have real synced
            // timing data. Without it, every line renders at full
            // opacity / no scale punch / no glow — the reader sees the
            // complete lyric as a static text block they can scan at
            // their own pace, rather than a (wrong-)highlighted slot
            // moving randomly. See the long comment on the removed
            // `estimatePlainActiveIndex` function above.
            // Dim the other lines only once a line is actually playing.
            // Before playback (or before the first timed line) every line
            // stays fully readable instead of sitting at 22% opacity.
            const showKaraoke = hasSynced && activeIndex >= 0;
            const isActive = showKaraoke && i === activeIndex;
            return (
              <motion.p
                key={i}
                data-line-index={i}
                animate={
                  reducedMotion || !showKaraoke
                    ? { opacity: 1, scale: 1 }
                    : {
                        // Apple Music / Spotify treatment: active line
                        // dominates the panel, everything else recedes.
                        opacity: isActive ? 1 : 0.22,
                        scale: isActive ? 1.18 : 1,
                      }
                }
                transition={HIGHLIGHT_TRANSITION}
                style={{
                  willChange: "opacity, transform, color, text-shadow",
                  /* All three appearance properties (color, text-shadow,
                   * letter-spacing) glide on the same Apple-easing curve
                   * over the same duration as the framer-motion
                   * opacity/scale. Letter-spacing fakes a smooth
                   * font-weight transition (real font-weight isn't
                   * interpolatable and would snap). Text-shadow gives
                   * the active line a soft blush halo — that's the
                   * subtle glow Apple uses to make the active line feel
                   * "lit". */
                  transition:
                    "color 400ms cubic-bezier(0.32, 0.72, 0, 1), text-shadow 400ms cubic-bezier(0.32, 0.72, 0, 1), letter-spacing 400ms cubic-bezier(0.32, 0.72, 0, 1)",
                  textShadow: isActive
                    ? "0 0 14px rgba(217, 119, 119, 0.30), 0 0 2px rgba(217, 119, 119, 0.45)"
                    : "none",
                  letterSpacing: isActive ? "-0.005em" : "0",
                  // Anchor the scale at the center so the line "blooms"
                  // outward symmetrically rather than expanding to one side.
                  transformOrigin: "center center",
                }}
                className={cn(
                  /* Constant font-weight (`font-semibold`) across active
                   * + inactive — font-weight isn't smoothly
                   * interpolatable in browsers, so changing it on
                   * transition snaps discretely. The active line's
                   * boldness instead comes from text-shadow density +
                   * the 1.18 scale + the saturated blush color.
                   *
                   * Base size bumped (text-lg / md:text-2xl, was
                   * text-base / md:text-lg) — combined with the active
                   * line's 1.18 scale this puts the active line at a
                   * comfortable reading size while inactive lines are
                   * still legible context. */
                  "py-2.5 font-semibold leading-relaxed text-lg md:text-2xl",
                  isActive ? "text-blush-600" : "text-ink"
                )}
              >
                {text}
              </motion.p>
            );
          })}
        </motion.div>
      </div>

      {credit && (
        <p className="mt-10 text-center text-base font-medium text-ink-soft">
          {credit}
        </p>
      )}
    </div>
  );
}
