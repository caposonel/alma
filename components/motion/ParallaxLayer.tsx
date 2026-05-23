"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface ParallaxLayerProps {
  children: React.ReactNode;
  /** How much to offset — negative = moves slower (lagging), positive = faster */
  speed?: number;
  className?: string;
}

/**
 * Moves children at a different rate than normal scroll.
 * speed = -0.2 means it lags 20% behind (gentle parallax).
 * speed = 0.2 means it leads 20% ahead.
 *
 * Disabled when user prefers reduced motion.
 */
export function ParallaxLayer({
  children,
  speed = -0.2,
  className,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 200]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
