"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { audioManager } from "@/lib/audio";

interface PageTransitionProps {
  children: React.ReactNode;
}

// "Letter" routes get a 3D page-flip transition to match the page-turn audio
// cue already wired below. Matches `/diary/[slug]` and `/lyrics/[slug]`,
// with or without an `/en` locale prefix.
const LETTER_ROUTE_RE = /^\/(?:en\/)?(?:diary|lyrics)\/[^/]+/;

/**
 * Wraps page content with a route-change transition. Most routes get a
 * snappy fade + slight slide. The diary and lyrics letter routes get a
 * gentle Y-axis page-flip instead, matching the existing page-turn sound.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    audioManager.play("page-turn");
  }, [pathname]);

  const isLetterRoute = LETTER_ROUTE_RE.test(pathname);

  const variants = isLetterRoute
    ? {
        initial: { rotateY: 8, opacity: 0 },
        animate: { rotateY: 0, opacity: 1 },
        exit: { rotateY: -8, opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

  // `perspective` must live on the parent of the rotating element to take
  // effect — applying it on the rotating div itself is a no-op.
  return (
    <div style={isLetterRoute ? { perspective: 1200 } : undefined}>
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{
            duration: isLetterRoute ? 0.35 : 0.18,
            ease: "easeInOut",
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
