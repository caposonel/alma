import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HandwrittenUnderline } from "@/components/ui";
import { Heart, Star, MusicNote, NotebookLines } from "@/components/decorative";
import { ScrollReveal, FloatingDoodle, LyricsReveal, ParallaxLayer } from "@/components/motion";
import { getTrackBySlug } from "@/lib/content";
import { looksLikeLRC } from "@/lib/lrclib";

/* When the admin store's `lyricsHe` has been baked with LRC timestamps
 * (for karaoke on /music), the raw text looks like:
 *
 *   [00:12.40]שיר ורוד על השפתיים
 *   [00:15.80]מילים שנכתבו בלילה
 *
 * The /lyrics/[slug] page is a static reading view, not a karaoke
 * panel — so we strip the leading `[mm:ss.xx]` from each line before
 * rendering. Plain-text entries are returned unchanged. */
function stripLrcTimestamps(text: string): string {
  if (!text || !looksLikeLRC(text)) return text;
  return text
    .split("\n")
    .map((line) => line.replace(/^\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*/, ""))
    .filter((line, idx, arr) => {
      // Drop LRC metadata-only lines like `[ar: Alma Gov]` that have
      // nothing left after the bracket strip. Keep genuine blank
      // lines that come from the lyric body (between stanzas).
      if (line.trim().length > 0) return true;
      // A blank line is real only if the original line WAS blank
      // (i.e. the regex didn't strip anything → it stays an empty
      // line). Lines that were `[ar: …]` get reduced to "" and
      // should drop.
      const orig = text.split("\n")[idx];
      return orig === "" || orig === "\r";
    })
    .join("\n")
    .trim();
}
import { SpotifyIcon } from "@/components/ui/SocialIcons";
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

// Empty list = no pages built ahead of time; each one renders on its first
// visit and is then cached (ISR) like the rest of the site.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

/**
 * Resolves the lyrics data for a slug.
 *
 * The admin-managed lyric store is tried first — if a track is found, its
 * `lyricsHe` is required (a track without HE lyrics isn't really a lyrics
 * page). Returns null when the store has no lyrics for the slug,
 * triggering `notFound()`.
 */
async function resolveLyrics(slug: string): Promise<{
  titleHe: string;
  releaseTitle: string;
  releaseDate?: string;
  lyricsHe: string;
  spotifyTrackId?: string;
} | null> {
  const fromStore = await getTrackBySlug(slug);
  if (fromStore && fromStore.track.lyricsHe) {
    return {
      titleHe: fromStore.track.trackTitle,
      releaseTitle: fromStore.release.title,
      releaseDate: fromStore.release.releaseDate,
      lyricsHe: fromStore.track.lyricsHe,
      spotifyTrackId: fromStore.track.spotifyTrackId,
    };
  }

  // No static fallback: the old fallback served invented placeholder verses
  // under real song titles. Unknown slugs (or a store outage) now 404.
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lyric = await resolveLyrics(slug);
  if (!lyric) return { title: { absolute: "לא נמצא — עלמה גוב" } };

  const title = `${lyric.titleHe} — מילים — עלמה גוב`;
  const description = `מילים לשיר "${lyric.titleHe}" מתוך ${lyric.releaseTitle}`;
  const url = `${SITE_URL}/lyrics/${slug}`;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "article",
      images: [
        {
          url: "/images/alma-singing-purple.jpg",
          width: 1200,
          height: 630,
          alt: lyric.titleHe,
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

export default async function LyricsPage({ params }: Props) {
  const { slug } = await params;
  const lyric = await resolveLyrics(slug);
  if (!lyric) notFound();

  const t = await getTranslations("music");

  const spotifyUrl = lyric.spotifyTrackId
    ? `https://open.spotify.com/track/${lyric.spotifyTrackId}`
    : null;
  const releaseDateLabel = lyric.releaseDate
    ? new Date(lyric.releaseDate).toLocaleDateString("he-IL", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="relative px-6 py-12">
      {/* Decorative floating doodles — purely visual */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-12 mx-auto max-w-5xl"
      >
        <div className="absolute start-8 top-4">
          <ParallaxLayer speed={-0.1}>
            <FloatingDoodle intensity={6} duration={5}>
              <Heart className="h-6 w-6 opacity-50" />
            </FloatingDoodle>
          </ParallaxLayer>
        </div>
        <div className="absolute end-12 top-20">
          <ParallaxLayer speed={-0.08}>
            <FloatingDoodle intensity={5} duration={6} rotateSwing={8}>
              <Star className="h-5 w-5 opacity-50" />
            </FloatingDoodle>
          </ParallaxLayer>
        </div>
        <div className="absolute end-6 top-64">
          <ParallaxLayer speed={-0.12}>
            <FloatingDoodle intensity={4} duration={4.5}>
              <MusicNote className="h-5 w-4 opacity-40" />
            </FloatingDoodle>
          </ParallaxLayer>
        </div>
        <div className="absolute start-6 top-80">
          <ParallaxLayer speed={-0.1}>
            <FloatingDoodle intensity={7} duration={5.5} rotateSwing={6}>
              <Heart className="h-4 w-4 opacity-40" />
            </FloatingDoodle>
          </ParallaxLayer>
        </div>
      </div>

      <article className="relative mx-auto max-w-5xl">
        <Link
          href="/music"
          className="mb-8 inline-block text-sm text-blush-500 transition-colors hover:text-blush-600"
        >
          {t("backToMusic")}
        </Link>

        <ScrollReveal>
          <header className="mb-10 text-center">
            <p className="text-xs uppercase tracking-wider text-blush-500">
              {lyric.releaseTitle}
              {releaseDateLabel && (
                <span className="ms-2 text-ink-soft normal-case">
                  · {releaseDateLabel}
                </span>
              )}
            </p>
            <h1 className="mt-3 font-display text-5xl text-ink md:text-6xl">
              <HandwrittenUnderline>{lyric.titleHe}</HandwrittenUnderline>
              <Heart className="ms-2 inline-block h-5 w-5" />
            </h1>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="grid gap-6 md:gap-8 md:grid-cols-1">
            {/* Hebrew lyrics — Hebrew-only site, EN second column removed */}
            <div className="order-1">
              <div className="rounded-sm bg-paper-warm/50 p-1 shadow-md paper-shadow-lifted">
                <NotebookLines
                  className="rounded-sm bg-paper px-6 py-8 md:px-8 md:py-10"
                  lineSpacing={48}
                >
                  <LyricsReveal
                    text={stripLrcTimestamps(lyric.lyricsHe)}
                    dir="rtl"
                    className="whitespace-pre-wrap font-display text-2xl leading-[48px] text-ink md:text-3xl md:leading-[48px]"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                </NotebookLines>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* CTA: listen on Spotify */}
        <ScrollReveal delay={0.25}>
          <div className="mt-10 flex items-center justify-center">
            {spotifyUrl ? (
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-blush-200 bg-white px-4 py-2.5 text-sm text-ink-soft shadow-sm transition-all hover:border-blush-400 hover:text-[#1DB954] hover:shadow-md"
              >
                <SpotifyIcon className="h-5 w-5" />
                <span>{t("listenToSong")}</span>
              </a>
            ) : (
              <p className="text-sm text-ink-soft">{t("writtenBy")}</p>
            )}
          </div>
        </ScrollReveal>

        {/* Decorative trailing doodles */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <FloatingDoodle intensity={4} duration={4.5}>
            <MusicNote className="h-4 w-3 opacity-40" />
          </FloatingDoodle>
          <FloatingDoodle intensity={3} duration={5.5}>
            <Heart className="h-4 w-4 opacity-50" />
          </FloatingDoodle>
          <FloatingDoodle intensity={5} duration={4}>
            <Star className="h-4 w-4 opacity-40" />
          </FloatingDoodle>
        </div>
      </article>
    </main>
  );
}
