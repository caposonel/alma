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
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
      };

  // Enter-only transition, in two layers:
  //  - The outer AnimatePresence (initial={false}) has ONE stable child, so
  //    it never runs an exit and never keeps an old copy mounted. In the
  //    App Router that exiting copy re-rendered the NEW route (children
  //    reads the router context), mounting every page twice and letting
  //    the old copy's unmount cleanups clobber shared state (e.g. the music
  //    mini-player). Its job now is only `initial={false}`: on first load
  //    every animated element inside starts in its final, visible state
  //    (no hidden-until-revealed content in the server-rendered page).
  //  - The inner div is keyed on the pathname, so client-side navigations
  //    remount it and replay the fade-in for the new page.
  // `perspective` must live on the parent of the rotating element.
  return (
    <div style={isLetterRoute ? { perspective: 1200 } : undefined}>
      <AnimatePresence initial={false}>
        <motion.div key="page-transition-root">
          <motion.div
            key={pathname}
            initial={isFirstRender.current ? false : variants.initial}
            animate={variants.animate}
            transition={{
              duration: isLetterRoute ? 0.35 : 0.18,
              ease: "easeInOut",
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
