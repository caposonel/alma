/**
 * One-shot script: bake hardcoded YouTube video IDs into each AdminLyric
 * in data/content.json. Discovered via scripts/extract-yt.mjs and
 * scripts/find-yt.mjs (against her channel + YouTube search).
 *
 * After running:
 *   npx tsx scripts/bake-youtube.ts
 * Then push to production KV:
 *   npm run migrate:kv
 */

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * slug → 11-char YouTube video ID. Pulled from a search of her channel
 * + YouTube-wide search filtered to her artist topic channel.
 *
 * Some entries skipped:
 *   - mahu-hasikuy   : no real match found, search returned wrong song
 *
 * Some entries are duos of the same audio:
 *   - od-shir-katan + shir-katan → same video TfAO44Ft0gQ
 *     (LRCLIB's fuzzy match also returned the same entry — they're
 *     possibly the same song under different titles in Alma's catalog,
 *     or one is a mis-titled admin entry)
 */
/* ALL IDs verified against YouTube oEmbed on 2026-05-24. The earlier
 * mapping had an off-by-one bug in the channel-page extraction (regex
 * paired each videoId with the NEXT title in the JSON dump). All
 * mismatches were re-fetched via YouTube search (which queries YT's own
 * index with author filter to Alma-related channels). */
const YOUTUBE_IDS: Record<string, string> = {
  // 16 karaoke tracks
  "shir-varod": "ucovqKLT9-k", // official clip
  "ma-laasot-im-hazeev": "P1cKG1iG59Q",
  "lifney-shehakol-nirdam": "UJtWTWedOWs", // FIXED (was snUVtjUvZSk = פתיחה??)
  "olam-sheli": "myAz0gBpRWo", // FIXED (was RTZxnN0iNVA = מחכה לזה)
  "ze-hasof": "sgMNWs-oEog", // FIXED (was M29o4jLOsW8 = אש ומים)
  "shuv-bamidbar": "R41N4QtnXS0", // FIXED (was 31b4bdlVdIQ = זה הסוף)
  "obsesia-2": "Ymn9jDsg7Q0", // FIXED (was sgMNWs-oEog = זה הסוף)
  "al-temaher": "umcBKQIdsKI",
  "ze-beseder": "OFmdJz3KYpI",
  "teref": "J1hixtopXdY",
  "bein-haetzbaot": "WBh0QhZp4-c", // FIXED (was Ymn9jDsg7Q0 = אובססיה 2)
  "od-shir-katan": "TfAO44Ft0gQ",
  "lechabot-et-haorot": "CyhuBnuaHWg",
  "lo-mevina-otcha-yoter": "2jFe980nAyY",
  "shir-katan": "TfAO44Ft0gQ", // same recording as od-shir-katan
  "shuv-latzet": "8gvjuxz7U8k", // FIXED (was SV_vSMslHmw = השיר על האנשים שאכזבו אותי)

  // Non-karaoke tracks with YouTube videos
  "bsibub": "7TacEhQIvmU",
  "yamim-aruchim": "hI8u8NXjAQg", // FIXED (was R41N4QtnXS0 = שוב במדבר)
  "esh-vemayim": "M29o4jLOsW8", // FIXED (was nK_Rm705yVQ = שיר ורוד lyric)
  "mechaka-laze": "RTZxnN0iNVA", // FIXED (was -hd_MD3TqpE = דופק!)
  "ten-li": "ZfriW8vDjYw", // FIXED (was rN1-BP1o02o = בכלזאתאוהבתאותך)
  // bechol-zot-ohevet-otcha: search couldn't find a clean match —
  // skipped. The track stays in the discography without a YouTube
  // video, so clicking it won't play (but won't break either).
  "keevim-bachaze": "mkhvmwWX-NQ", // FIXED (was xt_vOaFjDXk = שיר ורוד)
  "meuchar-midai": "IANoKHU07pQ",
  "bli-milim": "KNrVV3Jh4t4",
  "beintayim-al-haadama": "YNvhn8_a5z0",
  "shum-sikuy": "88QGwfQNNtY",
  "im-tashir-oti-kach": "W7EgYn7rBLE",
  "mul-hachofesh": "NR0YwtRbVP8", // FIXED (was 0-OgtxLsojo = שוב לצאת דמו)
  "siba-lehamshich": "2EOwhYm1a9w", // FIXED (was UJtWTWedOWs = לפני שהכל נרדם)
};

interface Track {
  slug: string;
  youtubeId?: string;
  [key: string]: unknown;
}

async function main(): Promise<void> {
  const contentPath = path.join(process.cwd(), "data", "content.json");
  const raw = await fs.readFile(contentPath, "utf-8");
  const content = JSON.parse(raw) as { lyrics?: Track[] };
  const tracks = content.lyrics ?? [];

  let updated = 0;
  let preserved = 0;
  let cleared = 0;
  for (const t of tracks) {
    const id = YOUTUBE_IDS[t.slug];
    if (id) {
      if (t.youtubeId === id) {
        preserved++;
      } else {
        t.youtubeId = id;
        updated++;
      }
    } else {
      if (t.youtubeId) {
        delete t.youtubeId;
        cleared++;
      }
    }
  }

  console.log(`Updated:   ${updated}`);
  console.log(`Preserved: ${preserved}`);
  console.log(`Cleared:   ${cleared}`);
  console.log(`Total:     ${tracks.length}`);
  console.log(`With YT:   ${Object.keys(YOUTUBE_IDS).length}`);

  await fs.writeFile(contentPath, JSON.stringify(content, null, 2));
  console.log(`\n✓ Wrote ${contentPath}`);
  console.log("\nNext: `npm run migrate:kv` to push to production KV.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
