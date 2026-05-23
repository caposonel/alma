import { cn } from "@/lib/utils";

interface DaisyProps {
  className?: string;
}

export function Daisy({ className }: DaisyProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-6 w-6 text-pink-doodle", className)}
    >
      <ellipse
        cx="20"
        cy="10"
        rx="4.5"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse
        cx="20"
        cy="10"
        rx="4.5"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="rotate(72 20 20)"
      />
      <ellipse
        cx="20"
        cy="10"
        rx="4.5"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="rotate(144 20 20)"
      />
      <ellipse
        cx="20"
        cy="10"
        rx="4.5"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="rotate(216 20 20)"
      />
      <ellipse
        cx="20"
        cy="10"
        rx="4.5"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="rotate(288 20 20)"
      />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
