/* Verify every YouTube ID we baked into content.json by hitting YouTube's
 * oEmbed endpoint (public, no auth) and comparing the actual title to
 * the track's titleHe. Reports mismatches so we can fix them. */

import { readFileSync, writeFileSync } from "node:fs";

const content = JSON.parse(
  readFileSync("data/content.json", "utf-8")
);
const tracks = (content.lyrics ?? []).filter((t) => !!t.youtubeId);

async function oembedTitle(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "alma-gov/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title ?? "", author: data.author_name ?? "" };
  } catch {
    return null;
  }
}

/** Strip common YouTube title clutter for fuzzy comparison. */
function normalize(s) {
  return s
    .replace(/[֐-׿\s]/g, (c) => c) // keep Hebrew + spaces
    .replace(/\(.*?\)|\[.*?\]/g, "") // strip (parens) and [brackets]
    .replace(/[/\\|()\[\]]/g, " ")
    .replace(/קליפ|רשמי|מילים|דמו|live\s*session|חי באולפן/gi, "")
    .replace(/עלמה גוב|alma gov|אבנר טואג|avner tueg/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

console.log("slug\tytId\texpected\tactual\tmatch");
const mismatches = [];
for (const t of tracks) {
  const data = await oembedTitle(t.youtubeId);
  if (!data) {
    console.log(`${t.slug}\t${t.youtubeId}\t${t.titleHe}\t(oEmbed failed)\t?`);
    continue;
  }
  const expectedN = normalize(t.titleHe);
  const actualN = normalize(data.title);
  const match = actualN.includes(expectedN) || expectedN.includes(actualN);
  console.log(
    `${t.slug}\t${t.youtubeId}\t${t.titleHe}\t${data.title}\t${match ? "✓" : "✗"}`
  );
  if (!match) {
    mismatches.push({
      slug: t.slug,
      titleHe: t.titleHe,
      currentYt: t.youtubeId,
      currentYtTitle: data.title,
    });
  }
  await new Promise((r) => setTimeout(r, 120));
}

console.error(`\nMismatches: ${mismatches.length}`);
writeFileSync("scripts/yt-mismatches.json", JSON.stringify(mismatches, null, 2));
