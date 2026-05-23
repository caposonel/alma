import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import type { Session } from "next-auth";
import { auth } from "./auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Combined proxy (formerly middleware.ts).
 *
 * Next.js 16 deprecated the `middleware.ts` filename in favour of `proxy.ts`
 * and Next 17 will turn the old name into a hard error. The behaviour is
 * identical — same handler signature, same config matcher.
 *
 * - `/admin/*` is the custom CMS — gated by a NextAuth session. `/admin`
 *   itself (the login page) is always open; anything below requires auth.
 * - Everything else routes through next-intl so locale prefixes still work.
 * - `/api/*`, `/_next/*`, `/_vercel/*`, and any path with a `.` (static
 *   files) are excluded from this middleware via the matcher below.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin tree is English-only, not localized. Bypass next-intl entirely.
  if (pathname.startsWith("/admin")) {
    // The bare `/admin` is the login page — always allow.
    if (pathname === "/admin") {
      return NextResponse.next();
    }
    // Any deeper admin route requires a session.
    let session: Session | null = null;
    try {
      session = await auth();
    } catch (err) {
      // If auth() throws (e.g. missing AUTH_SECRET in dev) treat it as no
      // session and bounce to the login page. The login page itself will
      // surface the underlying error.
      console.error("[admin proxy] auth() threw:", err);
      session = null;
    }
    if (!session?.user) {
      const signInUrl = new URL("/admin", request.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // Everything else — let next-intl do its thing.
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for API, _next, _vercel, and static files.
  // `/admin/*` IS matched (so the gate above runs).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
