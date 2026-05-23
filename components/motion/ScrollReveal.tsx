"use client";

import { motion } from "framer-motion";
import { getDirectionVariants, viewportOnce } from "@/lib/motion";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  /** HTML element to render — defaults to div */
  as?: "div" | "section" | "article";
}

/**
 * Wraps children in a motion.div that fades + slides in
 * when it enters the viewport. Plays once.
 *
 * Previously this called `motion.create(as)` inside the render body —
 * that returns a fresh component type on every render, so React would
 * unmount + remount the entire child tree each time, dropping local
 * state and re-firing `whileInView` on every ScrollReveal consumer
 * (DiaryCard, ShowsCard, GalleryGrid, About sections, etc.). The fix
 * is to dispatch to the pre-created `motion.div` / `motion.section` /
 * `motion.article` accessors that framer-motion exports, which are
 * stable component references with full per-tag prop typing preserved.
 */
export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration,
  className,
  as = "div",
}: ScrollRevealProps) {
  const variants = getDirectionVariants(direction);
  const transition =
    delay || duration
      ? { duration: duration ?? 0.6, ease: "easeOut" as const, delay }
      : undefined;
  const commonProps = {
    variants,
    initial: "hidden",
    whileInView: "visible",
    viewport: viewportOnce,
    transition,
    className,
  } as const;

  if (as === "section") {
    return <motion.section {...commonProps}>{children}</motion.section>;
  }
  if (as === "article") {
    return <motion.article {...commonProps}>{children}</motion.article>;
  }
  return <motion.div {...commonProps}>{children}</motion.div>;
}
