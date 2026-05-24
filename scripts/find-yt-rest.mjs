/* Search YouTube for the remaining non-karaoke tracks. */
import { writeFileSync } from "node:fs";

const QUERIES = [
  { slug: "bsibub", q: "עלמה גוב בסיבוב" },
  { slug: "meuchar-midai", q: "עלמה גוב מאוחר מידי" },
  { slug: "bli-milim", q: "עלמה גוב בלי מילים" },
  { slug: "beintayim-al-haadama", q: "עלמה גוב בינתיים על האדמה" },
  { slug: "mahu-hasikuy", q: "עלמה גוב מהו הסיכוי" },
  { slug: "shum-sikuy", q: "עלמה גוב שום סיכוי" },
  { slug: "im-tashir-oti-kach", q: "עלמה גוב אם תשאיר אותי כך" },
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
  const pick = results.find((r) => ALMA_AUTHOR.test(r.author));
  if (pick) {
    console.log(`${slug}\t${pick.id}\t${pick.title}\t${pick.author}`);
    baked.push({ slug, videoId: pick.id });
  } else {
    console.log(`${slug}\t(no match)\t-\t-`);
  }
  await new Promise((r) => setTimeout(r, 500));
}
console.error("\nFound:", baked.length, "/", QUERIES.length);
