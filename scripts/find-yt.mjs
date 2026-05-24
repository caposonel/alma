/* One-off: search YouTube for each missing track and report the top
 * Alma-related result. Output format: slug<TAB>id<TAB>title<TAB>author */
import { writeFileSync } from "node:fs";

const QUERIES = [
  { slug: "ma-laasot-im-hazeev", q: "עלמה גוב מה לעשות עם הזאב" },
  { slug: "al-temaher", q: "עלמה גוב אל תמהר" },
  { slug: "ze-beseder", q: "עלמה גוב זה בסדר" },
  { slug: "teref", q: "עלמה גוב טרף" },
  { slug: "od-shir-katan", q: "עלמה גוב עוד שיר קטן" },
  { slug: "lechabot-et-haorot", q: "עלמה גוב לכבות את האורות" },
  { slug: "lo-mevina-otcha-yoter", q: "עלמה גוב לא מבינה אותך יותר" },
  { slug: "shir-katan", q: "עלמה גוב שיר קטן" },
];

const ALMA_AUTHOR = /alma\s*gov|עלמה\s*גוב|avner\s*tueg|אבנר\s*טואג/i;

async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "he,en" },
  });
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
    if (results.length >= 15) break;
  }
  return results;
}

console.log("slug\tvideoId\ttitle\tauthor");
const baked = [];
for (const { slug, q } of QUERIES) {
  const results = await searchYouTube(q);
  // Pick top Alma-related hit
  const pick = results.find((r) => ALMA_AUTHOR.test(r.author));
  if (pick) {
    console.log(`${slug}\t${pick.id}\t${pick.title}\t${pick.author}`);
    baked.push({ slug, videoId: pick.id, title: pick.title, author: pick.author });
  } else {
    console.log(`${slug}\t(no match)\t-\t-`);
  }
  await new Promise((r) => setTimeout(r, 600));
}

console.error("\nBaked entries:", baked.length);
writeFileSync("scripts/yt-finds.json", JSON.stringify(baked, null, 2));
