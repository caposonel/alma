/**
 * Connection settings for the content database (Upstash Redis).
 *
 * Vercel writes these as environment variables when a database is connected
 * to the project, optionally behind a prefix. The current database is
 * connected with the prefix `ALMA` (→ `ALMA_KV_REST_API_URL`), while the
 * original, now-archived one used no prefix (`KV_REST_API_URL`). Prefer the
 * prefixed pair when it's complete, so a stale unprefixed pair can't win.
 */
function pick(): { url: string; token: string } | null {
  const pairs: Array<[string | undefined, string | undefined]> = [
    [process.env.ALMA_KV_REST_API_URL, process.env.ALMA_KV_REST_API_TOKEN],
    [process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN],
  ];
  for (const [url, token] of pairs) {
    if (url && token) return { url, token };
  }
  return null;
}

export const kvConfig = pick();
