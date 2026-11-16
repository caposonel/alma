import { Metadata } from "next";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTranslations } from "next-intl/server";
import { HandwrittenUnderline } from "@/components/ui";
import {
  Heart,
  Daisy,
  Star,
  NotebookLines,
  Guitar,
  Butterfly,
  MusicNote,
  Tape,
} from "@/components/decorative";
import {
  ScrollReveal,
  FloatingDoodle,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion";
import { ScrollToTopOnMount } from "@/components/motion/ScrollToTopOnMount";
import { EditableText, EditableLongText } from "@/components/admin/Editable";
import { saveAboutBioParagraphsInline } from "@/app/admin/about/actions";
import { saveContentOverrideInline } from "@/app/admin/settings/actions";
import { getSettingsAdmin } from "@/lib/admin-store";
import { readContentOverride } from "@/lib/content-overrides";
import { getAdminAbout } from "@/lib/content";
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

export function generateMetadata(): Metadata {
  const title = "אודות — עלמה גוב";
  const description = "קצת על עלמה גוב — כותבת, מלחינה ויוצרת.";
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/about`,
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "profile",
      images: [
        {
          url: "/images/alma-portrait-studio.jpg",
          width: 1200,
          height: 630,
          alt: "פורטרט אולפן של עלמה גוב",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/alma-portrait-studio.jpg"],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Static fallback data (used when the admin panel hasn't been populated) */
/* ------------------------------------------------------------------ */

export const MILESTONES: { year: string; text: string }[] = [
  { year: "2021", text: "אלבום בכורה — \"מאוחר מידי\"" },
  { year: "2022", text: "מועמדת לפרס פריצת השנה — גלגלצ" },
  { year: "2023", text: "מקום שני בשיר השנה — כאן 88" },
  { year: "2023", text: "\"מה לעשות עם הזאב\" — 6M+ השמעות" },
  { year: "2024", text: "פסקול \"האחיות המצליחות\" עונה 4" },
  { year: "2024", text: "אלבום \"עולם שלי\"" },
];

export const INFLUENCES: { name: string; icon: string }[] = [
  { name: "ג׳וני מיטשל", icon: "🎵" },
  { name: "פיבי ברידג׳רס", icon: "🌙" },
  { name: "הביטלס", icon: "🎸" },
  { name: "שלמה ארצי", icon: "🎤" },
];

export const FUN_FACTS: string[] = [
  "מנגנת בפסנתר מגיל 6",
  "למדה ג׳אז בגיל 14",
  "כותבת שירים בלילה",
  "אוהבת חתולים",
];

/* Deterministic tilt for fun-fact cards.
 * Math.random() in inline styles causes SSR/client hydration mismatches.
 * Hashing the fact text produces stable values (-3..+3 degrees) on both sides.
 */
function tiltFromText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 7) - 3;
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function AboutPage() {
  const [adminAbout, settings] = await Promise.all([
    getAdminAbout().catch(() => null),
    getSettingsAdmin().catch(() => null),
  ]);
  const t = await getTranslations("about");

  const portraitUrl = "/images/alma-portrait-studio.jpg";

  // Override-aware headings — falls back to the translation string when
  // the admin hasn't set one.
  const aboutTitle = readContentOverride(settings, "page.about.title", t("title"));

  /* Resolve admin-managed content — each section falls back to its static
   * default when the editor hasn't been populated yet. */
  const bioParagraphs =
    adminAbout?.bioParagraphs && adminAbout.bioParagraphs.length > 0
      ? adminAbout.bioParagraphs
      : null;
  const funFacts =
    adminAbout?.funFacts && adminAbout.funFacts.length > 0
      ? adminAbout.funFacts
      : FUN_FACTS;
  const milestones =
    adminAbout?.milestones && adminAbout.milestones.length > 0
      ? adminAbout.milestones
      : MILESTONES;
  const influences =
    adminAbout?.influences && adminAbout.influences.length > 0
      ? adminAbout.influences
      : INFLUENCES;
  // Press quotes appear only when entered in the admin panel. The built-in
  // fallback quotes (credited to real outlets, unverified) are no longer
  // shown on the public site.
  const pressQuotes = adminAbout?.pressQuotes ?? [];

  return (
    <main className="px-6 py-12">
      <ScrollToTopOnMount />
      <div className="mx-auto max-w-4xl">
        {/* -------- Title -------- */}
        <ScrollReveal>
          <div className="text-center">
            <FloatingDoodle className="mx-auto mb-2 w-fit" intensity={3} duration={7}>
              <Butterfly className="h-7 w-8 opacity-60" />
            </FloatingDoodle>
            <EditableText
              id="override.page.about.title"
              label="About page title"
              value={aboutTitle}
              save={saveContentOverrideInline.bind(null, "page.about.title")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <h1 className="font-display text-4xl text-ink md:text-5xl">
                <HandwrittenUnderline>{aboutTitle}</HandwrittenUnderline>
              </h1>
            </EditableText>
          </div>
        </ScrollReveal>

        {/* -------- Portrait + Bio -------- */}
        <div className="mt-12 flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-12">
          {/* Portrait */}
          <ScrollReveal direction="right" className="relative flex-shrink-0 w-56 md:w-64">
            <div style={{ transform: "rotate(-2deg)" }}>
              <Tape className="absolute -top-3 start-1/2 z-10 opacity-60" centerX />
              <div className="rounded-sm bg-white p-3 pb-14 shadow-md">
                <div className="relative overflow-hidden">
                  <Image
                    src={portraitUrl}
                    alt="עלמה גוב"
                    width={500}
                    height={600}
                    className="block h-auto w-full object-cover"
                  />
                </div>
              </div>
              <FloatingDoodle className="absolute -top-2 -end-2" intensity={4} duration={6}>
                <Heart className="h-4 w-4 rotate-12" />
              </FloatingDoodle>
              <FloatingDoodle className="absolute -bottom-1 -start-2" intensity={3} duration={7}>
                <Heart className="h-3 w-3 -rotate-12" />
              </FloatingDoodle>
              <FloatingDoodle className="absolute bottom-6 -end-4" intensity={5} duration={8}>
                <MusicNote className="h-4 w-3 opacity-40" />
              </FloatingDoodle>
            </div>
          </ScrollReveal>

          {/* Bio */}
          <ScrollReveal direction="left" delay={0.15} className="flex-1">
            <NotebookLines className="rounded-sm px-4 py-2">
              <EditableLongText
                id="about.bioParagraphs"
                label="ביוגרפיה (פסקאות)"
                /* When admin has bio content, the editor pre-fills with it
                 * (so the admin can tweak in place). When the page is
                 * falling back to the hard-coded placeholder paragraphs
                 * below, the editor opens EMPTY — the placeholder is just
                 * filler; first inline edit becomes the canonical bio. */
                value={bioParagraphs ? bioParagraphs.join("\n\n") : ""}
                save={saveAboutBioParagraphsInline}
                hint={
                  bioParagraphs
                    ? "Separate paragraphs with a blank line. Markdown (bold, italic, links, lists) is supported."
                    : "The bio shown on the page is placeholder text. Type the real bio here — saving it stores the canonical version in admin and replaces the placeholder."
                }
                as="div"
              >
                {bioParagraphs ? (
                  <div
                    className="prose-diary space-y-4 text-ink leading-relaxed"
                    dir="auto"
                  >
                    {/* Each admin-saved paragraph is rendered as markdown so
                        bold/italic/links/lists/quotes survive the round-trip. */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {bioParagraphs.join("\n\n")}
                    </ReactMarkdown>
                  </div>
                ) : (
                <div className="space-y-4 text-ink leading-relaxed">
                  <p>
                    עלמה גוב (נולדה ב-2002, מושב ערוגות) היא זמרת, כותבת שירים ומלחינה ישראלית בז׳אנרים של אינדי-פופ, פולק ופופ-רוק עם השפעות ג׳אז ואלקטרוניקה.
                  </p>
                  <p>
                    התחילה לנגן בפסנתר בגיל 6, למדה ג׳אז בכפר הנוער ביכורים בגיל 14, ושירתה כמנהלת מוזיקלית ביפו. את דרכה המוזיקלית העצמאית החלה ב-2021 עם אלבום הבכורה &quot;מאוחר מידי&quot;, ומאז הוציאה ארבעה אלבומי אולפן.
                  </p>
                  <p>
                    ב-2022 מועמדת לפרס &quot;פריצת השנה&quot; בגלגל&quot;צ. ב-2023 זכתה במקום השני בשיר השנה של כאן 88 עם &quot;מה לעשות עם הזאב&quot; — שיר שעבר את ששת מיליון ההשמעות בספוטיפיי. ב-2024 הלחינה את פסקול הסדרה &quot;האחיות המצליחות&quot; עונה 4.
                  </p>
                  <p>
                    ההשפעות שלה כוללות את ג׳וני מיטשל, פיבי ברידג׳רס, והביטלס. המוזיקה שלה משלבת מנגינות קליטות עם מילים עמוקות ואישיות — שירים שהם מכתבים לעצמה ולמאזינים.
                  </p>
                </div>
                )}
              </EditableLongText>
            </NotebookLines>
            <div className="mt-2 flex justify-end">
              <FloatingDoodle intensity={4} duration={5}>
                <Daisy className="h-5 w-5 opacity-50" />
              </FloatingDoodle>
            </div>
          </ScrollReveal>
        </div>

        {/* -------- Fun Facts -------- */}
        <ScrollReveal as="section" className="mt-12 md:mt-16">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Star className="h-5 w-5" />
            <h2 className="font-display text-2xl font-bold text-ink">{t("sectionFunFacts")}</h2>
            <Star className="h-5 w-5" />
          </div>
          <StaggerGrid className="flex flex-wrap justify-center gap-4">
            {funFacts.map((fact) => (
              <StaggerItem key={fact}>
                <div
                  className="relative rounded border border-blush-100 bg-paper-warm px-5 py-3 font-display"
                  style={{ transform: `rotate(${tiltFromText(fact)}deg)` }}
                >
                  <Tape className="absolute -top-2.5 start-1/2 h-3 w-10 opacity-40" centerX />
                  <span className="text-xl text-ink" dir="auto">{fact}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </ScrollReveal>

        {/* -------- Milestones Timeline -------- */}
        <ScrollReveal as="section" className="mt-12 md:mt-16">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Guitar className="h-8 w-3 opacity-60" />
            <h2 className="font-display text-2xl font-bold text-ink">{t("sectionMilestones")}</h2>
            <Guitar className="h-8 w-3 opacity-60 -scale-x-100" />
          </div>

          <div className="relative mx-auto max-w-lg">
            {/* Dashed vertical timeline line */}
            <div
              className="absolute start-4 top-0 bottom-0 w-px"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, var(--color-blush-300, #f0b4b4) 0 6px, transparent 6px 12px)",
              }}
              aria-hidden="true"
            />

            <div className="space-y-6">
              {milestones.map((ms, i) => (
                <ScrollReveal key={`${ms.year}-${i}`} delay={i * 0.07}>
                  <div className="relative flex items-start gap-4 ps-10">
                    {/* Blush dot */}
                    <span
                      className="absolute start-2.5 top-1.5 h-3 w-3 rounded-full bg-blush-400 ring-2 ring-white"
                      aria-hidden="true"
                    />
                    <span className="flex-shrink-0 font-display text-xl leading-6 text-blush-700">
                      {ms.year}
                    </span>
                    <span className="text-ink" dir="auto">{ms.text}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <FloatingDoodle className="absolute -end-6 top-4" intensity={4} duration={6}>
              <MusicNote className="h-5 w-4 opacity-30" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute -end-2 bottom-8 md:-end-8" intensity={3} duration={8}>
              <Star className="h-4 w-4 opacity-30" />
            </FloatingDoodle>
          </div>
        </ScrollReveal>

        {/* -------- Musical Influences -------- */}
        <ScrollReveal as="section" className="mt-12 md:mt-16">
          <div className="mb-6 flex items-center justify-center gap-2">
            <MusicNote className="h-5 w-4 opacity-60" />
            <h2 className="font-display text-2xl font-bold text-ink">{t("sectionInfluences")}</h2>
            <MusicNote className="h-5 w-4 opacity-60" />
          </div>

          <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {influences.map((inf, i) => (
              <StaggerItem key={`${inf.name}-${i}`}>
                <div className="group relative rounded-sm border border-blush-100 bg-paper-warm p-4 text-center transition-shadow hover:shadow-sm">
                  {/* Hand-drawn doodle instead of a system emoji (emoji
                      clashed with the site's line-drawn style). */}
                  <span className="mb-2 flex justify-center text-blush-600" aria-hidden="true">
                    <InfluenceDoodle icon={inf.icon} index={i} />
                  </span>
                  <span className="text-base font-medium text-ink" dir="auto">{inf.name}</span>
                  {/* Decorative corner doodle */}
                  <Star className="absolute -top-1.5 -end-1.5 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-40" />
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </ScrollReveal>

        {/* -------- Press Quotes (only real, admin-entered ones) -------- */}
        {pressQuotes.length > 0 && (
        <ScrollReveal as="section" className="mt-12 md:mt-16">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Star className="h-4 w-4" />
            <h2 className="font-display text-2xl font-bold text-ink">{t("sectionPressQuotes")}</h2>
            <Star className="h-4 w-4" variant="filled" />
          </div>
          <div className="space-y-6">
            {pressQuotes.map((q: { quote: string; source: string; sourceUrl?: string }, i: number) => (
              <blockquote
                key={i}
                className="border-e-4 border-blush-300 pe-4 text-ink-soft"
              >
                <p className="text-lg italic leading-relaxed">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <footer className="mt-2 text-sm">
                  {q.sourceUrl ? (
                    <a
                      href={q.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blush-500 hover:text-blush-600"
                    >
                      — {q.source}
                    </a>
                  ) : (
                    <span>— {q.source}</span>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
        </ScrollReveal>
        )}

        {/* Achievement stats ("4 albums", "6M+ listens", …) were hard-coded
            and unverified, so they're hidden until confirmed. */}

        {/* Bottom decorative flourish */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <FloatingDoodle intensity={3} duration={6}>
            <Heart className="h-3 w-3 opacity-30" />
          </FloatingDoodle>
          <FloatingDoodle intensity={4} duration={5}>
            <Butterfly className="h-5 w-6 opacity-25" />
          </FloatingDoodle>
          <FloatingDoodle intensity={3} duration={7}>
            <Heart className="h-3 w-3 opacity-30" />
          </FloatingDoodle>
        </div>
      </div>
    </main>
  );
}

/** Maps an influence's emoji to the nearest hand-drawn doodle. */
function InfluenceDoodle({ icon, index }: { icon?: string; index: number }) {
  const byEmoji: Record<string, React.ReactNode> = {
    "🎵": <MusicNote className="h-7 w-6" />,
    "🎶": <MusicNote className="h-7 w-6" />,
    "🎸": <Guitar className="h-8 w-4" />,
    "⭐": <Star className="h-7 w-7" />,
    "🌙": <Star className="h-7 w-7" />,
    "❤️": <Heart className="h-7 w-7" />,
    "🌼": <Daisy className="h-7 w-7" />,
    "🦋": <Butterfly className="h-7 w-8" />,
  };
  if (icon && byEmoji[icon]) return <>{byEmoji[icon]}</>;
  const cycle = [
    <MusicNote key="n" className="h-7 w-6" />,
    <Star key="s" className="h-7 w-7" />,
    <Guitar key="g" className="h-8 w-4" />,
    <Heart key="h" className="h-7 w-7" />,
    <Daisy key="d" className="h-7 w-7" />,
    <Butterfly key="b" className="h-7 w-8" />,
  ];
  return cycle[index % cycle.length];
}
