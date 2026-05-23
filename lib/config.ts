/**
 * Site-wide configuration constants.
 *
 * Anything that is essentially static-but-could-change-per-env lives here.
 * Social URLs are kept as fallback constants so that client components
 * (Header, Footer, Contact) can render synchronously. The admin panel
 * (`siteSettings.socialLinks`) can override these at the page/server level
 * when wired up.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://almagov.co.il";

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
