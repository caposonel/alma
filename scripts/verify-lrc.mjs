/* Verify the baked LRC text matches what LRCLIB returns FRESH for each
 * track. Catches scenarios like LRCLIB having a different version
 * uploaded, or our bake script having matched the wrong song. */

import { readFileSync, writeFileSync } from "node:fs";

const content = JSON.parse(readFileSync("data/content.json", "utf-8"));
const ARTIST_VARIANTS = ["Alma Gov", "עלמה גוב", "Avner Tueg", "אבנר טואג"];

async function lrclibGet(track, artist) {
  const url = new URL("https://lrclib.net/api/get");
  url.searchParams.set("track_name", track);
  url.searchParams.set("artist_name", artist);
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-verify/1.0" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function findSynced(trackName) {
  for (const v of ARTIST_VARIANTS) {
    const r = await lrclibGet(trackName, v);
    if (r?.syncedLyrics && r.syncedLyrics.trim().length > 0) {
      return { synced: r.syncedLyrics, artist: v };
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  return null;
}

function firstLyricLine(lrcText) {
  for (const line of lrcText.split("\n")) {
    const m = line.match(/^\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*(.*)/);
    if (m && m[1].trim()) return m[1].trim();
  }
  return "(empty)";
}

console.log("slug\texpected_title\tlrclib_artist\tbaked_first_line\tfresh_first_line\tmatch");
const issues = [];
for (const t of content.lyrics ?? []) {
  if (!t.lyricsHe || !/^\[\d/.test(t.lyricsHe.trim())) continue;
  const fresh = await findSynced(t.titleHe);
  if (!fresh) {
    console.log(`${t.slug}\t${t.titleHe}\t(not found)\t${firstLyricLine(t.lyricsHe)}\t-\t✗`);
    issues.push({ slug: t.slug, issue: "no fresh LRCLIB match" });
    continue;
  }
  const bakedFirst = firstLyricLine(t.lyricsHe);
  const freshFirst = firstLyricLine(fresh.synced);
  const match = bakedFirst === freshFirst;
  console.log(
    `${t.slug}\t${t.titleHe}\t${fresh.artist}\t${bakedFirst}\t${freshFirst}\t${match ? "✓" : "✗"}`
  );
  if (!match) {
    issues.push({
      slug: t.slug,
      baked: bakedFirst,
      fresh: freshFirst,
    });
  }
  await new Promise((r) => setTimeout(r, 150));
}

console.error(`\nIssues: ${issues.length}`);
writeFileSync("scripts/lrc-issues.json", JSON.stringify(issues, null, 2));
