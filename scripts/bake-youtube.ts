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
const YOUTUBE_IDS: Record<string, string> = {
  // 16 karaoke tracks
  "shir-varod": "ucovqKLT9-k", // official clip
  "ma-laasot-im-hazeev": "P1cKG1iG59Q",
  "lifney-shehakol-nirdam": "snUVtjUvZSk",
  "olam-sheli": "RTZxnN0iNVA",
  "ze-hasof": "M29o4jLOsW8",
  "shuv-bamidbar": "31b4bdlVdIQ",
  "obsesia-2": "sgMNWs-oEog",
  "al-temaher": "umcBKQIdsKI",
  "ze-beseder": "OFmdJz3KYpI",
  "teref": "J1hixtopXdY",
  "bein-haetzbaot": "Ymn9jDsg7Q0",
  "od-shir-katan": "TfAO44Ft0gQ",
  "lechabot-et-haorot": "CyhuBnuaHWg",
  "lo-mevina-otcha-yoter": "2jFe980nAyY",
  "shir-katan": "TfAO44Ft0gQ", // same recording as od-shir-katan
  "shuv-latzet": "SV_vSMslHmw",

  // Additional non-karaoke tracks with YouTube videos (playable in browser,
  // but no lyrics card since no LRC timing data exists for them).
  "bsibub": "7TacEhQIvmU",
  "yamim-aruchim": "R41N4QtnXS0",
  "esh-vemayim": "nK_Rm705yVQ",
  "mechaka-laze": "-hd_MD3TqpE",
  "ten-li": "rN1-BP1o02o",
  "bechol-zot-ohevet-otcha": "mkhvmwWX-NQ",
  "keevim-bachaze": "xt_vOaFjDXk",
  "meuchar-midai": "IANoKHU07pQ",
  "bli-milim": "KNrVV3Jh4t4",
  "beintayim-al-haadama": "YNvhn8_a5z0",
  "shum-sikuy": "88QGwfQNNtY",
  "im-tashir-oti-kach": "W7EgYn7rBLE",
  "mul-hachofesh": "0-OgtxLsojo",
  "siba-lehamshich": "UJtWTWedOWs",
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
