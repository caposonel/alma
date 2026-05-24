export interface SyncedLyricLine {
  time: number; // seconds
  text: string;
}

export interface LyricsResult {
  synced: SyncedLyricLine[] | null;
  plain: string | null;
  duration: number | null;
}

/**
 * Heuristic to decide whether a raw lyric blob looks like LRC-formatted
 * text (each line prefixed with `[mm:ss(.xx)]`) vs plain text.
 *
 * We look at the first 5 non-blank lines: if at least one of them starts
 * with an LRC timestamp, treat the whole blob as LRC. (LRC files often
 * have a few metadata lines like `[ar: Alma Gov]` at the top, then the
 * timed lines — the metadata lines also start with `[`, so even those
 * pass this check.)
 *
 * False negatives are safe (renders as static plain text, current
 * behaviour); false positives produce empty `synced` arrays which
 * `MusicPlayerSection.useSynced` rejects via the `length > 0` check, so
 * the page falls back to plain rendering automatically.
 */
export function looksLikeLRC(text: string): boolean {
  if (!text) return false;
  let checked = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/.test(trimmed)) return true;
    checked++;
    if (checked >= 5) break;
  }
  return false;
}

export function parseLRC(lrc: string): SyncedLyricLine[] {
  const lines = lrc.split("\n");
  const result: SyncedLyricLine[] = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/);
    if (!match) continue;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const ms = parseInt((match[3] || "0").padEnd(3, "0"), 10);
    const time = minutes * 60 + seconds + ms / 1000;
    const text = match[4].trim();
    if (text) result.push({ time, text });
  }
  return result;
}

/**
 * LRCLIB looks up by EXACT track + artist name match. Alma's catalog is
 * indexed inconsistently across submissions — most under the Hebrew form
 * `עלמה גוב`, a few under the English transliteration `Alma Gov`, and
 * her Avner Tueg duets sometimes under just `אבנר טואג`. We try each
 * variant until one returns synced data, then fall back to a final
 * non-synced result if nothing has timing.
 *
 * Caller passes a primary `artistName` (e.g. what the public site
 * thinks the artist is called); we also try the alternate variants
 * automatically. If the caller passes one of the Alma-related names,
 * all four variants are tried; otherwise we just try the one name.
 */
const ARTIST_VARIANTS_BY_PRIMARY = ["Alma Gov", "עלמה גוב", "Avner Tueg", "אבנר טואג"];

async function tryOneArtist(
  trackName: string,
  artistName: string
): Promise<LyricsResult | null> {
  try {
    const url = new URL("https://lrclib.net/api/get");
    url.searchParams.set("track_name", trackName);
    url.searchParams.set("artist_name", artistName);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-website/1.0" },
      next: { revalidate: 86400 }, // cache 1 day
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      synced: data.syncedLyrics ? parseLRC(data.syncedLyrics) : null,
      plain: data.plainLyrics ?? null,
      duration: data.duration ?? null,
    };
  } catch {
    return null;
  }
}

/* Regex that matches any of the canonical Alma-related artist names in
 * either script. Used to filter LRCLIB /search results down to entries
 * that could legitimately be Alma's catalog. Without this filter the
 * /search endpoint happily returns same-title songs by unrelated
 * artists (e.g. Zohar Argov has a song called "בלי מילים" too — not
 * Alma's). */
const ALMA_ARTIST_REGEX = /alma\s*gov|עלמה\s*גוב|avner\s*tueg|אבנר\s*טואג/i;

interface LrclibSearchResult {
  artistName?: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | null;
}

/* Fallback path when strict /get returned nothing useful. /search does
 * fuzzy matching on title only — catches submissions where the title has
 * minor whitespace / punctuation differences from what we queried.
 * We then filter to Alma-related artists and prefer synced submissions. */
async function searchAlmaTrack(trackName: string): Promise<LyricsResult | null> {
  try {
    const url = new URL("https://lrclib.net/api/search");
    url.searchParams.set("track_name", trackName);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "alma-gov-website/1.0" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as LrclibSearchResult[];
    if (!Array.isArray(results)) return null;

    const relevant = results.filter((r) =>
      ALMA_ARTIST_REGEX.test(r.artistName ?? "")
    );
    if (relevant.length === 0) return null;

    // Prefer a submission with synced lyrics; fall back to first plain.
    const synced = relevant.find(
      (r) => r.syncedLyrics && r.syncedLyrics.trim().length > 0
    );
    const chosen = synced ?? relevant[0];
    return {
      synced:
        chosen.syncedLyrics ? parseLRC(chosen.syncedLyrics) : null,
      plain: chosen.plainLyrics ?? null,
      duration: chosen.duration ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchLyrics(
  trackName: string,
  artistName: string
): Promise<LyricsResult | null> {
  // Build the variants list: primary artist + any Alma-related variants
  // when the primary looks Alma-related (so we don't accidentally try
  // Alma names if some future track is from a different artist).
  const lower = artistName.toLowerCase();
  const isAlmaRelated =
    lower.includes("alma") ||
    lower.includes("gov") ||
    lower.includes("avner") ||
    lower.includes("tueg") ||
    artistName.includes("עלמה") ||
    artistName.includes("אבנר") ||
    artistName.includes("גוב") ||
    artistName.includes("טואג");

  const variants = isAlmaRelated
    ? [artistName, ...ARTIST_VARIANTS_BY_PRIMARY.filter((v) => v !== artistName)]
    : [artistName];

  // Track the best result so far. We prefer synced data, but accept plain
  // data as a fallback if no variant returned synced.
  let bestResult: LyricsResult | null = null;
  for (const variant of variants) {
    const result = await tryOneArtist(trackName, variant);
    if (!result) continue;
    if (result.synced && result.synced.length > 0) {
      // Synced data found — short-circuit, this is the best we can get.
      return result;
    }
    if (!bestResult) bestResult = result;
  }

  // No /get variant returned synced data. Try the fuzzy /search endpoint
  // as a last resort — catches tracks where the LRCLIB submission has
  // slightly different title formatting than what we queried.
  if (isAlmaRelated) {
    const searchResult = await searchAlmaTrack(trackName);
    if (
      searchResult?.synced &&
      searchResult.synced.length > 0
    ) {
      return searchResult;
    }
    // /search didn't have synced either — keep whatever /get returned
    // (plain only or null).
  }

  return bestResult;
}
