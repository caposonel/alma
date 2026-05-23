import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * Custom admin panel auth.
 *
 * Single hard-coded admin user. The username defaults to "alma". The
 * password is checked against a bcrypt hash. The hash is read in priority
 * order from:
 *   1. `ADMIN_PASSWORD_HASH_B64` — base64-encoded raw bcrypt hash (preferred)
 *   2. `ADMIN_PASSWORD_HASH`     — raw bcrypt hash (legacy)
 *
 * Why base64? Bcrypt hashes contain `$` as a delimiter (e.g.
 * `$2b$10$...`). Next.js's env loader runs dotenv-expand on values and
 * treats `$2b`, `$10`, etc. as variable references — they all resolve to
 * undefined and the hash gets silently mangled at load time. Single
 * quotes don't help because Next strips the quotes as delimiters before
 * running expansion. Base64 sidesteps the issue entirely: no `$` in the
 * env value, so nothing to expand.
 *
 * `npm run admin:password <password>` prints both forms; paste the B64
 * one into `.env.local`.
 *
 * Sessions are JWT-only (no database adapter needed). The sign-in page is
 * the bare `/admin` route — see `app/admin/page.tsx`.
 */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "alma";

function loadAdminPasswordHash(): string | undefined {
  const b64 = process.env.ADMIN_PASSWORD_HASH_B64;
  if (b64 && b64.trim().length > 0) {
    try {
      const decoded = Buffer.from(b64.trim(), "base64").toString("utf8");
      // Sanity check — a real bcrypt hash always starts with $2 and is 60
      // chars long. Fail closed if the decode produced garbage.
      if (decoded.startsWith("$2") && decoded.length === 60) return decoded;
      console.warn(
        "[auth] ADMIN_PASSWORD_HASH_B64 decoded to an unexpected shape (length:",
        decoded.length,
        "starts:",
        JSON.stringify(decoded.slice(0, 4)),
        ") — ignoring."
      );
    } catch (err) {
      console.warn("[auth] ADMIN_PASSWORD_HASH_B64 base64 decode failed:", err);
    }
  }
  // Legacy fallback. Will likely be mangled by env-expand if the value
  // contains `$`; we warn about that explicitly so the fix path is obvious.
  const raw = process.env.ADMIN_PASSWORD_HASH;
  if (raw && raw.trim().length > 0) {
    if (!raw.startsWith("$2") || raw.length !== 60) {
      console.warn(
        "[auth] ADMIN_PASSWORD_HASH appears mangled (length:",
        raw.length,
        "starts:",
        JSON.stringify(raw.slice(0, 4)),
        "). Switch to ADMIN_PASSWORD_HASH_B64 — see auth.ts header for why."
      );
    }
    return raw;
  }
  return undefined;
}

const ADMIN_PASSWORD_HASH = loadAdminPasswordHash();

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!ADMIN_PASSWORD_HASH) return null;
        if (credentials?.username !== ADMIN_USERNAME) return null;

        const password = credentials?.password;
        if (typeof password !== "string") return null;

        const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!ok) return null;

        return {
          id: "admin",
          name: "Alma",
          email: "admin@almagov.co.il",
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  // NextAuth v5 looks for AUTH_SECRET automatically; this fallback keeps the
  // legacy NEXTAUTH_SECRET name working during the rename so existing
  // deployments / .env.local files don't immediately break sessions.
  //
  // In production, neither var being set would cause NextAuth to auto-
  // generate a secret on every cold start — which silently invalidates
  // every existing session whenever a new Vercel function spawns. Fail
  // fast at boot instead so the misconfig is loud.
  secret: (() => {
    const s = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (!s && process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET (or legacy NEXTAUTH_SECRET) must be set in production. Generate with `openssl rand -hex 32` and add to env."
      );
    }
    return s;
  })(),
});
