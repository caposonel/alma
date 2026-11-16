/**
 * Minimal image reference used by the site after the Sanity migration.
 *
 * Content now lives in Vercel KV (via the custom admin panel). Image fields
 * are stored as plain string paths (e.g. `/images/foo.jpg`). This shape lets
 * us keep the same "image object" contract the site previously had from
 * Sanity while allowing a string path under `asset.url`.
 */
export interface ImageRef {
  asset?: { _ref?: string; url?: string };
  alt?: string;
}

export interface DiaryEntry {
  _id: string;
  title: string;
  slug: { current: string };
  date: string;
  excerpt?: string;
  /**
   * Raw markdown body. Rendered with `react-markdown` + `remark-gfm` on the
   * diary detail page. Was previously converted to PortableText blocks, but
   * the naive converter dropped Tiptap-authored marks (bold/italic/links/
   * lists) so the conversion step was removed and the markdown is now kept
   * verbatim.
   */
  body?: string;
  coverImage?: ImageRef;
  featured?: boolean;
  /**
   * Optional static image (used only by the static-fallback diary entries).
   * KV-sourced entries should use `coverImage` instead.
   */
  staticImage?: { src: string; alt: string };
}

export interface Show {
  _id: string;
  date: string;
  city: string;
  venue: string;
  title?: string;
  ticketUrl?: string;
  notes?: string;
  status?: "upcoming" | "sold-out" | "cancelled" | "past";
}

export interface Photo {
  _id: string;
  image: ImageRef;
  caption?: string;
  takenAt?: string;
  tags?: string[];
  order?: number;
}

export interface Video {
  _id: string;
  title: string;
  source: "upload" | "youtube";
  videoFile?: { asset: { url: string } };
  youtubeUrl?: string;
  youtubeId?: string;
  thumbnail?: ImageRef;
  description?: string;
  category?: "official" | "live" | "behind-scenes" | "session" | "interview" | "other";
  releaseDate?: string;
  featured?: boolean;
}

export interface TrackItem {
  trackTitle: string;
  slug?: { current: string };
  duration?: string;
  spotifyTrackId?: string;
  lyricsHe?: string;
}

export interface SheetMusicItem {
  title: string;
  instrument?: "piano" | "guitar" | "chords" | "other";
  file?: { asset: { url: string } };
}

export interface Release {
  _id: string;
  title: string;
  type: "single" | "ep" | "album";
  releaseDate?: string;
  cover: ImageRef;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  bandcampUrl?: string;
  spotifyEmbedId?: string;
  tracklist?: TrackItem[];
  sheetMusic?: SheetMusicItem[];
}

export interface SiteSettings {
  heroDescription?: string[];
}
