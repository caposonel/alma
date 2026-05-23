"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface HandwrittenUnderlineProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps text with an animated squiggle underline that draws itself
 * when the element enters the viewport. On hover of the wrapper text,
 * the squiggle's stroke thickens slightly — like ink bleeding into
 * the paper. Pure CSS does the hover tween so it composes cleanly with
 * Framer Motion's one-shot path-draw.
 *
 * Respects `prefers-reduced-motion`: the underline is drawn statically
 * (no path-draw animation, no hover bleed).
 */
export function HandwrittenUnderline({
  children,
  className,
}: HandwrittenUnderlineProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <span className={cn("relative inline-block", className)}>
        {children}
        <svg
          viewBox="0 0 120 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          preserveAspectRatio="none"
          className="absolute -bottom-1 start-0 end-0 h-2 w-full text-pink-doodle"
        >
          <path
            d="M2 8C12 2 22 12 32 6C42 0 52 12 62 6C72 0 82 12 92 6C102 0 112 10 118 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className={cn("group relative inline-block", className)}>
      {children}
      <svg
        viewBox="0 0 120 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        preserveAspectRatio="none"
        className="absolute -bottom-1 start-0 end-0 h-2 w-full text-pink-doodle"
      >
        <motion.path
          d="M2 8C12 2 22 12 32 6C42 0 52 12 62 6C72 0 82 12 92 6C102 0 112 10 118 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="transition-[stroke-width] duration-300 ease-out group-hover:[stroke-width:2.4]"
        />
      </svg>
    </span>
  );
}
