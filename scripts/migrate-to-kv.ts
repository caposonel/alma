/**
 * One-shot migration: copy local `data/content.json` into Vercel KV.
 *
 * Usage (after Vercel KV is attached to the project):
 *
 *   1. In Vercel dashboard → project → Storage → your KV store → ".env.local"
 *      tab → copy the `KV_REST_API_URL` + `KV_REST_API_TOKEN` values into
 *      your LOCAL `.env.local` file (just for this run).
 *   2. From the project root:
 *
 *        npx tsx scripts/migrate-to-kv.ts
 *
 *   3. Done. The KV store now mirrors your local content.json. You can
 *      remove the KV_* lines from `.env.local` after the run if you want
 *      `npm run dev` to keep using the file-store fallback locally.
 *
 * Safety:
 *   - Confirmation prompt before writing. Pass `--yes` to skip.
 *   - `--dry-run` prints what WOULD be written without touching KV.
 *   - Overwrites existing KV values for any matching key. The default
 *     content.json only has one key (`lyrics`) but the script handles any
 *     top-level key the admin-store recognizes.
 *
 * Why this exists: `data/content.json` is gitignored so it never reaches
 * Vercel. Without this script, the admin would have to re-enter all 31
 * seeded lyrics by hand in the production /admin panel.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Map content.json top-level keys → the KV keys the admin-store writes to.
// Mirrors the `*_KEY` constants in lib/admin-store.ts. If a content.json
// key isn't in this map, it's skipped with a warning.
const KEY_MAP: Record<string, string> = {
  lyrics: "lyrics",
  diary: "diary:entries",
  shows: "shows:upcoming",         // upcoming and past are stored separately
  showsUpcoming: "shows:upcoming",
  showsPast: "shows:past",
  releases: "releases",
  photos: "photos",
  settings: "settings",
  about: "about",
  videos: "videos",
};

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const yes = args.has("--yes");

  // Load env from .env.local manually since this is a plain Node script.
  // `npx tsx` doesn't auto-load .env files like `next dev` does.
  await loadEnvLocal();

  const apiUrl = process.env.KV_REST_API_URL;
  const apiToken = process.env.KV_REST_API_TOKEN;
  if (!apiUrl || !apiToken) {
    console.error(
      "Missing KV_REST_API_URL or KV_REST_API_TOKEN in .env.local.\n" +
        "Copy them from Vercel → project → Storage → your KV store →\n" +
        '"Show secret" tab → paste into .env.local, then re-run.'
    );
    process.exit(1);
  }

  const contentPath = path.join(process.cwd(), "data", "content.json");
  const raw = await fs.readFile(contentPath, "utf-8").catch(() => null);
  if (!raw) {
    console.error(`Could not read ${contentPath}. Nothing to migrate.`);
    process.exit(1);
  }
  const content = JSON.parse(raw) as Record<string, unknown>;

  const plan: { kvKey: string; jsonKey: string; preview: string }[] = [];
  const skipped: string[] = [];
  for (const [jsonKey, value] of Object.entries(content)) {
    const kvKey = KEY_MAP[jsonKey];
    if (!kvKey) {
      skipped.push(jsonKey);
      continue;
    }
    plan.push({
      kvKey,
      jsonKey,
      preview: Array.isArray(value)
        ? `${value.length} item${value.length === 1 ? "" : "s"}`
        : typeof value,
    });
  }

  console.log("Migration plan:");
  for (const p of plan) {
    console.log(`  ${p.jsonKey.padEnd(15)} → KV "${p.kvKey}"  (${p.preview})`);
  }
  if (skipped.length > 0) {
    console.log(
      `\nSkipped (unknown keys, not in KEY_MAP): ${skipped.join(", ")}`
    );
  }
  console.log(`\nTarget KV: ${apiUrl}`);
  console.log(dryRun ? "Mode: DRY RUN (no writes)" : "Mode: LIVE WRITE");

  if (!dryRun && !yes) {
    const rl = readline.createInterface({ input, output });
    const ans = await rl.question(
      "\nProceed? Existing KV values for these keys will be overwritten. (y/N) "
    );
    rl.close();
    if (ans.trim().toLowerCase() !== "y") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  if (dryRun) {
    console.log("\nDry run — no writes performed.");
    return;
  }

  // Use the REST API directly rather than `@vercel/kv` so this script
  // doesn't pull in the full Next runtime. The REST endpoint accepts
  // `["SET", key, value]` for simple set operations.
  for (const p of plan) {
    const value = content[p.jsonKey];
    const body = ["SET", p.kvKey, JSON.stringify(value)];
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      console.error(
        `✗ Failed to write "${p.kvKey}" — ${res.status} ${res.statusText}\n  ${text}`
      );
      process.exit(1);
    }
    console.log(`✓ Wrote "${p.kvKey}" (${p.preview})`);
  }
  console.log("\nDone.");
}

/** Tiny .env.local reader so we don't depend on a dotenv package. */
async function loadEnvLocal(): Promise<void> {
  const envPath = path.join(process.cwd(), ".env.local");
  const raw = await fs.readFile(envPath, "utf-8").catch(() => null);
  if (!raw) return;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
