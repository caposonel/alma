import { NextResponse } from "next/server";
import { fetchLyrics } from "@/lib/lrclib";

export const dynamic = "force-dynamic";

/**
 * Public-facing LRCLIB proxy.
 *
 * Without throttling this is an open relay that anyone could point at the
 * upstream lyrics service. We apply the same in-memory IP-based rate limit
 * pattern the contact form uses (`app/[locale]/(site)/contact/_submit.ts`):
 * - 20 requests per IP per hour (lyrics fetch is read-heavy / cacheable so
 *   higher than the 5/hr contact write cap)
 * - IP read from `x-forwarded-for`
 * - 429 when exceeded
 * - IPs hashed (djb2) so we never persist raw addresses in memory.
 *
 * Resets on cold start, which is fine for a low-traffic site behind Vercel's
 * regional functions.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20;
const requests = new Map<string, number[]>();

function hashIp(ip: string): string {
  // djb2-style — matches the contact form helper. Not cryptographic; just
  // keeps the in-memory keys opaque so debugging dumps don't expose IPs.
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h |= 0;
  }
  return `ip_${Math.abs(h).toString(36)}`;
}

function clientIpKey(request: Request): string {
  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return hashIp(rawIp);
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (requests.get(key) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    requests.set(key, recent);
    return true;
  }
  recent.push(now);
  requests.set(key, recent);
  return false;
}

export async function GET(request: Request) {
  const ipKey = clientIpKey(request);
  if (isRateLimited(ipKey)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track");
  const artist = searchParams.get("artist");
  if (!track || !artist) {
    return NextResponse.json({ error: "Missing track or artist" }, { status: 400 });
  }
  // Length limits to prevent abuse
  if (track.length > 200 || artist.length > 200) {
    return NextResponse.json({ error: "Parameter too long" }, { status: 400 });
  }
  try {
    const lyrics = await fetchLyrics(track, artist);
    if (!lyrics) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(lyrics);
  } catch (err) {
    console.error("lyrics route error:", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
