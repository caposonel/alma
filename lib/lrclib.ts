export interface SyncedLyricLine {
  time: number; // seconds
  text: string;
}

export interface LyricsResult {
  synced: SyncedLyricLine[] | null;
  plain: string | null;
  duration: number | null;
}

function parseLRC(lrc: string): SyncedLyricLine[] {
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

export async function fetchLyrics(
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
  } catch (err) {
    console.error("LRCLIB fetch error:", err);
    return null;
  }
}
