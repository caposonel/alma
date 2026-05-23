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

function findActiveLineIndex(
  syncedLines: SyncedLine[],
  timeMs: number
): number {
  const timeSec = timeMs / 1000;
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

function estimatePlainActiveIndex(
  lineCount: number,
  positionMs: number,
  durationMs: number
): number {
  if (lineCount <= 0) return -1;
  if (durationMs <= 0 || positionMs <= 0) return -1;
  const ratio = Math.min(1, Math.max(0, positionMs / durationMs));
  return Math.min(lineCount - 1, Math.floor(ratio * lineCount));
}

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
 *  spring impulses stack unpredictably from the throttled ~6Hz playback
 *  ticks; tweens give the same buttery 0.65s glide regardless. */
const SCROLL_TRANSITION = {
  duration: 0.65,
  ease: APPLE_EASE,
} as const;

/** Tween for per-line opacity/scale. Same duration + easing as the scroll
 *  so the active-line emphasis arrives at the same moment the stack
 *  finishes gliding. */
const HIGHLIGHT_TRANSITION = {
  duration: 0.65,
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

  const activeIndex = hasSynced
    ? findActiveLineIndex(syncedLines!, currentTimeMs ?? 0)
    : estimatePlainActiveIndex(
        lineTexts.length,
        currentTimeMs ?? 0,
        durationMs ?? 0
      );

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
          you saw. */}
      <div
        ref={viewportRef}
        className="relative h-[50vh] min-h-[400px] overflow-hidden text-center"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
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
            const isActive = i === activeIndex;
            return (
              <motion.p
                key={i}
                data-line-index={i}
                animate={
                  reducedMotion
                    ? { opacity: 1, scale: 1 }
                    : {
                        // Apple Music / Spotify treatment: active line
                        // dominates the panel, everything else recedes.
                        // Opacity dropped from 0.35 → 0.22 so the dim
                        // lines genuinely fade into the background and
                        // the active one is unambiguously THE line.
                        opacity: isActive ? 1 : 0.22,
                        // Bigger scale punch (was 1.06) — at 1.18 the
                        // active line is visibly ~20% larger than its
                        // neighbors, matching the visual hierarchy of
                        // Apple Music's lyric panel.
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
                    "color 650ms cubic-bezier(0.32, 0.72, 0, 1), text-shadow 650ms cubic-bezier(0.32, 0.72, 0, 1), letter-spacing 650ms cubic-bezier(0.32, 0.72, 0, 1)",
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
