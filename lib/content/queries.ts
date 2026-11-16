import type {
  DiaryEntry,
  Show,
  Photo,
  Video,
  Release,
  TrackItem,
  SiteSettings,
} from "./types";
import {
  getDiaryEntries as getDiaryEntriesFromKv,
  getUpcomingShowsAdmin,
  getPastShowsAdmin,
  getReleasesAdmin,
  getPhotosAdmin,
  getSettingsAdmin,
  getAbout,
  getAdminVideos,
  getAdminLyrics,
  type AdminDiaryEntry,
  type AdminShow,
  type AdminRelease,
  type AdminPhoto,
  type AdminAbout,
  type AdminVideo,
  type AdminLyric,
} from "@/lib/admin-store";

/**
 * Site content queries.
 *
 * Content lives in Vercel KV (or a local JSON file during development) and is
 * exposed to the rest of the app via the admin store. Each query reads from
 * KV, adapts the admin shape to the site-facing shape, and returns it. When
 * KV has no data, an empty array / null is returned and the page-level static
 * fallbacks take over.
 */

/* -------------------------------------------------------------------------- */
/* Adapters: AdminX (KV shape) -> X (site shape)                              */
/* -------------------------------------------------------------------------- */

function diaryToSite(entry: AdminDiaryEntry): DiaryEntry {
  return {
    _id: entry.id,
    title: entry.title,
    slug: { current: entry.slug },
    date: entry.date,
    excerpt: entry.excerpt || undefined,
    featured: entry.featured,
    // `body` from KV is raw markdown — the diary detail page renders it
    // directly with react-markdown + remark-gfm. We keep it as a string so
    // marks (bold/italic/links/lists) written by Tiptap survive intact.
    body: entry.body || undefined,
    // Cover image is a simple path; pages already handle `staticImage` fallback.
    staticImage: entry.coverImage
      ? { src: entry.coverImage, alt: entry.title }
      : undefined,
  };
}

function showToSite(show: AdminShow): Show {
  return {
    _id: show.id,
    date: show.date,
    city: show.city,
    venue: show.venue,
    ticketUrl: show.ticketUrl,
    notes: show.notes,
    status: show.status,
  };
}

function releaseToSite(release: AdminRelease): Release {
  return {
    _id: release.id,
    title: release.title,
    type: release.type,
    releaseDate: release.releaseDate,
    // KV-only releases don't carry a cover image yet — pass an empty ref so
    // `urlFor()` falls back to the placeholder. Pages tolerate missing covers.
    cover: {},
    spotifyUrl: release.spotifyUrl,
    appleMusicUrl: release.appleMusicUrl,
    youtubeUrl: release.youtubeUrl,
    bandcampUrl: release.bandcampUrl,
    spotifyEmbedId: release.spotifyAlbumId,
  };
}

function photoToSite(photo: AdminPhoto): Photo {
  return {
    _id: photo.id,
    // AdminPhoto stores a public path under `src`; surface it via the
    // ImageRef shape so `urlFor(photo.image).url()` resolves to that path.
    image: { asset: { url: photo.src }, alt: photo.alt },
    caption: photo.alt,
    tags: photo.category ? [photo.category] : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Diary                                                                      */
/* -------------------------------------------------------------------------- */

export async function getLatestDiaryEntry(): Promise<DiaryEntry | null> {
  try {
    const entries = await getDiaryEntriesFromKv();
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.date.localeCompare(a.date);
    });
    return diaryToSite(sorted[0]);
  } catch (err) {
    console.error("KV diary read failed:", err);
    return null;
  }
}

export async function getAllDiaryEntries({
  limit = 12,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<DiaryEntry[]> {
  try {
    const entries = await getDiaryEntriesFromKv();
    if (entries.length === 0) return [];
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.slice(offset, offset + limit).map(diaryToSite);
  } catch (err) {
    console.error("KV diary read failed:", err);
    return [];
  }
}

export async function getDiaryEntryBySlug(
  slug: string
): Promise<DiaryEntry | null> {
  try {
    const entries = await getDiaryEntriesFromKv();
    const found = entries.find((e) => e.slug === slug);
    return found ? diaryToSite(found) : null;
  } catch (err) {
    console.error("KV diary read failed:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Shows                                                                      */
/* -------------------------------------------------------------------------- */

export async function getUpcomingShows({
  limit = 10,
}: { limit?: number } = {}): Promise<Show[]> {
  try {
    const shows = await getUpcomingShowsAdmin();
    if (shows.length === 0) return [];
    const sorted = [...shows].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(0, limit).map(showToSite);
  } catch (err) {
    console.error("KV shows read failed:", err);
    return [];
  }
}

export async function getPastShows(): Promise<Show[]> {
  try {
    const shows = await getPastShowsAdmin();
    if (shows.length === 0) return [];
    const sorted = [...shows].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.map(showToSite);
  } catch (err) {
    console.error("KV shows read failed:", err);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Photos                                                                     */
/* -------------------------------------------------------------------------- */

export async function getAllPhotos({
  tag,
}: { tag?: string } = {}): Promise<Photo[]> {
  try {
    const photos = await getPhotosAdmin();
    if (photos.length === 0) return [];
    const filtered = tag
      ? photos.filter((p) => p.category === tag)
      : photos;
    return filtered.map(photoToSite);
  } catch (err) {
    console.error("KV photos read failed:", err);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Videos                                                                     */
/* -------------------------------------------------------------------------- */

function videoToSite(video: AdminVideo): Video {
  return {
    _id: video.id,
    title: video.title,
    source: "youtube",
    youtubeId: video.youtubeId,
    description: video.description,
    category: video.category,
    releaseDate: video.releaseDate,
    featured: video.featured,
  };
}

export async function getAllVideos(): Promise<Video[]> {
  try {
    const videos = await getAdminVideos();
    if (videos.length === 0) return [];
    return videos.map(videoToSite);
  } catch (err) {
    console.error("KV videos read failed:", err);
    return [];
  }
}

export async function getFeaturedVideo(): Promise<Video | null> {
  try {
    const videos = await getAdminVideos();
    const featured = videos.find((v) => v.featured);
    return featured ? videoToSite(featured) : null;
  } catch (err) {
    console.error("KV videos read failed:", err);
    return null;
  }
}

/**
 * Direct admin-shape accessors for the gallery page. The page already has a
 * GalleryVideo shape with `id` / `youtubeId` etc. — these helpers return the
 * raw `AdminVideo` rows so we don't translate twice.
 */
export async function getAdminGalleryVideos(): Promise<AdminVideo[]> {
  try {
    return await getAdminVideos();
  } catch (err) {
    console.error("KV videos read failed:", err);
    return [];
  }
}

export async function getAdminFeaturedVideo(): Promise<AdminVideo | null> {
  try {
    const videos = await getAdminVideos();
    return videos.find((v) => v.featured) ?? null;
  } catch (err) {
    console.error("KV videos read failed:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Releases                                                                   */
/* -------------------------------------------------------------------------- */

export async function getAllReleases(): Promise<Release[]> {
  try {
    const releases = await getReleasesAdmin();
    if (releases.length === 0) return [];
    const sorted = [...releases].sort((a, b) =>
      b.releaseDate.localeCompare(a.releaseDate)
    );
    return sorted.map(releaseToSite);
  } catch (err) {
    console.error("KV releases read failed:", err);
    return [];
  }
}

export async function getLatestRelease(): Promise<Release | null> {
  try {
    const releases = await getReleasesAdmin();
    if (releases.length === 0) return null;
    const sorted = [...releases].sort((a, b) =>
      b.releaseDate.localeCompare(a.releaseDate)
    );
    return releaseToSite(sorted[0]);
  } catch (err) {
    console.error("KV releases read failed:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* About / Settings                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The admin-shape accessor for the About page editor (bio paragraphs,
 * fun facts, milestones, influences, press quotes). Returns null when the
 * editor is empty so the page falls back to its built-in static content.
 */
export async function getAdminAbout(): Promise<AdminAbout | null> {
  try {
    return await getAbout();
  } catch (err) {
    console.error("KV about read failed:", err);
    return null;
  }
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const settings = await getSettingsAdmin();
    if (!settings) return null;
    return {
      heroDescription: settings.heroDescription,
    };
  } catch (err) {
    console.error("KV settings read failed:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Tracks (lyrics)                                                            */
/* -------------------------------------------------------------------------- */

function lyricToTrackAndRelease(lyric: AdminLyric): {
  track: TrackItem;
  release: Release;
} {
  return {
    track: {
      trackTitle: lyric.titleHe,
      slug: { current: lyric.slug },
      spotifyTrackId: lyric.spotifyTrackId,
      lyricsHe: lyric.lyricsHe,
    },
    release: {
      _id: `release-from-lyric-${lyric.slug}`,
      title: lyric.releaseTitle ?? "",
      type: "single",
      releaseDate: lyric.releaseDate,
      cover: {},
    },
  };
}

export async function getTrackBySlug(slug: string): Promise<{
  track: TrackItem;
  release: Release;
} | null> {
  try {
    const lyrics = await getAdminLyrics();
    const match = lyrics.find((l) => l.slug === slug);
    if (match) return lyricToTrackAndRelease(match);
    return null;
  } catch (err) {
    console.error("KV lyrics read failed:", err);
    return null;
  }
  // When this returns null, the /lyrics/[slug] page 404s (there is no
  // static fallback).
}
