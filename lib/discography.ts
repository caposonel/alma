import "server-only";
import type { DiscographyAlbum } from "@/components/ui/AlbumDiscography";
import type { AdminLyric } from "@/lib/admin-store";

/**
 * Shared discography data for the music page and the homepage "new release"
 * block: groups admin-managed songs into releases (newest first), with album
 * covers (Spotify oEmbed) and per-release streaming links.
 */

/* Per-release streaming links + (for the SEO JSON-LD) the album-level Spotify URL.
 * Keyed by the `releaseTitle` field on `AdminLyric` so the discography can stitch
 * the right links onto each album card. Singles/collabs without a dedicated artist
 * page on Apple/YouTube/Bandcamp just omit those fields — the pills are
 * conditionally rendered, so they stay hidden when missing. */
export interface ReleaseLinkSet {
  spotifyAlbumId?: string;
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  bandcamp?: string;
}
export const RELEASE_LINKS: Record<string, ReleaseLinkSet> = {
  "עולם שלי": {
    spotifyAlbumId: "7DEvEtOMZIcNVfWN3p84w1",
    spotify: "https://open.spotify.com/album/7DEvEtOMZIcNVfWN3p84w1",
    appleMusic: "https://music.apple.com/us/artist/alma-gov/1562823201",
    youtube: "https://www.youtube.com/@almagov1399",
  },
  "איך האהבה הזאת חומקת בין האצבעות": {
    spotifyAlbumId: "7kO2WXy0zLHtKF49A4DwOP",
    spotify: "https://open.spotify.com/album/7kO2WXy0zLHtKF49A4DwOP",
    appleMusic: "https://music.apple.com/us/artist/alma-gov/1562823201",
    youtube: "https://www.youtube.com/@almagov1399",
    bandcamp: "https://almagov.bandcamp.com",
  },
  "מאוחר מידי": {
    spotifyAlbumId: "1gJqVvEsXHJGjLEjbRPON7",
    spotify: "https://open.spotify.com/album/1gJqVvEsXHJGjLEjbRPON7",
    appleMusic: "https://music.apple.com/us/artist/alma-gov/1562823201",
    youtube: "https://www.youtube.com/@almagov1399",
    bandcamp: "https://almagov.bandcamp.com",
  },
};

/* ----- Album-cover fetch via Spotify oEmbed ----- */

/**
 * Hit Spotify's public oEmbed endpoint to grab the thumbnail URL for a track.
 * No auth required. Returns the highest-quality cover URL Spotify hands back
 * (typically a 300×300 image on their CDN), or null on any failure.
 *
 * Server-side only, cached for 24h via Next's `revalidate` so we don't hammer
 * Spotify on every page render.
 */
async function fetchTrackCover(trackId: string): Promise<string | null> {
  try {
    const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(
      `https://open.spotify.com/track/${trackId}`
    )}`;
    const res = await fetch(oEmbedUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: unknown };
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
  } catch {
    return null;
  }
}

/**
 * Group an admin-lyrics list by `releaseTitle`, sort by `releaseDate`
 * (newest first), and fetch each release's album cover in parallel.
 * The result is shaped for direct consumption by `<AlbumDiscography>`.
 */
export async function buildAlbumDiscography(
  adminLyrics: AdminLyric[]
): Promise<DiscographyAlbum[]> {
  const grouped = new Map<string, AdminLyric[]>();
  for (const l of adminLyrics) {
    // Playable in the page (YouTube) or at least linkable (Spotify).
    if (!l.youtubeId && !l.spotifyTrackId) continue;
    const key = l.releaseTitle || "—";
    const list = grouped.get(key);
    if (list) list.push(l);
    else grouped.set(key, [l]);
  }
  // Newest release first — releaseDate is "YYYY-MM-DD" so string compare works.
  const ordered = Array.from(grouped.entries()).sort(
    ([, a], [, b]) => (b[0]?.releaseDate ?? "").localeCompare(a[0]?.releaseDate ?? "")
  );
  return Promise.all(
    ordered.map(async ([releaseTitle, tracks]) => {
      const firstTrackId = tracks[0]?.spotifyTrackId;
      const coverUrl = firstTrackId ? await fetchTrackCover(firstTrackId) : null;
      const linkSet = RELEASE_LINKS[releaseTitle] ?? {};
      return {
        releaseTitle,
        releaseDate: tracks[0]?.releaseDate,
        coverUrl,
        tracks,
        links: {
          spotify: linkSet.spotify,
          appleMusic: linkSet.appleMusic,
          youtube: linkSet.youtube,
          bandcamp: linkSet.bandcamp,
        },
      };
    })
  );
}

