import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PolaroidFrame, HandwrittenUnderline } from "@/components/ui";
import { Heart, Daisy, Tape, NotebookLines, Star, Butterfly, Guitar, MusicNote } from "@/components/decorative";
import { ScrollReveal, StaggerGrid, StaggerItem, FloatingDoodle, ParallaxLayer } from "@/components/motion";
import { EditableText, EditableLongText, EditableImage } from "@/components/admin/Editable";
import { patchDiaryFieldInline } from "@/app/admin/diary/actions";
import { saveContentOverrideInline } from "@/app/admin/settings/actions";
import { getSettingsAdmin } from "@/lib/admin-store";
import { readContentOverride } from "@/lib/content-overrides";
import { getAllDiaryEntries, urlFor } from "@/lib/content";
import type { DiaryEntry } from "@/lib/content";
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  // While the diary has no entries the page is just an empty-state message:
  // keep it out of search results until the first letter is published.
  const hasEntries =
    (await getAllDiaryEntries({ limit: 1 }).catch(() => [])).length > 0;
  const title = "יומן / מכתבים — עלמה גוב";
  const description = "מחשבות, זיכרונות, שירים, וסיפורים קטנים מהיומן של עלמה.";
  return {
    title: { absolute: title },
    description,
    ...(hasEntries ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/diary`,
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "website",
      images: [
        {
          url: "/images/gallery-notebook.jpg",
          width: 1200,
          height: 630,
          alt: "מחברת היומן של עלמה גוב",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/gallery-notebook.jpg"],
    },
  };
}

export default async function DiaryPage() {
  const [entries, settings] = await Promise.all([
    getAllDiaryEntries({ limit: 24 }).catch(() => []),
    getSettingsAdmin().catch(() => null),
  ]);
  // Only real entries are shown. The built-in placeholder letters (written
  // in Alma's voice, not hers) were removed; with no entries the page says
  // the first letters are on their way.
  const hasEntries = entries.length > 0;
  const t = await getTranslations("diary");

  const diaryTitle = readContentOverride(settings, "page.diary.title", t("title"));
  const diarySubtitle = readContentOverride(settings, "page.diary.subtitle", t("subtitle"));
  const diaryPersonality = readContentOverride(
    settings,
    "page.diary.subtitlePersonality",
    t("subtitlePersonality")
  );

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* --- Header with margin doodles --- */}
        <ScrollReveal>
          <div className="relative text-center">
            {/* Decorative margin doodles — gentle parallax keeps them lagging a touch as you scroll */}
            <ParallaxLayer speed={-0.1}>
              <FloatingDoodle intensity={4} duration={6}>
                <Star className="absolute -start-8 top-0 h-5 w-5 opacity-30 rotate-12 hidden md:block" />
              </FloatingDoodle>
            </ParallaxLayer>
            <ParallaxLayer speed={-0.08}>
              <FloatingDoodle intensity={3} duration={7}>
                <Butterfly className="absolute -end-6 top-2 h-6 w-7 opacity-25 -rotate-6 hidden md:block" />
              </FloatingDoodle>
            </ParallaxLayer>
            <ParallaxLayer speed={-0.12}>
              <FloatingDoodle intensity={5} duration={5}>
                <MusicNote className="absolute -start-12 bottom-0 h-4 w-3 opacity-20 rotate-[-15deg] hidden lg:block" />
              </FloatingDoodle>
            </ParallaxLayer>

            <EditableText
              id="override.page.diary.title"
              label="Diary page title"
              value={diaryTitle}
              save={saveContentOverrideInline.bind(null, "page.diary.title")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <h1 className="font-display text-4xl text-ink md:text-5xl">
                <HandwrittenUnderline>{diaryTitle}</HandwrittenUnderline>
                <Heart className="ms-2 inline-block h-5 w-5" />
              </h1>
            </EditableText>
            <EditableText
              id="override.page.diary.subtitle"
              label="Diary page subtitle"
              value={diarySubtitle}
              save={saveContentOverrideInline.bind(null, "page.diary.subtitle")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <p className="mt-4 text-ink-soft">{diarySubtitle}</p>
            </EditableText>

            {/* Subtitle with more personality — shown always */}
            <EditableText
              id="override.page.diary.subtitlePersonality"
              label="Diary page personality line"
              value={diaryPersonality}
              save={saveContentOverrideInline.bind(null, "page.diary.subtitlePersonality")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <p className="mt-2 font-display text-xl text-blush-700 md:text-2xl">
                {diaryPersonality}
                <Daisy className="ms-1 inline-block h-4 w-4 opacity-50" />
              </p>
            </EditableText>
          </div>
        </ScrollReveal>

        {/* --- Entries grid --- */}
        <NotebookLines className="mt-4 rounded-lg p-4 relative">
          {/* Notebook-style margin doodles */}
          <FloatingDoodle intensity={3} duration={8}>
            <Guitar className="absolute -start-6 top-12 opacity-20 hidden lg:block" />
          </FloatingDoodle>
          <FloatingDoodle intensity={4} duration={6}>
            <Star variant="filled" className="absolute -end-5 top-1/3 h-4 w-4 opacity-20 hidden lg:block" />
          </FloatingDoodle>
          <FloatingDoodle intensity={3} duration={9}>
            <Heart className="absolute -start-5 bottom-16 h-4 w-4 opacity-15 hidden lg:block" />
          </FloatingDoodle>

          {hasEntries ? (
            <StaggerGrid className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
              {entries.map((entry) => (
                <StaggerItem key={entry._id} className="h-full">
                  <DiaryCard entry={entry} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          ) : (
            <p className="py-16 text-center font-display text-2xl text-ink-soft md:text-3xl">
              {t("empty")}
            </p>
          )}
        </NotebookLines>

      </div>
    </main>
  );
}

function DiaryCard({
  entry,
  isPlaceholder = false,
}: {
  entry: DiaryEntry;
  isPlaceholder?: boolean;
}) {
  const coverSrc = entry.coverImage
    ? urlFor(entry.coverImage).width(400).height(300).url()
    : entry.staticImage?.src ?? "/images/diary-placeholder.jpg";
  const coverAlt = entry.coverImage?.alt
    ?? entry.staticImage?.alt
    ?? entry.title;

  const dateLabel = new Date(entry.date).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* Editable-aware versions of the cover, title, excerpt. Placeholder
   * (static fallback) entries don't have a real admin id so we render
   * them naked — calling the patch action with a fake id would just
   * fail with "not found" anyway. */
  const coverNode = isPlaceholder ? (
    <PolaroidFrame
      src={coverSrc}
      alt={coverAlt}
      width={400}
      height={300}
      className="w-full transition-transform group-hover:scale-[1.02]"
    />
  ) : (
    <EditableImage
      id={`diary.${entry._id}.coverImage`}
      label={`Cover image · ${entry.title}`}
      value={coverSrc}
      save={patchDiaryFieldInline.bind(null, entry._id, "coverImage")}
      as="div"
    >
      <PolaroidFrame
        src={coverSrc}
        alt={coverAlt}
        width={400}
        height={300}
        className="w-full transition-transform group-hover:scale-[1.02]"
      />
    </EditableImage>
  );
  const titleNode = isPlaceholder ? (
    <h2 className="mt-1 font-display text-xl text-ink group-hover:text-blush-500 transition-colors">
      {entry.title}
    </h2>
  ) : (
    <EditableText
      id={`diary.${entry._id}.title`}
      label={`Diary title · ${entry.title}`}
      value={entry.title}
      save={patchDiaryFieldInline.bind(null, entry._id, "title")}
      as="div"
    >
      <h2 className="mt-1 font-display text-xl text-ink group-hover:text-blush-500 transition-colors">
        {entry.title}
      </h2>
    </EditableText>
  );
  const excerptNode = !entry.excerpt ? null : isPlaceholder ? (
    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{entry.excerpt}</p>
  ) : (
    <EditableLongText
      id={`diary.${entry._id}.excerpt`}
      label={`Diary excerpt · ${entry.title}`}
      value={entry.excerpt}
      save={patchDiaryFieldInline.bind(null, entry._id, "excerpt")}
      as="div"
    >
      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{entry.excerpt}</p>
    </EditableLongText>
  );

  const content = (
    <>
      <Tape className="absolute -top-2 start-1/4 z-10 opacity-60" rotate={-3} />
      {coverNode}
      <div className="mt-3 flex flex-grow flex-col px-1">
        <p className="text-xs text-ink-soft">{dateLabel}</p>
        {titleNode}
        {entry.featured && (
          <Star variant="filled" className="inline-block h-3 w-3 ms-1 text-blush-400 opacity-70" />
        )}
        {excerptNode}
      </div>
    </>
  );

  if (isPlaceholder) {
    return (
      <div className="group relative flex h-full flex-col cursor-default opacity-85">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/diary/${entry.slug.current}`}
      className="group relative flex h-full flex-col"
    >
      {content}
    </Link>
  );
}
