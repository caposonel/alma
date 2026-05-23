"use client";

import { usePathname } from "@/i18n/navigation";
import { MailingBar } from "./MailingBar";

/**
 * Wrapper that hides the MailingBar on the /contact page (where the user
 * is already submitting a form). All other pages render the bar.
 *
 * Uses next-intl's locale-aware `usePathname` from `@/i18n/navigation` which
 * returns the locale-STRIPPED path. So both `/contact` (HE) and `/en/contact`
 * (EN) resolve to "/contact" — one equality check covers both locales.
 *
 * (Plain `next/navigation`'s `usePathname()` returned the locale-prefixed
 * path inconsistently across the router/SSR boundary, which let the bar
 * leak onto the HE contact page.)
 */
export function MailingBarVisible() {
  const pathname = usePathname();
  if (pathname === "/contact") return null;
  return <MailingBar />;
}
