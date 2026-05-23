"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOnce } from "@/lib/motion";

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child animation in seconds */
  staggerDelay?: number;
}

/**
 * Container that staggers children — each child reveals one after another.
 * Wrap each direct child in <StaggerItem>.
 */
export function StaggerGrid({
  children,
  className,
  staggerDelay = 0.08,
}: StaggerGridProps) {
  return (
    <motion.div
      variants={staggerContainer(staggerDelay)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

/** Single item inside a StaggerGrid — animates when parent triggers. */
export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
