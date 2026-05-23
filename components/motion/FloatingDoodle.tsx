"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface FloatingDoodleProps {
  children: React.ReactNode;
  /** How many pixels to bob up/down — default 8 */
  intensity?: number;
  /** Full cycle duration in seconds — default 4 */
  duration?: number;
  /** Rotation swing in degrees — default 5 */
  rotateSwing?: number;
  className?: string;
}

/**
 * Wraps a decorative element (SVG doodle) in a gentle continuous
 * floating animation: bob up-down + slight rotation oscillation.
 *
 * Automatically disabled when user prefers reduced motion.
 */
export function FloatingDoodle({
  children,
  intensity = 8,
  duration = 4,
  rotateSwing = 5,
  className,
}: FloatingDoodleProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -intensity, 0, intensity * 0.5, 0],
        rotate: [0, rotateSwing, 0, -rotateSwing, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
