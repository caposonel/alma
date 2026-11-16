import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HandwrittenUnderline, PolaroidFrame } from "@/components/ui";
import { YouTubeCard } from "@/components/ui/YouTubeCard";
import { Heart, Star, Butterfly } from "@/components/decorative";
import { ScrollReveal, StaggerGrid, StaggerItem, FloatingDoodle } from "@/components/motion";
import { StructuredData } from "@/components/seo";
import { GalleryGrid } from "./GalleryGrid";
import { EditableText, EditableImage } from "@/components/admin/Editable";
import { patchPhotoFieldInline } from "@/app/admin/photos/actions";
import { saveContentOverrideInline } from "@/app/admin/settings/actions";
import { getSettingsAdmin, type AdminVideo } from "@/lib/admin-store";
import { readContentOverride } from "@/lib/content-overrides";
import {
  getAllPhotos,
  getAdminGalleryVideos,
  getAdminFeaturedVideo,
  urlFor,
} from "@/lib/content";
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

export function generateMetadata(): Metadata {
  const title = "גלריה — עלמה גוב";
  const description = "תמונות, קליפים ורגעים מאחורי הקלעים.";
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/gallery`,
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "website",
      images: [
        {
          url: "/images/alma-portrait-vintage.jpg",
          width: 1200,
          height: 630,
          alt: "פורטרט וינטג׳ של עלמה גוב",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/alma-portrait-vintage.jpg"],
    },
  };
}

/**
 * Normalized video shape used by VideoSection. Both static fallback entries
 * and admin-managed videos are coerced to this shape so we can share rendering.
 */
type GalleryVideo = {
  id: string;
  title: string;
  youtubeId: string;
  description?: string;
  category?: string;
  releaseDate?: string;
  thumbnailUrl?: string;
};

const STATIC_VIDEOS: GalleryVideo[] = [
  {
    id: "featured",
    title: "שיר ורוד — קליפ רשמי",
    youtubeId: "xt_vOaFjDXk",
    description: "הקליפ הרשמי לשיר ורוד",
    category: "official",
    releaseDate: "2024-03-01",
  },
  {
    id: "v2",
    title: "מה לעשות עם הזאב — קליפ רשמי",
    youtubeId: "P1cKG1iG59Q",
    description: "השיר שזכה במקום השני בשיר השנה של כאן 88",
    category: "official",
    releaseDate: "2023-08-01",
  },
  {
    id: "v3",
    title: "בסיבוב — קליפ רשמי",
    youtubeId: "7TacEhQIvmU",
    description: "",
    category: "official",
    releaseDate: "2022-11-01",
  },
  {
    id: "v4",
    title: "לפני שהכל נרדם — עם אבנר טואג",
    youtubeId: "UJtWTWedOWs",
    description: "מתוך האלבום המשותף עם אבנר טואג",
    category: "session",
    releaseDate: "2023-05-01",
  },
];

// Gallery photos — deliberately disjoint from the diary entry images
// (gallery-live-crowd, gallery-notebook, gallery-couch, alma-portrait-vintage,
// alma-portrait-blue, gallery-embroidery, gallery-backstage-mirror,
// gallery-motion-blur are owned by the diary page).
export const STATIC_PHOTOS: { src: string; alt: string; category: string }[] = [
  { src: "/images/gallery-live-orange.jpg", alt: "צללית של רגע — רק אני, המיקרופון, והאור הכתום", category: "הופעות" },
  { src: "/images/gallery-live-bw.jpg", alt: "יחפה על הבמה, צורחת מאושר — הרגעים שאי אפשר לתכנן", category: "הופעות" },
  { src: "/images/diary-placeholder.jpg", alt: "ימים של הקלטות, לילות של מיקסים — באולפן בונים עולם חדש", category: "מאחורי הקלעים" },
  { src: "/images/gallery-live-red.jpg", alt: "רק היא, המיקרופון, ואור אדום — נוטשת את כלי הנגינה לרגע", category: "הופעות" },
  { src: "/images/gallery-headphones.jpg", alt: "דואט עם אבנר טואג בגגרין — שני קולות, במה אחת, והקהל עוצר נשימה", category: "הופעות" },
  { src: "/images/gallery-live-chandelier.jpg", alt: "סערת רגשות בבארבי — כובשת שוב את הבמה", category: "הופעות" },
  { src: "/images/gallery-hairflip.jpg", alt: "שמלה שחורה ואורות צבעוניים — לילה קסום בבארבי", category: "הופעות" },
  { src: "/images/gallery-backstage-friends.jpg", alt: "פרחים, חיבוקים, ורגע של נשימה אחרי שהבמה נגמרת", category: "מאחורי הקלעים" },
  { src: "/images/gallery-cat-selfie.jpg", alt: "השותף הכי טוב לכתיבת שירים לא מסכים לזוז מהמקלדת", category: "חיים" },
  { src: "/images/gallery-tour-poster.jpg", alt: "צריך מתי מפחד ומרגישה בחיים — פוסטר סיבוב הופעות", category: "הופעות" },
];

// Category keys used both for grouping and for looking up translated labels.
const CATEGORY_KEYS = ["official", "live", "session", "behind-scenes", "interview", "other"] as const;

// Maps a raw category string from data to its translation key in `gallery.sections`.
function categoryLabelKey(cat: string): "official" | "live" | "session" | "behindScenes" | "interviews" | "other" {
  switch (cat) {
    case "official":
      return "official";
    case "live":
      return "live";
    case "session":
      return "session";
    case "behind-scenes":
      return "behindScenes";
    case "interview":
      return "interviews";
    default:
      return "other";
  }
}

// Set of categories known to the system — used to fall back unknown ones to "other".
const KNOWN_CATEGORIES = new Set<string>(CATEGORY_KEYS);

// Order categories appear on the page. Anything missing falls back at the end
// under "וידאו".
const CATEGORY_ORDER = ["official", "live", "session", "behind-scenes", "interview", "other"];

const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

function formatHebrewMonthYear(dateString: string | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return `${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Convert an admin-store video row into the normalized GalleryVideo shape. */
function adminToGalleryVideo(video: AdminVideo): GalleryVideo | null {
  if (!video.youtubeId) return null;
  return {
    id: video.id,
    title: video.title,
    youtubeId: video.youtubeId,
    description: video.description,
    category: video.category ?? "other",
    releaseDate: video.releaseDate,
  };
}

export default async function GalleryPage() {
  const t = await getTranslations("gallery");
  const tSections = await getTranslations("gallery.sections");
  const [photos, adminVideos, adminFeatured, settings] = await Promise.all([
    getAllPhotos().catch(() => []),
    getAdminGalleryVideos().catch(() => []),
    getAdminFeaturedVideo().catch(() => null),
    getSettingsAdmin().catch(() => null),
  ]);

  const galleryTitle = readContentOverride(settings, "page.gallery.title", t("title"));
  const galleryPhotosHeading = readContentOverride(
    settings,
    "page.gallery.photos",
    t("photos")
  );

  // Build a label resolver to translate category keys → strings.
  const labelForCategory = (cat: string) => tSections(categoryLabelKey(cat));

  const hasAdminVideos = adminVideos.length > 0;
  const hasContent = photos.length > 0 || hasAdminVideos;

  // Normalize admin videos to the shared shape (skipping any that somehow lack
  // a YouTube id — the admin form requires one but be defensive).
  const galleryVideosFromAdmin: GalleryVideo[] = hasAdminVideos
    ? adminVideos
        .map(adminToGalleryVideo)
        .filter((v): v is GalleryVideo => v !== null)
    : [];

  // Choose the hero/featured video. Prefer admin-featured, fall back to the
  // first static entry when KV is empty.
  const featuredGalleryVideo: GalleryVideo | null = (() => {
    if (adminFeatured) {
      const normalized = adminToGalleryVideo(adminFeatured);
      if (normalized) return normalized;
    }
    return hasAdminVideos ? null : STATIC_VIDEOS[0] ?? null;
  })();

  // Videos to render in the grid below the hero. Exclude whichever video is
  // already shown in the hero slot.
  const gridVideos: GalleryVideo[] = hasAdminVideos
    ? galleryVideosFromAdmin.filter((v) => v.id !== featuredGalleryVideo?.id)
    : STATIC_VIDEOS.filter((v) => v.id !== featuredGalleryVideo?.id);

  // Build JSON-LD for the featured video, if one exists.
  const featuredVideoSchema = featuredGalleryVideo
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: featuredGalleryVideo.title,
        description: featuredGalleryVideo.description || featuredGalleryVideo.title,
        thumbnailUrl:
          featuredGalleryVideo.thumbnailUrl ||
          `https://img.youtube.com/vi/${featuredGalleryVideo.youtubeId}/maxresdefault.jpg`,
        ...(featuredGalleryVideo.releaseDate
          ? { uploadDate: featuredGalleryVideo.releaseDate }
          : {}),
        contentUrl: `https://youtube.com/watch?v=${featuredGalleryVideo.youtubeId}`,
        embedUrl: `https://youtube.com/embed/${featuredGalleryVideo.youtubeId}`,
      }
    : null;

  return (
    <main className="px-6 py-12">
      {featuredVideoSchema && <StructuredData data={featuredVideoSchema} />}

      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <div className="text-center">
            <EditableText
              id="override.page.gallery.title"
              label="Gallery page title"
              value={galleryTitle}
              save={saveContentOverrideInline.bind(null, "page.gallery.title")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <h1 className="font-display text-4xl text-ink md:text-5xl">
                <HandwrittenUnderline>{galleryTitle}</HandwrittenUnderline>
              </h1>
            </EditableText>
            <FloatingDoodle className="mx-auto mt-3" intensity={5} duration={6}>
              <Butterfly className="h-6 w-6 opacity-50" />
            </FloatingDoodle>
          </div>
        </ScrollReveal>

        {/* Featured video — either admin-featured or the first static entry */}
        {featuredGalleryVideo && (
          <ScrollReveal as="section" className="mt-12">
            <div className="mx-auto max-w-3xl">
              <div className="overflow-hidden rounded-sm bg-white p-2 shadow-md paper-fold">
                <YouTubeCard
                  youtubeId={featuredGalleryVideo.youtubeId}
                  title={featuredGalleryVideo.title}
                />
              </div>
              <p className="mt-2 font-display text-xl text-ink">
                {featuredGalleryVideo.title}
              </p>
              {featuredGalleryVideo.releaseDate &&
                formatHebrewMonthYear(featuredGalleryVideo.releaseDate) && (
                  <p className="mt-1 text-xs text-ink-soft">
                    {formatHebrewMonthYear(featuredGalleryVideo.releaseDate)}
                  </p>
                )}
              {featuredGalleryVideo.description && (
                <p className="mt-1 text-sm text-ink-soft">
                  {featuredGalleryVideo.description}
                </p>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Categorized videos — shared logic for both admin-managed and static fallback */}
        {gridVideos.length > 0 && (
          <VideoSection videos={gridVideos} labelForCategory={labelForCategory} />
        )}

        {/* Photos section — uses client-side GalleryGrid with Lightbox */}
        <section className="mt-16">
          <ScrollReveal>
            <div className="mb-6 flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              <EditableText
                id="override.page.gallery.photos"
                label="Gallery — photos section heading"
                value={galleryPhotosHeading}
                save={saveContentOverrideInline.bind(null, "page.gallery.photos")}
                hint="Falls back to the translation file if cleared."
                as="span"
              >
                <h2 className="font-display text-2xl text-ink">
                  {galleryPhotosHeading}
                </h2>
              </EditableText>
              <Heart className="h-4 w-4" />
            </div>
          </ScrollReveal>

          {hasContent && photos.length > 0 ? (
            <StaggerGrid className="columns-2 gap-4 md:columns-3" staggerDelay={0.06}>
              {photos.map((photo) => {
                const src = urlFor(photo.image).width(600).url();
                return (
                  <StaggerItem key={photo._id} className="mb-4 break-inside-avoid">
                    {/* Image is editable — clicking it in admin edit mode
                        opens an uploader; caption sits inside its own
                        wrapper below the frame so it can be edited
                        without unmounting the image. */}
                    <EditableImage
                      id={`photo.${photo._id}.src`}
                      label={`Image · ${photo.caption || "(no caption)"}`}
                      value={src}
                      save={patchPhotoFieldInline.bind(null, photo._id, "src")}
                      as="div"
                    >
                      <PolaroidFrame
                        src={src}
                        alt={photo.caption || "תמונה"}
                        caption={photo.caption}
                        width={600}
                        height={600}
                        className="w-full"
                      />
                    </EditableImage>
                    {/* Inline caption editor — invisible outside edit mode,
                        renders an empty wrapper so the visual stays the
                        same (caption is already inside PolaroidFrame). */}
                    <EditableText
                      id={`photo.${photo._id}.alt`}
                      label={`Caption · ${photo.caption || "(no caption)"}`}
                      value={photo.caption ?? ""}
                      save={patchPhotoFieldInline.bind(null, photo._id, "alt")}
                      hint="The caption shows under the polaroid and is also used as alt text for screen readers."
                      as="div"
                      className="mt-1"
                    >
                      <span className="sr-only">
                        Edit caption: {photo.caption || "(empty)"}
                      </span>
                    </EditableText>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          ) : (
            <GalleryGrid photos={STATIC_PHOTOS} />
          )}
        </section>
      </div>
    </main>
  );
}

/* ---------- VideoSection ---------- */

/**
 * Groups normalized GalleryVideo entries by category and renders one section
 * per category. Used by both the admin-managed branch and the static
 * fallback so they share styling and behavior.
 */
function VideoSection({
  videos,
  labelForCategory,
}: {
  videos: GalleryVideo[];
  labelForCategory: (cat: string) => string;
}) {
  // Group by category, preserving input order within each group.
  const byCategory = new Map<string, GalleryVideo[]>();
  for (const v of videos) {
    const key = v.category && KNOWN_CATEGORIES.has(v.category) ? v.category : "other";
    const bucket = byCategory.get(key) ?? [];
    bucket.push(v);
    byCategory.set(key, bucket);
  }

  // Order categories using CATEGORY_ORDER, then append any unexpected ones.
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...Array.from(byCategory.keys()).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <>
      {orderedCategories.map((category) => {
        const list = byCategory.get(category);
        if (!list || list.length === 0) return null;
        const label = labelForCategory(category);
        return (
          <section key={category} className="mt-16">
            <ScrollReveal>
              <div className="mb-6 flex items-center justify-center gap-2">
                <Star className="h-4 w-4" />
                <h2 className="font-display text-2xl text-ink">{label}</h2>
                <Star className="h-4 w-4" variant="filled" />
              </div>
            </ScrollReveal>
            <StaggerGrid
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
              staggerDelay={0.12}
            >
              {list.map((video) => (
                <StaggerItem key={video.id}>
                  <VideoCard video={video} categoryLabel={video.category ? labelForCategory(video.category) : undefined} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          </section>
        );
      })}
    </>
  );
}

/* ---------- VideoCard ---------- */

function VideoCard({
  video,
  categoryLabel,
}: {
  video: GalleryVideo;
  categoryLabel?: string;
}) {
  const releaseLabel = formatHebrewMonthYear(video.releaseDate);

  return (
    <div>
      <div className="overflow-hidden rounded-sm bg-white p-2 shadow-md paper-fold">
        <YouTubeCard youtubeId={video.youtubeId} title={video.title} />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className="font-display text-lg text-ink">{video.title}</p>
        {categoryLabel && (
          <span className="inline-block rounded-full bg-paper px-2 py-0.5 text-xs text-ink-soft ring-1 ring-ink/10">
            {categoryLabel}
          </span>
        )}
      </div>
      {releaseLabel && <p className="mt-1 text-xs text-ink-soft">{releaseLabel}</p>}
      {video.description && (
        <p className="mt-1 text-sm text-ink-soft">{video.description}</p>
      )}
    </div>
  );
}

