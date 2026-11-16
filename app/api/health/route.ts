import { NextResponse } from "next/server";
import { getKvClient } from "@/lib/admin-store";
import { kvConfig } from "@/lib/kv-env";

export const dynamic = "force-dynamic";

// Cached briefly at the edge: still fresh enough for diagnosis, but a flood
// of requests can't turn into a flood of database commands.
const HEALTH_CACHE = "public, s-maxage=30, stale-while-revalidate=30";

/**
 * Public health check for the content database (Vercel KV / Upstash Redis).
 *
 * Reports whether KV is configured and reachable, and how much content it
 * holds, so a "site shows placeholder content" problem can be diagnosed
 * from outside: unreachable (bad URL/token, archived store) vs. reachable
 * but empty (wrong or freshly created database). Deliberately exposes no
 * hostnames, tokens or content — only counts and an error code.
 */
export async function GET() {
  const configured = kvConfig !== null;
  if (!configured) {
    return NextResponse.json(
      { kv: { configured: false, reachable: false } },
      { headers: { "Cache-Control": HEALTH_CACHE } }
    );
  }

  const started = Date.now();
  try {
    const kv = await getKvClient();
    const [dbsize, lyrics, diary, settings] = await Promise.all([
      kv.dbsize(),
      kv.get<unknown[]>("lyrics"),
      kv.get<unknown[]>("diary:entries"),
      kv.exists("settings"),
    ]);
    return NextResponse.json(
      {
        kv: {
          configured: true,
          reachable: true,
          latencyMs: Date.now() - started,
          totalKeys: dbsize,
          lyrics: Array.isArray(lyrics) ? lyrics.length : 0,
          diaryEntries: Array.isArray(diary) ? diary.length : 0,
          hasSettings: settings === 1,
        },
      },
      { headers: { "Cache-Control": HEALTH_CACHE } }
    );
  } catch (err) {
    const e = err as { name?: string; code?: string; cause?: { code?: string } };
    // Only a short code/name — full messages can contain the hostname.
    const message = String((err as Error)?.message ?? "");
    const code =
      e?.cause?.code ??
      e?.code ??
      (/unauthori[sz]ed|WRONGPASS|invalid.*token/i.test(message)
        ? "UNAUTHORIZED"
        : e?.name ?? "UNKNOWN");
    return NextResponse.json(
      {
        kv: {
          configured: true,
          reachable: false,
          latencyMs: Date.now() - started,
          error: code,
        },
      },
      { status: 503, headers: { "Cache-Control": HEALTH_CACHE } }
    );
  }
}
