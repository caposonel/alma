import { cn } from "@/lib/utils";

interface MusicNoteProps {
  className?: string;
}

/**
 * Simple eighth note SVG matching the existing doodle style.
 * Stroked outline, uses currentColor / pink-doodle.
 */
export function MusicNote({ className }: MusicNoteProps) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-5 w-4 text-pink-doodle", className)}
    >
      {/* Note head (ellipse) */}
      <ellipse
        cx="8"
        cy="26"
        rx="6"
        ry="4"
        stroke="currentColor"
        strokeWidth="1.8"
        transform="rotate(-15 8 26)"
      />
      {/* Stem */}
      <line
        x1="13.5"
        y1="24"
        x2="13.5"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Flag */}
      <path
        d="M13.5 4C17 6 20 9 17 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
