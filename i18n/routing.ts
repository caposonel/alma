import { defineRouting } from "next-intl/routing";

/* English support was removed — the site is Hebrew-only. `/en/*` URLs
 * now 404 instead of resolving to translated pages, and any UI surface
 * that previously offered locale toggling has been stripped (Header
 * language switcher, AdminEdit workspace locale buttons).
 *
 * The `[locale]` URL segment IS preserved in the app directory because
 * removing it would require restructuring every public route file. With
 * a single locale and `localePrefix: "as-needed"`, next-intl resolves
 * the [locale] segment to "he" implicitly — URLs stay at `/`, `/music`,
 * `/diary`, etc., never `/he/...`. */
export const routing = defineRouting({
  locales: ["he"],
  defaultLocale: "he",
  localePrefix: "as-needed",
});
