import { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PolaroidFrame, HandwrittenUnderline, Button, DoodleScatter } from "@/components/ui";
import {
  Heart,
  Daisy,
  Star,
  Tape,
  Butterfly,
  MusicNote,
  Guitar,
  Squiggle,
} from "@/components/decorative";
import { ScrollReveal, FloatingDoodle, MagneticElement } from "@/components/motion";
import { HeroAnimations, HeroLineStagger, HeroPulseButton } from "./HeroAnimations";
import { DiaryCard } from "./DiaryCard";
import { ShowsCard } from "./ShowsCard";
import { EditableLongText } from "@/components/admin/Editable";
import { saveHeroDescriptionInline } from "@/app/admin/settings/actions";
import { getSiteSettings, getUpcomingShows } from "@/lib/content";
import type { Show } from "@/lib/content";

export const revalidate = 60;

const HOME_META = {
  title: "עלמה גוב — שירים, מכתבים, הופעות",
  description:
    "האתר הרשמי של עלמה גוב — כותבת, מלחינה ויוצרת. שירים שהם מכתבים לעצמי ולכם.",
  alt: "עלמה גוב — הופעה חיה",
} as const;

export function generateMetadata(): Metadata {
  return {
    title: HOME_META.title,
    description: HOME_META.description,
    openGraph: {
      title: HOME_META.title,
      description: HOME_META.description,
      url: "https://almagov.co.il/",
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "profile",
      images: [
        {
          url: "/images/alma-singing-purple.jpg",
          width: 1200,
          height: 630,
          alt: HOME_META.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_META.title,
      description: HOME_META.description,
      images: ["/images/alma-singing-purple.jpg"],
    },
  };
}

export default async function HomePage() {
  // Hebrew-only site — `setRequestLocale(routing.defaultLocale)` is set
  // implicitly by the parent locale layout; no need to await `params`.
  const t = await getTranslations("hero");
  const heroLines = [t("line1"), t("line2"), t("line3")];

  const [settings, upcomingShows] = await Promise.all([
    getSiteSettings().catch(() => null),
    getUpcomingShows({ limit: 5 }).catch(() => []),
  ]);

  const finalHeroLines =
    settings?.heroDescription?.length === 3
      ? settings.heroDescription
      : heroLines;

  const upcoming = upcomingShows;

  return (
    <main>
      <HeroSection
        heroLines={finalHeroLines}
        ctaLabel={t("cta")}
        title={t("title")}
      />
      <DiaryShowsRow upcoming={upcoming} />
    </main>
  );
}

function HeroSection({
  heroLines,
  ctaLabel,
  title,
}: {
  heroLines: string[];
  ctaLabel: string;
  title: string;
}) {
  // The hero description is admin-editable — `EditableLongText` activates
  // its inline editor only inside the /admin/edit iframe, so wrapping
  // unconditionally is safe.
  const wrappedStagger = (
    <EditableLongText
      id="siteSettings.heroDescription"
      label="טקסט הירו (3 שורות)"
      value={heroLines.join("\n")}
      save={saveHeroDescriptionInline}
      hint="One line per row. The hero shows the first three lines."
      as="div"
    >
      <HeroLineStagger lines={heroLines} />
    </EditableLongText>
  );
  return (
    <section className="relative overflow-hidden px-6 pt-8 pb-10 md:px-10 md:pt-12 md:pb-14 lg:px-14">
      <DoodleScatter seed="hero" className="opacity-30" />
      {/* max-w-7xl (1280px) + larger horizontal padding pushes the photo
          and title genuinely toward the side edges of the viewport, as
          in the mockup. Smaller gap so the photo and title don't get
          re-centered into the middle by an over-wide gutter. */}
      <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 md:flex-row md:gap-8 lg:gap-12">
        {/* Text — left in RTL */}
        <div className="relative flex-1 text-center md:text-start">
          <FloatingDoodle className="absolute -top-4 end-8 hidden md:block" intensity={6} duration={5}>
            <Heart className="h-5 w-5 opacity-50 rotate-12" />
          </FloatingDoodle>
          <FloatingDoodle className="absolute -top-2 end-24 hidden md:block" intensity={4} duration={6}>
            <Star className="h-4 w-4 opacity-40" />
          </FloatingDoodle>

          <HeroAnimations>
            <h1 className="font-display text-6xl font-bold leading-tight text-ink md:text-8xl flex items-center justify-center md:justify-start gap-3">
              <Heart className="h-8 w-8 md:h-10 md:w-10 -rotate-12" />
              <HandwrittenUnderline>{title}</HandwrittenUnderline>
            </h1>
            <FloatingDoodle className="absolute end-0 top-12 hidden md:block" intensity={4} duration={6}>
              <Daisy className="h-6 w-6 opacity-50" />
            </FloatingDoodle>
          </HeroAnimations>

          <FloatingDoodle className="absolute end-0 top-16 hidden md:block" intensity={5} duration={7}>
            <Heart className="h-3 w-3 opacity-50 -rotate-12" />
          </FloatingDoodle>

          {/* NEW: Squiggle accent right under the title — wavy hand-drawn
              underline that compliments the HandwrittenUnderline. Unique
              shape (none of the other doodles are this). */}
          <div className="mx-auto md:mx-0 mt-2 max-w-[10rem] opacity-60 md:max-w-[14rem]">
            <Squiggle className="text-blush-400" />
          </div>

          {wrappedStagger}

          {/* NEW: more decorations in the space between the description
              lines and the CTA button. */}
          <FloatingDoodle className="absolute end-32 top-1/2 hidden md:block" intensity={3} duration={6}>
            <MusicNote className="h-5 w-4 opacity-50 rotate-12" />
          </FloatingDoodle>
          <FloatingDoodle className="absolute start-0 top-2/3 hidden lg:block" intensity={4} duration={7}>
            <Butterfly className="h-7 w-8 opacity-50 -rotate-6" />
          </FloatingDoodle>

          <div className="mt-8">
            <HeroPulseButton>
              <MagneticElement strength={0.18}>
                <Button href="/music" size="lg">{ctaLabel}</Button>
              </MagneticElement>
            </HeroPulseButton>
          </div>

          <FloatingDoodle className="mx-auto mt-8 md:mx-0" intensity={4} duration={5}>
            <Daisy className="h-6 w-6 opacity-50" />
          </FloatingDoodle>

          <FloatingDoodle className="absolute -bottom-2 start-12 hidden md:block" intensity={3} duration={8}>
            <Star className="h-4 w-4 opacity-40" variant="filled" />
          </FloatingDoodle>

          {/* NEW: Guitar peeking from the bottom-end corner of the text
              column — fills the gap below the CTA button. Hidden on
              mobile because it'd overflow the narrower layout. */}
          <FloatingDoodle className="absolute -bottom-6 -end-4 hidden lg:block" intensity={3} duration={9}>
            <Guitar className="h-12 w-6 opacity-40 rotate-12" />
          </FloatingDoodle>

          {/* NEW: second Squiggle, much further down, acts as a
              little marginalia mark between sections. */}
          <div className="absolute -bottom-10 start-1/4 hidden md:block w-24 opacity-40">
            <Squiggle className="text-blush-300" />
          </div>
        </div>

        {/* Photo — left in RTL (start-side in mockup). Hero source is
            now a natural-light casual portrait against a white wall —
            soft, intimate, diary-aesthetic. It's natively 16:9
            landscape so the wide low-profile polaroid frame fits
            without any cropping.
            Doodles around the frame mirror the mockup's marginalia:
            small hearts above + below, a sparkle bottom-corner, a
            couple of accents on the sides. */}
        <ScrollReveal direction="left" className="flex-shrink-0">
          {/* Desktop: BIG landscape polaroid — same wide footprint as
              the previous hero, but the 16/9 aspect makes it even
              less tall than the earlier 3/2 crop. Width at ~44rem
              (md) / ~60rem (lg) combined with max-w-7xl puts the
              photo right at the side edge of the viewport. */}
          <div
            className="hidden md:block relative w-[44rem] lg:w-[60rem]"
            style={{ transform: "rotate(-2.5deg)" }}
          >
            <div className="overflow-hidden rounded-sm bg-white p-3 pb-6 shadow-lg">
              <Image
                src="/images/alma-portrait-casual.jpg"
                alt={title}
                // Source is 1044×587 native (16:9 landscape). We
                // declare those exact dimensions so Next's optimizer
                // sees the true aspect, then aspect-[16/9] on the
                // rendered box matches — so object-cover effectively
                // does no cropping; the photo renders exactly as
                // captured.
                width={1044}
                height={587}
                priority
                // quality 92 (vs default 75) — near-lossless for the
                // hero. Allowlisted in next.config.ts under
                // `images.qualities`. The source is only 1044px wide
                // so at lg the optimizer barely scales it down (display
                // ~960px), which keeps the image sharp.
                quality={92}
                sizes="(min-width: 1024px) 60rem, (min-width: 768px) 44rem, 90vw"
                // aspect-[16/9] matches the source's native ratio — no
                // cropping. The polaroid is noticeably less tall than
                // the previous 3:2 framing, leaning further into the
                // "wide horizontal scrapbook photo" look.
                className="h-auto w-full rounded-sm object-cover aspect-[16/9]"
              />
            </div>
            {/* Hand-drawn-looking doodles around the photo — denser than
                before, matching the mockup's scattered marginalia around
                the hero polaroid. Mostly small hearts + a couple of
                stars and a sparkle, all rotated and floating at
                slightly different rates so they read as hand-placed
                stickers rather than evenly spaced ornaments. */}
            <FloatingDoodle className="absolute -top-6 -start-4" intensity={3} duration={7}>
              <Heart className="h-7 w-7 opacity-80 -rotate-12" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute -top-3 end-12" intensity={4} duration={6}>
              <Heart className="h-3 w-3 opacity-60 rotate-12" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute top-1/4 -end-5" intensity={3} duration={8}>
              <Heart className="h-4 w-4 opacity-55 rotate-45" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute top-2/3 -start-5" intensity={4} duration={7}>
              <Star className="h-4 w-4 opacity-55 -rotate-12" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute -bottom-4 -start-5" intensity={3} duration={8}>
              <Heart className="h-5 w-5 opacity-70 rotate-6" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute -bottom-3 start-1/3" intensity={4} duration={6}>
              <Star className="h-3 w-3 opacity-50 rotate-12" variant="filled" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute -bottom-2 end-8" intensity={3} duration={9}>
              <MusicNote className="h-4 w-3 opacity-50 -rotate-6" />
            </FloatingDoodle>
            <FloatingDoodle className="absolute bottom-12 -end-7" intensity={4} duration={7}>
              <Butterfly className="h-6 w-7 opacity-50 rotate-6" />
            </FloatingDoodle>
          </div>
          {/* Mobile: same casual portrait as desktop. Declared dims
              720×405 — same 16:9 native ratio as the 1044×587 source,
              so PolaroidFrame's internal Image doesn't crop.
              No `priority` here: BOTH the desktop `<Image priority>` above
              AND this mobile <Image> live in the DOM at the same time
              (only their breakpoint visibility differs via hidden/md:hidden);
              if both were priority, Next would eagerly preload both
              variants, doubling LCP bandwidth on every visit. The desktop
              one keeps priority since it's the actual hero on the screens
              that affect LCP scoring; the mobile one falls back to lazy. */}
          <PolaroidFrame
            src="/images/alma-portrait-casual.jpg"
            alt={title}
            rotation={-2.5}
            decorate
            width={720}
            height={405}
            className="w-80 md:hidden"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}

function DiaryShowsRow({ upcoming }: { upcoming: Show[] }) {
  // If the admin panel has upcoming, use that; else use static fallback.
  // Static fallback shows for when the admin panel has no upcoming entries.
  const staticUpcoming = [
    { id: "u1", date: "2026-06-12", venue: "המועדון של הבארבי", city: "תל אביב", ticketUrl: "https://example.com" },
    { id: "u2", date: "2026-07-03", venue: "תיאטרון תמונע", city: "חיפה", ticketUrl: "https://example.com" },
    { id: "u3", date: "2026-08-22", venue: "מוסררה", city: "ירושלים", ticketUrl: "https://example.com" },
  ];

  const showsForCard = upcoming.length > 0
    ? upcoming.map((s) => ({
        id: s._id,
        date: s.date,
        venue: s.venue,
        city: s.city,
        ticketUrl: s.ticketUrl,
      }))
    : staticUpcoming;

  return (
    <section className="px-6 pt-2 pb-12 md:px-10 md:pt-4 md:pb-16 lg:px-14">
      {/* max-w-7xl + matching horizontal padding lines this row up with
          the hero section above. The diary + shows cards now feel like
          a continuation of the same composition rather than a narrower
          afterthought below the big polaroid. */}
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:gap-10 md:items-stretch lg:gap-14">
          <DiaryCard />
          <ShowsCard shows={showsForCard} />
        </div>
      </div>
    </section>
  );
}
