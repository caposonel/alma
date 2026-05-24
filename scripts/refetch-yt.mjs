/* Re-search YouTube for tracks where the baked videoId doesn't match
 * the actual title (per verify-yt.mjs output). Picks the top result
 * whose author is Alma-related AND whose title matches the track title.
 * Writes results to scripts/yt-refetch.json. */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const mismatchesPath = "scripts/yt-mismatches.json";
if (!existsSync(mismatchesPath)) {
  console.error("Run verify-yt.mjs first to generate yt-mismatches.json");
  process.exit(1);
}
const mismatches = JSON.parse(readFileSync(mismatchesPath, "utf-8"));

const ALMA_AUTHOR =
  /alma\s*gov|עלמה\s*גוב|avner\s*tueg|אבנר\s*טואג/i;

async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  let res;
  // Retry up to 3x with exponential backoff. YouTube occasionally
  // returns redirect loops or 429s when it detects automated traffic.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "he,en",
        },
        redirect: "follow",
      });
      if (res.ok) break;
    } catch (err) {
      console.error(`  attempt ${attempt + 1} failed:`, err?.message ?? err);
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  if (!res || !res.ok) return [];
  const html = await res.text();
  const results = [];
  const reId = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  const seen = new Set();
  let m;
  while ((m = reId.exec(html)) !== null) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const tail = html.slice(m.index, m.index + 6000);
    const titleM =
      tail.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) ||
      tail.match(/"title":\{"content":"([^"]+)"/);
    const authorM =
      tail.match(/"longBylineText":\{"runs":\[\{"text":"([^"]+)"/) ||
      tail.match(/"ownerText":\{"runs":\[\{"text":"([^"]+)"/);
    if (titleM && authorM) {
      results.push({ id: m[1], title: titleM[1], author: authorM[1] });
    }
    if (results.length >= 20) break;
  }
  return results;
}

function normalize(s) {
  return s
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/[/\\|()[\]]/g, " ")
    .replace(/קליפ|רשמי|מילים|דמו|live\s*session|חי באולפן/gi, "")
    .replace(/עלמה גוב|alma gov|אבנר טואג|avner tueg/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

console.log("slug\tnewYtId\tactualTitle\tauthor");
const out = [];
// Save progress after every iteration so a mid-run crash doesn't lose work.
const flush = () =>
  writeFileSync("scripts/yt-refetch.json", JSON.stringify(out, null, 2));
for (const m of mismatches) {
  // Search for "<artist> <title>"
  const q = `עלמה גוב ${m.titleHe}`;
  const results = await searchYouTube(q);
  // Pick top result whose author is Alma-related AND whose normalized
  // title contains the expected normalized title.
  const expectedN = normalize(m.titleHe);
  const pick = results.find(
    (r) =>
      ALMA_AUTHOR.test(r.author) &&
      (normalize(r.title).includes(expectedN) ||
        expectedN.includes(normalize(r.title)))
  );
  if (pick) {
    console.log(`${m.slug}\t${pick.id}\t${pick.title}\t${pick.author}`);
    out.push({ slug: m.slug, videoId: pick.id, title: pick.title });
  } else {
    console.log(`${m.slug}\t(no clean match)\t-\t-`);
    out.push({ slug: m.slug, videoId: null });
  }
  flush();
  // Longer delay to avoid YouTube anti-bot redirects.
  await new Promise((r) => setTimeout(r, 2000));
}
console.error(`\nResults: ${out.filter((x) => x.videoId).length}/${out.length} resolved`);
