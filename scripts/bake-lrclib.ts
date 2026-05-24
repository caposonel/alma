/**
 * One-shot script: fetch synced LRC lyrics for every track in
 * data/content.json from LRCLIB, then write the LRC text directly into
 * each track's `lyricsHe` field. Tracks without LRCLIB coverage have
 * their `lyricsHe` cleared to an empty string.
 *
 * After running this:
 *   - data/content.json has karaoke timing data baked in
 *   - The runtime music page detects LRC format on each track's
 *     lyricsHe via `looksLikeLRC` and karaoke-renders without any
 *     network call to LRCLIB
 *   - Tracks with empty `lyricsHe` simply don't show the lyrics card
 *     (per the MusicPlayerSection gate)
 *
 * Usage:
 *   npx tsx scripts/bake-lrclib.ts        # writes content.json
 *   npx tsx scripts/bake-lrclib.ts --dry  # show what WOULD change
 *
 * No env vars needed — LRCLIB is public, no auth.
 *
 * After this script succeeds, run:
 *   npm run migrate:kv
 * to push the baked content.json up to production Vercel KV.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

interface Track {
  slug: string;
  titleHe: string;
  spotifyTrackId?: string;
  releaseTitle?: string;
  releaseDate?: string;
  lyricsHe?: string;
}

interface LrclibGetResponse {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | null;
}

interface LrclibSearchResult {
  artistName?: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | null;
}

const ARTIST_VARIANTS = ["Alma Gov", "עלמה גוב", "Avner Tueg", "אבנר טואג"];
const ALMA_ARTIST_REGEX = /alma\s*gov|עלמה\s*גוב|avner\s*tueg|אבנר\s*טואג/i;

async function getOne(
  trackName: string,
  artistName: string
): Promise<LrclibGetResponse | null> {
  const url = new URL("https://lrclib.net/api/get");
  url.searchParams.set("track_name", trackName);
  url.searchParams.set("artist_name", artistName);
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-bake/1.0" },
    });
    if (!res.ok) return null;
    return (await res.json()) as LrclibGetResponse;
  } catch {
    return null;
  }
}

async function searchFuzzy(trackName: string): Promise<LrclibSearchResult | null> {
  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("track_name", trackName);
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-bake/1.0" },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as LrclibSearchResult[];
    if (!Array.isArray(results)) return null;
    const relevant = results.filter((r) =>
      ALMA_ARTIST_REGEX.test(r.artistName ?? "")
    );
    return (
      relevant.find(
        (r) => r.syncedLyrics && r.syncedLyrics.trim().length > 0
      ) ?? null
    );
  } catch {
    return null;
  }
}

/** Returns the raw LRC text (with [mm:ss.xx] prefixes) or null. */
async function findSyncedLRC(trackName: string): Promise<string | null> {
  // Strict /get with each artist variant first
  for (const variant of ARTIST_VARIANTS) {
    const r = await getOne(trackName, variant);
    if (r?.syncedLyrics && r.syncedLyrics.trim().length > 0) {
      return r.syncedLyrics;
    }
    await sleep(80);
  }
  // Fuzzy /search fallback — only matches Alma-related artists
  const sr = await searchFuzzy(trackName);
  if (sr?.syncedLyrics && sr.syncedLyrics.trim().length > 0) {
    return sr.syncedLyrics;
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry") || args.has("--dry-run");

  const contentPath = path.join(process.cwd(), "data", "content.json");
  const raw = await fs.readFile(contentPath, "utf-8");
  const content = JSON.parse(raw) as { lyrics?: Track[] };
  const tracks = content.lyrics ?? [];

  console.log(
    `Baking LRCLIB sync data into ${tracks.length} tracks${dryRun ? " (DRY RUN)" : ""}…\n`
  );

  let baked = 0;
  let cleared = 0;
  let preserved = 0;

  for (const track of tracks) {
    process.stdout.write(`  ${track.titleHe.padEnd(30)} `);
    // If the existing lyricsHe already looks like LRC, skip LRCLIB lookup
    // and preserve it — this is a manually-pasted LRC entry.
    const existing = track.lyricsHe ?? "";
    if (looksLikeLRC(existing)) {
      console.log(`(preserved — admin-pasted LRC, ${countLrcLines(existing)} lines)`);
      preserved++;
      continue;
    }

    const lrc = await findSyncedLRC(track.titleHe);
    if (lrc) {
      const lineCount = countLrcLines(lrc);
      console.log(`✓ baked (${lineCount} lines)`);
      if (!dryRun) track.lyricsHe = lrc;
      baked++;
    } else {
      console.log(`✗ cleared (no LRC)`);
      if (!dryRun) track.lyricsHe = "";
      cleared++;
    }
    await sleep(150);
  }

  console.log("\n---");
  console.log(`Baked:     ${baked}`);
  console.log(`Cleared:   ${cleared}`);
  console.log(`Preserved: ${preserved}`);
  console.log(`Total:     ${tracks.length}`);

  if (dryRun) {
    console.log("\nDry run — content.json NOT modified.");
    return;
  }

  await fs.writeFile(contentPath, JSON.stringify(content, null, 2));
  console.log(`\n✓ Wrote ${contentPath}`);
  console.log(
    "\nNext: `npm run migrate:kv` to push this to production Vercel KV."
  );
}

function looksLikeLRC(text: string): boolean {
  if (!text) return false;
  for (const line of text.split("\n").slice(0, 5)) {
    if (/^\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/.test(line.trim())) return true;
  }
  return false;
}

function countLrcLines(lrc: string): number {
  let count = 0;
  for (const line of lrc.split("\n")) {
    if (/^\[\d{1,2}:\d{2}/.test(line.trim())) count++;
  }
  return count;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
