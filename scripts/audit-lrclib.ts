/**
 * One-off audit: query LRCLIB for every track in data/content.json and
 * report which have synced (LRC) timing data vs only plain text vs
 * nothing at all. Output to stdout as a markdown table for easy review.
 *
 * Usage:
 *   npx tsx scripts/audit-lrclib.ts
 *
 * No env vars needed — LRCLIB is public, no auth.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

interface Track {
  slug: string;
  titleHe: string;
  spotifyTrackId?: string;
  releaseTitle?: string;
  releaseDate?: string;
}

interface LrclibResponse {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | null;
}

type Coverage = "synced" | "plain-only" | "none" | "error";

interface AuditRow {
  slug: string;
  titleHe: string;
  releaseTitle?: string;
  coverage: Coverage;
  syncedLineCount?: number;
}

async function queryOne(
  trackName: string,
  artistName: string
): Promise<LrclibResponse | null> {
  const url = new URL("https://lrclib.net/api/get");
  url.searchParams.set("track_name", trackName);
  url.searchParams.set("artist_name", artistName);
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-audit/1.0" },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as LrclibResponse;
  } catch (err) {
    console.error(`  ✗ Error for "${trackName}":`, err);
    return null;
  }
}

const ARTIST_VARIANTS = ["Alma Gov", "עלמה גוב", "Avner Tueg", "אבנר טואג"];
const ALMA_ARTIST_REGEX = /alma\s*gov|עלמה\s*גוב|avner\s*tueg|אבנר\s*טואג/i;

async function queryLrclib(trackName: string): Promise<LrclibResponse | null> {
  // Step 1: try /get with each artist variant.
  let best: LrclibResponse | null = null;
  for (const variant of ARTIST_VARIANTS) {
    const r = await queryOne(trackName, variant);
    if (!r) continue;
    if (r.syncedLyrics && r.syncedLyrics.trim().length > 0) return r;
    if (!best) best = r;
    await new Promise((res) => setTimeout(res, 80));
  }
  // Step 2: fuzzy /search fallback if no /get returned synced data.
  try {
    const url = new URL("https://lrclib.net/api/search");
    url.searchParams.set("track_name", trackName);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-audit/1.0" },
    });
    if (res.ok) {
      const results = (await res.json()) as Array<{
        artistName?: string;
        syncedLyrics?: string | null;
        plainLyrics?: string | null;
      }>;
      if (Array.isArray(results)) {
        const relevant = results.filter((r) =>
          ALMA_ARTIST_REGEX.test(r.artistName ?? "")
        );
        const synced = relevant.find(
          (r) => r.syncedLyrics && r.syncedLyrics.trim().length > 0
        );
        if (synced) {
          return {
            syncedLyrics: synced.syncedLyrics,
            plainLyrics: synced.plainLyrics ?? null,
          };
        }
      }
    }
  } catch {
    /* swallow */
  }
  return best;
}

function countLrcLines(lrc: string): number {
  const lines = lrc.split("\n");
  let count = 0;
  for (const line of lines) {
    if (/^\[\d{1,2}:\d{2}/.test(line.trim())) count++;
  }
  return count;
}

async function main(): Promise<void> {
  const contentPath = path.join(process.cwd(), "data", "content.json");
  const raw = await fs.readFile(contentPath, "utf-8");
  const content = JSON.parse(raw) as { lyrics?: Track[] };
  const tracks = content.lyrics ?? [];

  console.log(`Auditing ${tracks.length} tracks against LRCLIB…\n`);

  const rows: AuditRow[] = [];
  let synced = 0;
  let plainOnly = 0;
  let none = 0;
  let errors = 0;

  for (const t of tracks) {
    process.stdout.write(`  ${t.titleHe.padEnd(30)} `);
    const result = await queryLrclib(t.titleHe);
    let coverage: Coverage;
    let syncedLineCount: number | undefined;
    if (result === null) {
      coverage = "none";
      none++;
      console.log("none");
    } else if (result.syncedLyrics && result.syncedLyrics.trim().length > 0) {
      coverage = "synced";
      syncedLineCount = countLrcLines(result.syncedLyrics);
      synced++;
      console.log(`SYNCED (${syncedLineCount} lines)`);
    } else if (result.plainLyrics && result.plainLyrics.trim().length > 0) {
      coverage = "plain-only";
      plainOnly++;
      console.log("plain only");
    } else {
      coverage = "none";
      none++;
      console.log("none");
    }
    rows.push({
      slug: t.slug,
      titleHe: t.titleHe,
      releaseTitle: t.releaseTitle,
      coverage,
      syncedLineCount,
    });
    // Be polite to LRCLIB
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log("\n---");
  console.log("Summary:");
  console.log(`  Karaoke-ready (synced):  ${synced} / ${tracks.length}`);
  console.log(`  Plain text only:         ${plainOnly} / ${tracks.length}`);
  console.log(`  No LRCLIB data at all:   ${none} / ${tracks.length}`);
  console.log(`  Errors:                  ${errors} / ${tracks.length}`);
  console.log("\n---\n");
  console.log("| Title | Release | Coverage |");
  console.log("|-------|---------|----------|");
  for (const r of rows) {
    const cov =
      r.coverage === "synced"
        ? `✓ synced (${r.syncedLineCount} lines)`
        : r.coverage === "plain-only"
          ? "○ plain only"
          : "✗ none";
    console.log(`| ${r.titleHe} | ${r.releaseTitle ?? ""} | ${cov} |`);
  }

  // Also dump the synced slugs as a JSON list for the next step
  const syncedSlugs = rows.filter((r) => r.coverage === "synced").map((r) => r.slug);
  console.log("\n---\nSlugs WITH LRCLIB karaoke (keep these):");
  console.log(JSON.stringify(syncedSlugs, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
