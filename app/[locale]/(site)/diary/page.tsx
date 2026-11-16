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

export function generateMetadata(): Metadata {
  const title = "יומן / מכתבים — עלמה גוב";
  const description = "מחשבות, זיכרונות, שירים, וסיפורים קטנים מהיומן של עלמה.";
  return {
    title: { absolute: title },
    description,
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

export const STATIC_DIARY_ENTRIES: DiaryEntry[] = [
  {
    _id: "d1",
    title: "מכתב אחרי ברבי",
    slug: { current: "after-barby" },
    date: "2024-08-20",
    excerpt:
      "ירדתי מהבמה רועדת. כל מילה ששרתי הקהל החזיר לי. רגע אחד עצרתי באמצע שיר כי שמעתי את הקול שלהם חזק יותר משלי — ופתאום הבנתי שזה כבר לא רק שלי.",
    featured: true,
    staticImage: {
      src: "/images/gallery-live-crowd.jpg",
      alt: "עלמה על הבמה בברבי, הקהל שר את המילים",
    },
  },
  {
    _id: "d2",
    title: "בסיבוב, על הפרידה",
    slug: { current: "bsibub-breakup" },
    date: "2026-02-10",
    excerpt:
      "חשבתי שאם רק אעבור לעיר אחרת — הזיכרונות יישארו שם. לא ידעתי שהם נוסעים איתי ברכבת, נכנסים איתי לדירה חדשה, יושבים על שולחן הסלון כאילו זה הבית שלהם. כתבתי את 'בסיבוב' בלילה כזה.",
    staticImage: {
      src: "/images/gallery-notebook.jpg",
      alt: "מחברת מילים פתוחה על שולחן",
    },
  },
  {
    _id: "d3",
    title: "המחברת לא תיגמר",
    slug: { current: "notebook-promise" },
    date: "2025-11-04",
    excerpt:
      "אנשים שואלים אותי איך אני יודעת ששיר טוב. התשובה היחידה שלי: אם הוא נשאר איתי גם בבוקר אחרי. אם כתבתי אותו בערב והוא עדיין רץ אצלי בראש כשאני עושה קפה — אז משהו שם אמיתי.",
    staticImage: {
      src: "/images/gallery-couch.jpg",
      alt: "עלמה מתבוננת לחלון בבית",
    },
  },
  {
    _id: "d4",
    title: "ביכורים, געגוע שלא נגמר",
    slug: { current: "bikurim-longings" },
    date: "2024-10-07",
    excerpt:
      "השנה הזו, יותר מתמיד, אני חוזרת לכפר הנוער ביכורים בראש. הבית הראשון שבחרתי לעצמי. שם למדתי לאהוב, שם למדתי לכתוב. עכשיו אני שולחת ממנו רק מילים — ומקווה שיגיעו לאן שהוא צריך להגיע.",
    staticImage: {
      src: "/images/alma-portrait-vintage.jpg",
      alt: "פורטרט שקט בחדר עם פוסטר הביטלס",
    },
  },
  {
    _id: "d5",
    title: "סבתא, אמא, הביטלס",
    slug: { current: "beatles-inheritance" },
    date: "2025-06-15",
    excerpt:
      "אמא שלי שמה לנו Blackbird לפני שעוד ידעתי לקרוא. סבא שלי הכניס את הביטלס למשפחה והם פשוט נשארו. עד היום, כשאני מחפשת איך לסיים שיר — אני סוגרת עיניים ושומעת את ההרמוניות שלהם בראש.",
    staticImage: {
      src: "/images/alma-portrait-blue.jpg",
      alt: "פורטרט במגוון תכלת",
    },
  },
  {
    _id: "d6",
    title: "סריגה בין שירים",
    slug: { current: "crochet-meditation" },
    date: "2025-04-22",
    excerpt:
      "כשהמילים לא באות אני סורגת. זה הדבר הכי מדיטטיבי שיצא לי. הידיים עסוקות, הראש משוחרר, ואז — בדרך כלל איפה שהוא בין השורות — מגיע משפט שאני רצה לרשום אותו לפני שיברח.",
    staticImage: {
      src: "/images/gallery-embroidery.jpg",
      alt: "ידיים סורגות בחדר אור",
    },
  },
  {
    _id: "d7",
    title: "ערב לפני הופעה",
    slug: { current: "night-before-show"  },
    date: "2025-08-08",
    excerpt:
      "תמיד יש את החצי שעה הזו לפני שעולים. כולם מסביב עסוקים, ואני יושבת לבד בחדר ההלבשה, מסתכלת על הראי, וחושבת — איך זה שהשיר שכתבתי במחברת בלילה אחד יהיה עוד מעט בפיות של אנשים שאני לא מכירה.",
    staticImage: {
      src: "/images/gallery-backstage-mirror.jpg",
      alt: "ראי חדר הלבשה לפני הופעה",
    },
  },
  {
    _id: "d8",
    title: "תל אביב, זרה ומוזרה",
    slug: { current: "tel-aviv-stranger" },
    date: "2025-09-12",
    excerpt:
      "עברתי לעיר כי הרגשתי שזה הצעד הבא. אבל יש לי בוקרים שאני מתעוררת ולא מבינה איך הגעתי לפה. תל אביב לא לגמרי בשבילי, ועדיין — באמצע הרעש, איפה שהוא בין הצופרים והאוטובוסים, מצאתי שירים חדשים.",
    staticImage: {
      src: "/images/gallery-motion-blur.jpg",
      alt: "תנועה מטושטשת ברחוב בעיר",
    },
  },
];

export default async function DiaryPage() {
  const [entries, settings] = await Promise.all([
    getAllDiaryEntries({ limit: 24 }).catch(() => []),
    getSettingsAdmin().catch(() => null),
  ]);
  const hasEntries = entries.length > 0;
  const displayEntries = hasEntries ? entries : STATIC_DIARY_ENTRIES;
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
              <p className="mt-2 font-display text-sm text-blush-400 md:text-base">
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

          <StaggerGrid className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
            {displayEntries.map((entry) => (
              <StaggerItem key={entry._id} className="h-full">
                <DiaryCard entry={entry} isPlaceholder={!hasEntries} />
              </StaggerItem>
            ))}
          </StaggerGrid>
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
    <h2 className="mt-1 font-display text-lg text-ink group-hover:text-blush-500 transition-colors">
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
      <h2 className="mt-1 font-display text-lg text-ink group-hover:text-blush-500 transition-colors">
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
