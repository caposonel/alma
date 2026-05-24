"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` when the viewport is narrower than 768px (the Tailwind
 * `md:` breakpoint) — used to skip expensive mobile-unfriendly work like
 * the WebGL paper shader, the ~85 FloatingDoodle instances, the
 * scroll-progress spring, and various Framer Motion wrappers that don't
 * play well on touch devices.
 *
 * SSR-safe: initial value is `false` (desktop assumption), then flips on
 * mount once `window.matchMedia` is available. That means the SERVER
 * always renders the desktop variant; mobile users get a one-frame
 * "flash" of desktop layout that's gone before paint. For decorative
 * components (where the mobile branch is "render nothing"), this is
 * fine — the doodles just won't appear at all on phones.
 *
 * Live-updates on resize/rotation via `matchMedia` change events.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Returns `true` when the device's primary input has no hover capability
 * (i.e. touchscreens — phones, tablets, some convertibles). Use this to
 * skip hover-only UX patterns that are dead weight on touch:
 *
 *   - `:hover` styled buttons (no visual feedback on tap)
 *   - `onMouseEnter` audio cues (iOS synthesizes mouse events from taps,
 *     causing audio to fire on EVERY tap)
 *   - Framer Motion `whileHover` springs (overhead without payoff)
 *
 * SSR-safe: initial `false`, flips after mount via matchMedia.
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: none)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isTouch;
}
