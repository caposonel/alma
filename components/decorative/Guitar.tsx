import { cn } from "@/lib/utils";

interface GuitarProps {
  className?: string;
}

export function Guitar({ className }: GuitarProps) {
  return (
    <svg
      viewBox="0 0 24 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-10 w-4 text-pink-doodle", className)}
    >
      <line
        x1="12"
        y1="2"
        x2="12"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="4"
        x2="16"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse
        cx="12"
        cy="38"
        rx="10"
        ry="16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="38"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="12"
        y1="20"
        x2="12"
        y2="22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
