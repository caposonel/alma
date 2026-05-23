"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface TapeProps {
  className?: string;
  /**
   * Tilt of the tape in degrees. Pass any rotation here rather than via
   * className, because the component animates via Framer Motion transforms,
   * which would otherwise stomp on a Tailwind `rotate-*` utility.
   */
  rotate?: number;
  /**
   * Set when the consumer uses `start-1/2` (or similar) for horizontal
   * centering instead of `-translate-x-1/2`. The component will bake the
   * `-50%` horizontal offset into its motion transform so it isn't lost
   * when Framer Motion overwrites the CSS `transform` property.
   */
  centerX?: boolean;
}

/**
 * Tape strip — animates "dropping" into place on first viewport entry.
 *
 * The drop-in animation goes from `y: -3, opacity: 0, rotate: rotate + 1`
 * (a slight over-rotation overshoot) to the settled `rotate` and `y: 0`.
 *
 * Respects `prefers-reduced-motion`: animation is skipped, the strip just
 * renders with its final rotation.
 */
export function Tape({ className, rotate = 0, centerX = false }: TapeProps) {
  const reducedMotion = useReducedMotion();

  const rect = (
    <rect
      x="2"
      y="2"
      width="76"
      height="20"
      rx="1"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="4 2"
    />
  );

  // When `centerX` is set, bake the horizontal half-offset into the motion
  // transforms so Framer Motion's transform composition doesn't lose it.
  const x = centerX ? "-50%" : 0;
  const staticTransform = [
    centerX ? "translateX(-50%)" : "",
    rotate ? `rotate(${rotate}deg)` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (reducedMotion) {
    return (
      <svg
        viewBox="0 0 80 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={cn("h-5 w-16 text-pink-doodle", className)}
        style={staticTransform ? { transform: staticTransform } : undefined}
      >
        {rect}
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 80 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-5 w-16 text-pink-doodle", className)}
      initial={{ x, y: -3, opacity: 0, rotate: rotate + 1 }}
      whileInView={{ x, y: 0, opacity: 1, rotate }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", damping: 14, stiffness: 120 }}
    >
      {rect}
    </motion.svg>
  );
}
