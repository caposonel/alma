import { cn } from "@/lib/utils";

interface StarProps {
  className?: string;
  variant?: "outline" | "filled";
}

export function Star({ className, variant = "outline" }: StarProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-6 w-6 text-pink-doodle", className)}
    >
      <path
        d="M20 3L24.5 14.5L37 16L28 25L30.5 37L20 31L9.5 37L12 25L3 16L15.5 14.5L20 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={variant === "filled" ? "currentColor" : "none"}
        opacity={variant === "filled" ? 0.25 : 1}
      />
    </svg>
  );
}
