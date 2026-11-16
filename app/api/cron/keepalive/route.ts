import { NextResponse } from "next/server";
import { getKvClient } from "@/lib/admin-store";
import { kvConfig } from "@/lib/kv-env";

export const dynamic = "force-dynamic";

/**
 * Daily keep-alive for the content database.
 *
 * Upstash archives free-plan databases that see no activity for a while,
 * which took the whole site down once. Pages are cached (ISR), so on a quiet
 * week the database can go untouched; a Vercel cron (vercel.json) calls this
 * once a day and writes a timestamp so there's always recent activity.
 *
 * Protection:
 *  - If CRON_SECRET is set in Vercel, only requests carrying it are accepted
 *    (Vercel's cron sends it as `Authorization: Bearer <secret>`).
 *  - Without it, the response is cached at the edge for an hour, so hammering
 *    the URL can't burn the database's monthly command quota.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const cache = secret
    ? "no-store"
    : "public, s-maxage=3600, stale-while-revalidate=60";

  if (!kvConfig) {
    return NextResponse.json(
      { ok: false, error: "not-configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  try {
    const kv = await getKvClient();
    const at = new Date().toISOString();
    await kv.set("meta:keepalive", at);
    return NextResponse.json(
      { ok: true, at },
      { headers: { "Cache-Control": cache } }
    );
  } catch (err) {
    const e = err as { name?: string; cause?: { code?: string } };
    return NextResponse.json(
      { ok: false, error: e?.cause?.code ?? e?.name ?? "UNKNOWN" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
