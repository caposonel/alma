import "server-only";

// Imported lazily: auth.ts is also loaded by the proxy (middleware), which
// shouldn't pull in the storage module unless a login actually happens.
async function getKvClient() {
  return (await import("@/lib/admin-store")).getKvClient();
}

/**
 * Throttles failed admin logins per client IP: after MAX_FAILURES failures
 * within WINDOW_SECONDS, further attempts are refused until the window ends.
 *
 * Counts live in KV when it's configured (shared across serverless
 * instances), otherwise in memory (local dev). If KV is unreachable the
 * limiter fails open, so a database outage can't lock the admin out.
 */
const MAX_FAILURES = 10;
const WINDOW_SECONDS = 15 * 60;

const memory = new Map<string, { count: number; resetAt: number }>();

function key(ip: string) {
  return `login-fail:${ip}`;
}

export function clientIp(request: Request | undefined): string {
  const fwd = request?.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request?.headers.get("x-real-ip") || "unknown";
}

export async function isLoginBlocked(ip: string): Promise<boolean> {
  if (process.env.KV_REST_API_URL) {
    try {
      const kv = await getKvClient();
      const count = (await kv.get<number>(key(ip))) ?? 0;
      return count >= MAX_FAILURES;
    } catch {
      return false;
    }
  }
  const entry = memory.get(ip);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= MAX_FAILURES;
}

export async function recordLoginFailure(ip: string): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    try {
      const kv = await getKvClient();
      const count = await kv.incr(key(ip));
      if (count === 1) await kv.expire(key(ip), WINDOW_SECONDS);
    } catch {
      /* fail open */
    }
    return;
  }
  const now = Date.now();
  const entry = memory.get(ip);
  if (!entry || entry.resetAt < now) {
    memory.set(ip, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
  } else {
    entry.count += 1;
  }
}
