import { cn } from "@/lib/utils";

interface HeartProps {
  className?: string;
}

/**
 * Hand-drawn heart that reads as drawn-by-pen at any size.
 *
 * Design intent:
 * - Two overlapping pen strokes (the path tracing back over itself) instead of
 *   a single mathematical curve — so even at h-4/h-5 you see the doodle.
 * - The bottom point intentionally overshoots and curls back, like a real pen
 *   that didn't stop on the dot.
 * - The two lobes are deliberately different sizes (left lobe slightly higher,
 *   right lobe slightly fatter) — symmetry kills the "drawn" feel.
 * - strokeWidth 3 (with strokeLinecap="round") keeps the wobble readable even
 *   when scaled down to 12-16px in headers / inline marks.
 */
export function Heart({ className }: HeartProps) {
  return (
    <svg
      viewBox="0 0 40 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-6 w-6 text-pink-doodle", className)}
    >
      {/* Main outline — asymmetric on purpose. Left lobe lifts to y≈4,
          right lobe sits lower at y≈5.5 and is fatter. */}
      <path
        d="M21 33.5
           C 18.4 31, 11.6 25.6, 7.6 21
           C 3.4 16.2, 2.4 11.4, 5.2 7.4
           C 7.6 4, 12.4 3, 15.8 5.6
           C 17.4 6.8, 18.6 8.6, 19.6 10.6
           Q 21.4 7.4, 24.2 5.4
           C 27.6 3, 32.8 4.2, 34.8 8.4
           C 36.8 12.6, 35.6 17.6, 32 21.6
           C 28.4 25.6, 22.6 30.8, 20.4 33.8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Curl-back at the bottom point — the pen kept going. This is the
          single biggest "this is a doodle" signal. */}
      <path
        d="M20.4 33.8
           C 20.1 34.4, 20.4 34.8, 21.2 34.4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tiny secondary stroke near the dip — like the pen was lifted and
          re-touched. Adds the layered-doodle look. */}
      <path
        d="M18.6 10.4 Q 19.4 11.6, 20.2 11.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
    </svg>
  );
}
