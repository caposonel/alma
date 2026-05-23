import { cn } from "@/lib/utils";

interface SquiggleProps {
  className?: string;
}

export function Squiggle({ className }: SquiggleProps) {
  return (
    <svg
      viewBox="0 0 120 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
      className={cn("h-2 w-full text-pink-doodle", className)}
    >
      <path
        d="M2 8C12 2 22 12 32 6C42 0 52 12 62 6C72 0 82 12 92 6C102 0 112 10 118 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
