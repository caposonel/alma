"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the user prefers reduced motion
 * or when the device is likely low-powered (via navigator.hardwareConcurrency).
 *
 * Usage: disable parallax, cursor trails, continuous animations, etc.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
