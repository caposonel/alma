"use client";

import { useEffect } from "react";

/**
 * Forces the window to scroll to top on mount. Used as a defensive fix for
 * pages where the framework's natural scroll restoration is leaving the user
 * mid-page or at the bottom (e.g. About page, where the scroll restoration
 * was inheriting position from the previous route's bottom).
 *
 * Renders nothing. Cheap, fires once per mount.
 */
export function ScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);
  return null;
}
