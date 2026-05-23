"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Thin blush-colored progress bar at the very top of the viewport.
 * Grows from 0% to 100% width as the user scrolls the page.
 */
export function ScrollProgress() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  if (reducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 start-0 end-0 z-50 h-[3px] origin-left bg-gradient-to-l from-blush-400 to-blush-300"
      style={{ scaleX }}
    />
  );
}
