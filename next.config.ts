import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    // Next 16 introduced a strict allowlist for the `quality` URL param
    // — any value not in this list returns a 400 from /_next/image.
    // We need 92 for the hero so the album cover isn't aggressively
    // re-encoded. Keeping 75 (the framework default) so other images
    // that don't pass an explicit quality keep working.
    qualities: [75, 92],
    remotePatterns: [
      {
        // Vercel Blob — every admin-uploaded image is served from here
        // once a Blob store is attached to the project.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // YouTube thumbnails are used as poster frames behind the lazy
        // YouTube iframes on the gallery / music pages.
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
  devIndicators: false,
  async headers() {
    /* Content Security Policy — defence-in-depth against XSS that could
     * land via the admin's free-text fields (diary markdown, lyric text,
     * site-settings overrides). Anything not enumerated here is blocked
     * by the browser.
     *
     *   default-src 'self'           — same-origin by default
     *   img-src ... data: blob:      — Vercel Blob + YouTube thumbs +
     *                                  inline data URIs (next/image LQIP)
     *   frame-src spotify + youtube  — embeds on /music & /gallery
     *   connect-src lrclib.net       — synced-lyrics fetch
     *   script-src 'unsafe-inline'   — Next 16 still inlines its runtime
     *                                  bootstrap; nonce-based CSP is on
     *                                  the roadmap but not landed yet
     *   style-src 'unsafe-inline'    — Tailwind v4 + framer-motion ship
     *                                  styles via the `style` attribute */
    /* In development, React + Next's HMR runtime use `eval()` for things
     * like reconstructing call stacks across the Server / Client component
     * boundary. We add `'unsafe-eval'` to `script-src` only in dev — in
     * production React never uses eval, so the tighter CSP applies and
     * any eval-based injection attack still gets blocked. */
     const scriptSrc =
       process.env.NODE_ENV === "production"
         ? "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com"
         : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com";

    const csp = [
      "default-src 'self'",
      // Spotify's oEmbed endpoint returns album-cover thumbnails on
      // `image-cdn-*.spotifycdn.com` (sometimes `i.scdn.co`) — used by
      // AlbumDiscography on /music. Without these the cover slots render
      // empty next to the album titles. Vercel Blob = admin uploads;
      // img.youtube.com = video poster frames.
      "img-src 'self' https://*.public.blob.vercel-storage.com https://img.youtube.com https://*.spotifycdn.com https://i.scdn.co data: blob:",
      // `'self'` is REQUIRED so the `/admin/edit` live-preview iframe can
      // load the public site (same-origin) for in-context editing. The
      // external entries are the YouTube + Spotify embeds used on /music
      // and the gallery. Without 'self' Chrome blocks the admin iframe
      // with a generic "This content is blocked" page even though
      // X-Frame-Options is SAMEORIGIN — CSP frame-src takes priority
      // over default-src for iframe loads, and an explicit frame-src
      // without 'self' means same-origin is implicitly denied.
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://open.spotify.com",
      "connect-src 'self' https://lrclib.net",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://api.web3forms.com",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // SAMEORIGIN (not DENY) so the `/admin/edit` live-preview iframe
          // can load the public site for in-context editing. Same-origin
          // embedding is safe because the admin lives on the same domain
          // and is auth-gated; the original clickjacking concern (a
          // third-party site framing us to trick users) is still prevented.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // CSP is the modern equivalent. `frame-ancestors 'self'` is
          // included above for defence-in-depth.
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
