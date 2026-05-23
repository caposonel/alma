import { cn } from "@/lib/utils";

interface ButterflyProps {
  className?: string;
}

export function Butterfly({ className }: ButterflyProps) {
  return (
    <svg
      viewBox="0 0 48 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-6 w-7 text-pink-doodle", className)}
    >
      <path
        d="M24 8C20 3 12 1 7 5C2 9 3 17 8 22C12 26 19 28 24 25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 8C28 3 36 1 41 5C46 9 45 17 40 22C36 26 29 28 24 25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 25C21 28 17 34 14 37"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 25C27 28 31 34 34 37"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
