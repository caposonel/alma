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
    // CSP intentionally NOT set. We tried adding a tight Content-Security-
    // Policy as defence-in-depth, but it kept blocking legitimate
    // third-party integrations (Spotify IFrame SDK script + image CDN,
    // same-origin admin iframe, React dev-mode eval-based debugging) and
    // each round of patching just surfaced the next blocked resource.
    // The site has no untrusted-user-content surface — admin is the only
    // writer and all writes are auth-gated — so the XSS-attack vector
    // CSP defends against is essentially absent here. If we revisit CSP
    // later, do it iteratively: set the header to `Content-Security-
    // Policy-Report-Only` first, collect violation reports for a week,
    // then switch to enforcing.
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
