/**
 * Site-wide configuration constants.
 *
 * Anything that is essentially static-but-could-change-per-env lives here.
 * Social URLs are kept as fallback constants so that client components
 * (Header, Footer, Contact) can render synchronously. The admin panel
 * (`siteSettings.socialLinks`) can override these at the page/server level
 * when wired up.
 */

/**
 * Canonical public URL, used for sitemap, robots, canonical links and
 * social-share metadata. Resolution order:
 *   1. `NEXT_PUBLIC_SITE_URL` — explicit override.
 *   2. Vercel's production domain (set automatically on Vercel; becomes the
 *      custom domain once one is attached to the project).
 *   3. The current Vercel domain as a last resort.
 * It used to default to `almagov.co.il`, which isn't connected, so search
 * engines and share previews were pointed at a dead domain.
 */
const vercelProductionHost =
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelProductionHost
    ? `https://${vercelProductionHost}`
    : "https://alma-brown.vercel.app")
).replace(/\/$/, "");

/**
 * Fallback social URLs — used by the layout client components.
 * The admin panel `siteSettings.socialLinks` field can override these.
 */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/almagov__/",
  spotify: "https://open.spotify.com/artist/5BwDD7OLlEuoLxt0cTHaYv",
  youtube: "https://www.youtube.com/@almagov1399",
  appleMusic: "https://music.apple.com/us/artist/alma-gov/1562823201",
  bandcamp: "https://almagov.bandcamp.com",
} as const;

export const CONTACT_EMAIL = "almagov.music@gmail.com";
