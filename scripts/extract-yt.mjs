/* One-off: extract (videoId, title) pairs from a downloaded YouTube
 * channel HTML page. Reads from the user's temp dir directly. */
import { readFileSync } from "node:fs";

const html = readFileSync(
  "C:/Users/BOBI/AppData/Local/Temp/almapage.html",
  "utf-8"
);

// Each video on the channel page is represented by a richItemRenderer
// containing a lockupViewModel with a `contentId` (the video ID) and,
// later in the same block, a `title.content` field. The block can be
// up to ~10KB. We find every unique contentId, then search the
// following ~10KB for the title.
const visited = new Set();
const out = [];
const reId = /"contentId":"([a-zA-Z0-9_-]{11})"/g;
let m;
while ((m = reId.exec(html)) !== null) {
  if (visited.has(m[1])) continue;
  visited.add(m[1]);
  const tail = html.slice(m.index, m.index + 12000);
  const titleM = tail.match(/"title":\{"content":"([^"]+)"/);
  if (!titleM) continue;
  out.push({ id: m[1], title: titleM[1] });
}

for (const v of out) {
  console.log(`${v.id}\t${v.title}`);
}
console.error(`Total: ${out.length}`);
