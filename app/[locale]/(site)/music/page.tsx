import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HandwrittenUnderline } from "@/components/ui";
import { Mixtape, type MixtapeTrack } from "@/components/ui/Mixtape";
import { MusicPlayerSection } from "@/components/ui/MusicPlayerSection";
import type { DiscographyAlbum } from "@/components/ui/AlbumDiscography";
import { Heart, MusicNote } from "@/components/decorative";
import { ScrollReveal, FloatingDoodle, MagneticElement } from "@/components/motion";
import { SpotifyIcon, AppleMusicIcon, YoutubeIcon, BandcampIcon } from "@/components/ui/SocialIcons";
import { StructuredData } from "@/components/seo";
import { EditableText } from "@/components/admin/Editable";
import { saveContentOverrideInline } from "@/app/admin/settings/actions";
import { readContentOverride } from "@/lib/content-overrides";
import {
  getAdminLyrics,
  getSettingsAdmin,
  type AdminLyric,
} from "@/lib/admin-store";

// Public Spotify artist ID used only for the streaming-link URL.
// No Spotify API auth involved — this is the open.spotify.com public artist page.
const SPOTIFY_ARTIST_ID = "5BwDD7OLlEuoLxt0cTHaYv";

// "עולם שלי" album URI — used as the initial URI for the IFrame-API-driven
// player at the top of the page. When the visitor presses play, the IFrame
// API emits `playback_update` events that drive the lyrics card below.
const FEATURED_ALBUM_URI = "spotify:album:7DEvEtOMZIcNVfWN3p84w1";

export const revalidate = 60;

export function generateMetadata(): Metadata {
  const title = "מוזיקה — עלמה גוב";
  const description = "כל השירים, הסינגלים והאלבומים של עלמה גוב. להאזנה בכל הפלטפורמות.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://almagov.co.il/music",
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "profile",
      images: [
        {
          url: "/images/alma-singing-purple.jpg",
          width: 1200,
          height: 630,
          alt: "עלמה גוב — הופעה חיה",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/alma-singing-purple.jpg"],
    },
  };
}

/* Hardcoded mixtape tracklist — Alma's own songs, public Spotify URLs
 * (track URLs where we have the track ID; album URLs as a fallback when only
 * the album page is known). No auth, no API — just link-outs. */
const ALMA_MIXTAPE: MixtapeTrack[] = [
  { title: "שיר ורוד", duration: "3:42", spotifyUrl: "https://open.spotify.com/track/7pI1mmkZFDu1vnADznBotF" },
  { title: "מה לעשות עם הזאב", duration: "3:18", spotifyUrl: "https://open.spotify.com/track/6ClLC1FYoL8orfOrcknQkk" },
  { title: "בסיבוב", duration: "3:06", spotifyUrl: "https://open.spotify.com/track/1u0I5pq5vchcTu2M4MlAWm" },
  { title: "לפני שהכל נרדם", duration: "4:12", spotifyUrl: "https://open.spotify.com/track/3vaYdeBFQpYbcd0VfeZa6X" },
  { title: "עולם שלי", duration: "3:55", spotifyUrl: "https://open.spotify.com/track/1qH5ltPT9wrJzd5lzxaODM" },
  { title: "ימים ארוכים", duration: "3:08", spotifyUrl: "https://open.spotify.com/track/1Ed0XwEqNUztWThl2T5Bbk" },
];

/* Per-release streaming links + (for the SEO JSON-LD) the album-level Spotify URL.
 * Keyed by the `releaseTitle` field on `AdminLyric` so the discography can stitch
 * the right links onto each album card. Singles/collabs without a dedicated artist
 * page on Apple/YouTube/Bandcamp just omit those fields — the pills are
 * conditionally rendered, so they stay hidden when missing. */
interface ReleaseLinkSet {
  spotifyAlbumId?: string;
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  bandcamp?: string;
}
const RELEASE_LINKS: Record<string, ReleaseLinkSet> = {
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
async function buildAlbumDiscography(
  adminLyrics: AdminLyric[]
): Promise<DiscographyAlbum[]> {
  const grouped = new Map<string, AdminLyric[]>();
  for (const l of adminLyrics) {
    if (!l.spotifyTrackId) continue; // can't play without a track ID
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

export default async function MusicPage() {
  const [adminLyrics, settings] = await Promise.all([
    getAdminLyrics().catch(() => []),
    getSettingsAdmin().catch(() => null),
  ]);
  const t = await getTranslations("music");
  const tMixtape = await getTranslations("mixtape");

  // Override-aware page chrome — admins can patch any of these inline
  // through the Editable wrappers below; otherwise they fall back to the
  // i18n translation strings.
  const musicTitle = readContentOverride(settings, "page.music.title", t("title"));
  const musicSubtitle = readContentOverride(settings, "page.music.subtitle", t("subtitle"));
  const lyricsHeading = readContentOverride(settings, "page.music.lyricsTitle", t("lyricsTitle"));

  /* Group admin-managed lyrics by release, fetch covers from Spotify oEmbed,
   * and stitch streaming links from RELEASE_LINKS. The resulting array is what
   * drives the AlbumDiscography under the embed. */
  const albums = await buildAlbumDiscography(adminLyrics);

  /* The "default" track — first track of the newest album in the discography.
   * Drives both the initial embed URI AND the initial lyrics card so visitors
   * see real song lyrics on first paint instead of a "click a song" placeholder.
   * Falls back to FEATURED_ALBUM_URI if the admin store is empty (no tracks
   * to choose from). */
  const defaultTrackId = albums[0]?.tracks[0]?.spotifyTrackId;
  const initialEmbedUri = defaultTrackId
    ? `spotify:track:${defaultTrackId}`
    : FEATURED_ALBUM_URI;

  /* Build MusicAlbum JSON-LD entries from the same data so the discography
   * and the structured data stay in sync. */
  const albumSchemas = albums.map((album) => {
    const linkSet = RELEASE_LINKS[album.releaseTitle] ?? {};
    return {
      "@context": "https://schema.org",
      "@type": "MusicAlbum",
      name: album.releaseTitle,
      byArtist: { "@type": "MusicGroup", name: "Alma Gov" },
      ...(album.releaseDate ? { datePublished: album.releaseDate } : {}),
      ...(linkSet.spotify ? { url: linkSet.spotify } : {}),
    };
  });

  return (
    <main className="px-6 py-12">
      {albumSchemas.length > 0 && <StructuredData data={albumSchemas} />}
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <div className="text-center">
            <EditableText
              id="override.page.music.title"
              label="Music page title"
              value={musicTitle}
              save={saveContentOverrideInline.bind(null, "page.music.title")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <h1 className="font-display text-4xl text-ink md:text-5xl">
                <HandwrittenUnderline>{musicTitle}</HandwrittenUnderline>
              </h1>
            </EditableText>
            <EditableText
              id="override.page.music.subtitle"
              label="Music page subtitle"
              value={musicSubtitle}
              save={saveContentOverrideInline.bind(null, "page.music.subtitle")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <p className="mt-4 text-ink-soft">{musicSubtitle}</p>
            </EditableText>
            <div className="mt-3 flex items-center justify-center gap-3">
              <FloatingDoodle intensity={5} duration={4}><MusicNote className="h-5 w-4 opacity-50" /></FloatingDoodle>
              <FloatingDoodle intensity={4} duration={5}><MusicNote className="h-4 w-3 opacity-40 rotate-12" /></FloatingDoodle>
              <FloatingDoodle intensity={6} duration={4.5}><MusicNote className="h-5 w-4 opacity-50 -rotate-6" /></FloatingDoodle>
            </div>
          </div>
        </ScrollReveal>

        {/* Spotify embed + live-syncing lyrics. The embed mounts via Spotify's
            public IFrame API (no auth, no API key — same as a plain iframe but
            with playback events). When the visitor presses play, the lyrics
            card below swaps to the matching admin-managed lyric row by
            spotifyTrackId; otherwise the static fallback ("שיר ורוד") shows. */}
        <ScrollReveal as="section" className="mt-10" delay={0.15}>
          <MusicPlayerSection
            initialUri={initialEmbedUri}
            adminLyrics={adminLyrics}
            albums={albums}
            fallbackTitle="בחרי שיר מההפקה למטה"
            fallbackLines={["לחצי על אחד השירים בהפקה למטה כדי להשמיע אותו ולראות את המילים כאן."]}
            fallbackCredit={t("writtenBy")}
            spotifyLoadingLabel={t("loading")}
            embedClassName="mx-auto max-w-2xl overflow-hidden rounded-xl bg-white p-3 shadow-md paper-fold"
            lyricsClassName="mt-12"
            lyricsHeading={
              <div
                key="lyrics-heading"
                className="mb-6 flex items-center justify-center gap-2"
              >
                <MusicNote className="h-4 w-3 opacity-40" />
                <EditableText
                  id="override.page.music.lyricsTitle"
                  label="Music page — lyrics section heading"
                  value={lyricsHeading}
                  save={saveContentOverrideInline.bind(null, "page.music.lyricsTitle")}
                  hint="Falls back to the translation file if cleared."
                  as="span"
                >
                  <h2 className="font-display text-2xl text-ink">
                    {lyricsHeading}
                  </h2>
                </EditableText>
                <MusicNote className="h-4 w-3 opacity-40 -scale-x-100" />
              </div>
            }
            discographyHeading="דיסקוגרפיה"
            discographyHint="לחצי על שיר כדי להשמיע אותו — המילים למעלה יתעדכנו בהתאם."
          />
        </ScrollReveal>

        {/* Mixtape — hand-drawn cassette case with Hebrew tracklist linking to Spotify */}
        <ScrollReveal as="section" className="mt-16">
          <Mixtape
            title={tMixtape("title")}
            subtitle={tMixtape("subtitle")}
            tracksHeading={tMixtape("tracksHeading")}
            playlistLabel={tMixtape("playlistLabel")}
            note={tMixtape("note")}
            tracks={ALMA_MIXTAPE}
          />
        </ScrollReveal>

        {/* Streaming links footer */}
        <ScrollReveal as="section" className="mt-16 rounded-lg bg-paper-warm p-8 text-center">
          <FloatingDoodle intensity={4} duration={5}>
            <Heart className="mx-auto mb-4 h-5 w-5 opacity-60" />
          </FloatingDoodle>
          <p className="font-display text-xl text-ink">{t("streamingTitle")}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <MagneticElement strength={0.15}>
              <a
                href={`https://open.spotify.com/artist/${SPOTIFY_ARTIST_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-blush-200 bg-white px-4 py-2.5 text-sm text-ink-soft shadow-sm transition-all hover:border-blush-400 hover:text-[#1DB954] hover:shadow-md"
                aria-label="Spotify"
              >
                <SpotifyIcon className="h-5 w-5" />
                <span>Spotify</span>
              </a>
            </MagneticElement>
            <MagneticElement strength={0.15}>
              <a
                href="https://music.apple.com/us/artist/alma-gov/1562823201"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-blush-200 bg-white px-4 py-2.5 text-sm text-ink-soft shadow-sm transition-all hover:border-blush-400 hover:text-[#FA243C] hover:shadow-md"
                aria-label="Apple Music"
              >
                <AppleMusicIcon className="h-5 w-5" />
                <span>Apple Music</span>
              </a>
            </MagneticElement>
            <MagneticElement strength={0.15}>
              <a
                href="https://www.youtube.com/@almagov1399"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-blush-200 bg-white px-4 py-2.5 text-sm text-ink-soft shadow-sm transition-all hover:border-blush-400 hover:text-[#FF0000] hover:shadow-md"
                aria-label="YouTube"
              >
                <YoutubeIcon className="h-5 w-5" />
                <span>YouTube</span>
              </a>
            </MagneticElement>
            <MagneticElement strength={0.15}>
              <a
                href="https://almagov.bandcamp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-blush-200 bg-white px-4 py-2.5 text-sm text-ink-soft shadow-sm transition-all hover:border-blush-400 hover:text-[#1DA0C3] hover:shadow-md"
                aria-label="Bandcamp"
              >
                <BandcampIcon className="h-5 w-5" />
                <span>Bandcamp</span>
              </a>
            </MagneticElement>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}

