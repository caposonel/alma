"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useIsMobile } from "@/lib/use-is-mobile";

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
  const isMobile = useIsMobile();

  /* Skip the motion.div entirely on mobile or when reduced motion is on.
   *
   * Why: the homepage alone has 35 FloatingDoodle instances; about/contact/
   * diary have another ~60 between them. Each renders a `motion.div` with
   * `repeat: Infinity` keyframes that animate even when scrolled offscreen,
   * keeping React + the compositor busy continuously. On mid-tier Android
   * this directly tanks scroll FPS.
   *
   * The visual loss on mobile is small: most floating doodles are tucked
   * behind `hidden md:block` Tailwind utilities anyway (so they were
   * already invisible on phones, just paying the animation cost for no
   * payoff). The few that ARE visible on mobile just lose their gentle
   * bob — they still render statically with the same className.
   */
  if (reduced || isMobile) {
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
