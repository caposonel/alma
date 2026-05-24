"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useIsMobile } from "@/lib/use-is-mobile";

type MascotState = "idle" | "scrolling-up" | "scrolling-down" | "top" | "bottom" | "clicked";

// Triple-click the mascot inside this window to unlock the petal-trail cursor
// (see PetalTrail.tsx, which listens for the dispatched event).
const PETAL_UNLOCK_CLICKS = 3;
const PETAL_UNLOCK_WINDOW_MS = 3000;

/**
 * The outer gate. Conditionally mounts the actual mascot implementation
 * based on viewport width. This MATTERS for mobile performance: the
 * inner component subscribes to `useMotionValueEvent(scrollY, "change",
 * ...)` which fires on every scroll event. If the inner component is
 * mounted (even with an early return), the listener is still active —
 * each scroll forces a `document.documentElement.scrollHeight` read +
 * delta compute for nothing. Gating at the OUTER level means the hook
 * never runs at all on phones.
 */
export function AlmaMascot() {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return <MascotImpl />;
}

function MascotImpl() {
  const [state, setState] = useState<MascotState>("top");
  const [hearts, setHearts] = useState<number[]>([]);
  const { scrollY } = useScroll();
  const prefersReduced = useReducedMotion();
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  // Holds the click-animation reset timeout. We need a ref so the unmount
  // cleanup can clear it — previously a bare `setTimeout` 1.2s after a
  // click would still fire after navigation away, triggering setState on
  // an unmounted component (React dev warning).
  const clickResetTimerRef = useRef<number | null>(null);

  // Clear the click-reset timer on unmount.
  useEffect(() => {
    return () => {
      if (clickResetTimerRef.current !== null) {
        window.clearTimeout(clickResetTimerRef.current);
        clickResetTimerRef.current = null;
      }
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    const delta = latest - prev;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (latest <= 50) {
      setState("top");
    } else if (latest >= maxScroll - 50) {
      setState("bottom");
    } else if (Math.abs(delta) > 2) {
      setState(delta > 0 ? "scrolling-down" : "scrolling-up");
    } else {
      setState("idle");
    }
  });

  const handleClick = useCallback(() => {
    setState("clicked");
    const newHearts = Array.from({ length: 5 }, () => Date.now() + Math.random());
    setHearts(newHearts);
    if (clickResetTimerRef.current !== null) {
      window.clearTimeout(clickResetTimerRef.current);
    }
    clickResetTimerRef.current = window.setTimeout(() => {
      setState("idle");
      setHearts([]);
      clickResetTimerRef.current = null;
    }, 1200);

    // Petal-trail unlock — reach PETAL_UNLOCK_CLICKS within the window
    // and dispatch the event PetalTrail listens for.
    const now = Date.now();
    const isFastClick = now - lastClickTimeRef.current < PETAL_UNLOCK_WINDOW_MS;
    const nextCount = isFastClick ? clickCountRef.current + 1 : 1;
    clickCountRef.current = nextCount;
    lastClickTimeRef.current = now;

    if (nextCount >= PETAL_UNLOCK_CLICKS) {
      window.dispatchEvent(new CustomEvent("alma-petal-trail-unlock"));
      clickCountRef.current = 0;
    }
  }, []);

  const getRotation = () => {
    if (prefersReduced) return 0;
    switch (state) {
      case "scrolling-up": return -8;
      case "scrolling-down": return 8;
      case "clicked": return 360;
      default: return 0;
    }
  };

  const getScale = () => {
    if (state === "clicked") return 1.2;
    if (state === "bottom") return 0.85;
    return 1;
  };

  return (
    <div className="fixed bottom-20 end-4 z-30">
      {/* Hearts burst on click */}
      <AnimatePresence>
        {hearts.map((id, i) => (
          <motion.span
            key={id}
            initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 1,
              x: (i - 2) * 20,
              y: -30 - Math.random() * 30,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-blush-400 text-sm"
          >
            &#x2665;
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        animate={{
          rotate: getRotation(),
          scale: getScale(),
          y: state === "idle" && !prefersReduced ? [0, -3, 0] : 0,
        }}
        transition={
          state === "idle" && !prefersReduced
            ? { y: { duration: 2, repeat: Infinity, ease: "easeInOut" }, rotate: { type: "spring" } }
            : state === "clicked"
              ? { rotate: { duration: 0.6 }, scale: { type: "spring" } }
              : { type: "spring", damping: 15 }
        }
        className="relative cursor-pointer focus:outline-none"
        aria-label="מסקוט עלמה"
        title="לחצו עליי!"
      >
        <svg
          viewBox="0 0 50 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-10 text-pink-doodle"
        >
          {/* Flower petals */}
          <ellipse cx="25" cy="14" rx="5" ry="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="25" cy="14" rx="5" ry="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(72 25 22)" />
          <ellipse cx="25" cy="14" rx="5" ry="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(144 25 22)" />
          <ellipse cx="25" cy="14" rx="5" ry="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(216 25 22)" />
          <ellipse cx="25" cy="14" rx="5" ry="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(288 25 22)" />
          {/* Center face */}
          <circle cx="25" cy="22" r="5" fill="currentColor" opacity="0.25" />
          {/* Eyes */}
          {state === "bottom" ? (
            /* Sleeping — closed eyes */
            <>
              <path d="M22 21 Q23 22.5 24 21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <path d="M26 21 Q27 22.5 28 21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </>
          ) : (
            /* Awake — dot eyes */
            <>
              <circle cx="23" cy="21" r="0.8" fill="currentColor" />
              <circle cx="27" cy="21" r="0.8" fill="currentColor" />
            </>
          )}
          {/* Smile */}
          {state !== "bottom" && (
            <path
              d="M23 24 Q25 26 27 24"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          )}
          {/* Stem / body */}
          <path
            d="M25 27 Q25 38 23 48"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Leaf */}
          <path
            d="M24 36 Q29 33 32 36 Q29 39 24 36"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            fill="currentColor"
            fillOpacity="0.1"
          />
          {/* Tiny butterfly wings for waving state at top */}
          {state === "top" && (
            <>
              <path
                d="M30 16 Q36 12 38 16 Q36 20 30 18"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.4"
              />
              <path
                d="M30 18 Q36 20 36 24 Q32 22 30 18"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.3"
              />
            </>
          )}
          {/* Sleeping Zs */}
          {state === "bottom" && (
            <>
              <text x="32" y="17" fontSize="6" fill="currentColor" opacity="0.4">z</text>
              <text x="35" y="12" fontSize="4.5" fill="currentColor" opacity="0.3">z</text>
            </>
          )}
        </svg>
      </motion.button>
    </div>
  );
}
