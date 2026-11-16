"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { MailingBar } from "./MailingBar";

/**
 * Wrapper that hides the MailingBar on the /contact page (where the user
 * is already submitting a form). All other pages render the bar.
 *
 * Uses next-intl's locale-aware `usePathname` from `@/i18n/navigation` which
 * returns the locale-STRIPPED path, so one equality check covers the route.
 * (Plain `next/navigation`'s `usePathname()` returned the locale-prefixed
 * path inconsistently across the router/SSR boundary.)
 */
export function MailingBarVisible() {
  const pathname = usePathname();
  const hidden = pathname === "/contact";

  // No bar → no space reserved for it below the footer.
  useEffect(() => {
    if (hidden) {
      document.documentElement.style.setProperty("--mailing-bar-h", "0px");
    }
  }, [hidden]);

  if (hidden) return null;
  return <MailingBar />;
}
