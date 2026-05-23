"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Daisy, Heart } from "@/components/decorative";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface Petal {
  id: number;
  x: number;
  y: number;
  variant: "daisy" | "heart";
}

/** Total trail lifetime after the unlock event fires. */
const TRAIL_DURATION_MS = 30_000;
/** Minimum pixel distance between successive petal spawns. */
const MIN_DISTANCE = 80;
/** Cap concurrent petals so heavy cursor flicks don't flood the DOM. */
const MAX_CONCURRENT = 8;
/** Per-petal fade-out duration — used for cleanup timing. */
const PETAL_LIFETIME_MS = 1500;

/**
 * Hidden easter egg: triple-click the AlmaMascot to unlock a 30-second
 * petal trail that follows the cursor.
 *
 * Listens for the global `alma-petal-trail-unlock` event dispatched by
 * `AlmaMascot.tsx`. While active, mousemove drops a daisy or heart at
 * the cursor every `MIN_DISTANCE` pixels; each petal floats down a bit
 * and fades out over 1.5s.
 *
 * Touch devices: skipped implicitly (mousemove doesn't fire on touch).
 * Respects `prefers-reduced-motion`: never activates.
 */
export function PetalTrail() {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [petals, setPetals] = useState<Petal[]>([]);
  // Persist the unlock-deactivation timer across renders so the effect
  // cleanup can actually clear it on unmount. Previously the timeout was
  // declared inside the event handler with a `return cleanup` that
  // `addEventListener` ignores — so unmounting mid-trail left the setState
  // pending and warned about state on an unmounted component.
  const deactivateTimerRef = useRef<number | null>(null);

  // Listen for the unlock event from the mascot.
  useEffect(() => {
    function onUnlock() {
      if (reducedMotion) return;
      setActive(true);
      if (deactivateTimerRef.current !== null) {
        window.clearTimeout(deactivateTimerRef.current);
      }
      deactivateTimerRef.current = window.setTimeout(() => {
        setActive(false);
        deactivateTimerRef.current = null;
      }, TRAIL_DURATION_MS);
    }
    window.addEventListener("alma-petal-trail-unlock", onUnlock);
    return () => {
      window.removeEventListener("alma-petal-trail-unlock", onUnlock);
      if (deactivateTimerRef.current !== null) {
        window.clearTimeout(deactivateTimerRef.current);
        deactivateTimerRef.current = null;
      }
    };
  }, [reducedMotion]);

  // Track mouse movement while active.
  useEffect(() => {
    if (!active || reducedMotion) return;

    let lastX = 0;
    let lastY = 0;
    let nextId = 0;
    const timeouts: number[] = [];

    function onMove(e: MouseEvent) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.hypot(dx, dy) < MIN_DISTANCE) return;
      lastX = e.clientX;
      lastY = e.clientY;

      const petal: Petal = {
        id: nextId++,
        x: e.clientX,
        y: e.clientY,
        variant: Math.random() > 0.5 ? "daisy" : "heart",
      };

      setPetals((prev) => [...prev.slice(-(MAX_CONCURRENT - 1)), petal]);

      const t = window.setTimeout(() => {
        setPetals((prev) => prev.filter((p) => p.id !== petal.id));
      }, PETAL_LIFETIME_MS);
      timeouts.push(t);
    }

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [active, reducedMotion]);

  if (!active || reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {petals.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 0.4 }}
            animate={{
              x: p.x + (Math.random() - 0.5) * 20,
              y: p.y + 40,
              opacity: 0,
              scale: 0.8,
              rotate: (Math.random() - 0.5) * 30,
            }}
            transition={{ duration: PETAL_LIFETIME_MS / 1000, ease: "easeOut" }}
          >
            {p.variant === "daisy" ? (
              <Daisy className="h-5 w-5 text-blush-400 opacity-70" />
            ) : (
              <Heart className="h-4 w-4 text-blush-500 opacity-70" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
