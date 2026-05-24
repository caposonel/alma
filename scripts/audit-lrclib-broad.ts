/**
 * Broader LRCLIB audit — tries the title against multiple artist-name
 * variants AND the search endpoint, in case some tracks are indexed
 * under different attribution (e.g. duets with Avner Tueg credited as
 * "Avner Tueg" instead of "Alma Gov").
 */

import { promises as fs } from "node:fs";
import path from "node:path";

interface Track {
  slug: string;
  titleHe: string;
  releaseTitle?: string;
}

interface LrclibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | null;
}

async function searchLrclib(trackName: string): Promise<LrclibSearchResult[]> {
  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("track_name", trackName);
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-audit/1.0" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as LrclibSearchResult[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const contentPath = path.join(process.cwd(), "data", "content.json");
  const raw = await fs.readFile(contentPath, "utf-8");
  const content = JSON.parse(raw) as { lyrics?: Track[] };
  const tracks = content.lyrics ?? [];

  console.log(`Broad search across ${tracks.length} tracks (title-only)…\n`);

  const matches: { slug: string; titleHe: string; matches: LrclibSearchResult[] }[] = [];
  for (const t of tracks) {
    process.stdout.write(`  ${t.titleHe.padEnd(30)} `);
    const results = await searchLrclib(t.titleHe);
    // Filter to results where the artist name looks Alma-related
    const relevant = results.filter((r) => {
      const a = (r.artistName || "").toLowerCase();
      return (
        a.includes("alma") ||
        a.includes("gov") ||
        a.includes("עלמה") ||
        a.includes("avner") ||
        a.includes("אבנר") ||
        a.includes("tueg") ||
        a.includes("טואג")
      );
    });
    if (relevant.length === 0 && results.length > 0) {
      // Title matched but artist didn't — possible mismatched submission
      console.log(`(${results.length} title hits but no Alma-related artist)`);
    } else if (relevant.length === 0) {
      console.log("nothing");
    } else {
      const synced = relevant.filter(
        (r) => r.syncedLyrics && r.syncedLyrics.trim().length > 0
      );
      if (synced.length > 0) {
        console.log(`✓ SYNCED (${synced.length} matching submission(s))`);
        synced.forEach((s) => {
          console.log(`      → artist="${s.artistName}" id=${s.id}`);
        });
      } else {
        console.log(`plain only (${relevant.length} submission(s))`);
      }
      matches.push({ slug: t.slug, titleHe: t.titleHe, matches: relevant });
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log("\n---");
  const syncedCount = matches.filter((m) =>
    m.matches.some((r) => r.syncedLyrics && r.syncedLyrics.trim().length > 0)
  ).length;
  console.log(`Tracks with at least one synced LRC submission: ${syncedCount} / ${tracks.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
