import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PolaroidFrame, HandwrittenUnderline } from "@/components/ui";
import { Heart } from "@/components/decorative";
import { FloatingDoodle, ScrollReveal } from "@/components/motion";

export async function DiaryCard() {
  const t = await getTranslations("homepage.diary");
  return (
    <ScrollReveal direction="right" className="flex-1">
      {/* Padding scaled up at lg — when the row sits inside max-w-7xl
          alongside the new big portrait hero, the previous p-6/p-8 felt
          cramped. */}
      <div className="relative rounded-lg bg-paper-warm/40 p-6 md:p-8 lg:p-10">
        <div className="flex items-start gap-4 md:gap-6 lg:gap-8">
          {/* Polaroid with handwritten note */}
          <div className="relative flex-shrink-0">
            {/* Headscarf "resting on the rug" shot — moved here from the
                hero (where it didn't fit the mockup's framing). Its
                intimate, candlelit, eyes-closed vibe matches the
                "Letters / Diary" section's quiet-late-night-writing
                theme much better. Sized up alongside the rest of the
                card so it doesn't read tiny next to the big stage hero
                photo in the section above. */}
            <PolaroidFrame
              src="/images/alma-hero.jpg"
              alt={t("title")}
              rotation={-4}
              width={240}
              height={300}
              className="w-40 md:w-48 lg:w-56"
            />
            {/* Sticky note overlay - bottom-left of polaroid, slight rotation.
                Scaled with the polaroid: handwritten line is now
                comfortably readable next to the bigger frame. */}
            <div
              className="absolute -bottom-3 -start-2 max-w-[160px] rounded-sm bg-white px-3 py-2 shadow-sm md:-bottom-5 md:-start-4 md:max-w-[200px] lg:-bottom-6 lg:-start-5 lg:max-w-[240px]"
              style={{ transform: "rotate(-6deg)" }}
            >
              <p className="font-display text-xl leading-snug text-ink md:text-2xl lg:text-2xl">
                {t("stickyNote")}
              </p>
            </div>
          </div>

          {/* Right column - text. Sizes step up at lg so the title and
              body don't feel small compared to the hero typography. */}
          <div className="flex-1 pt-2">
            <h2 className="flex items-center gap-2 font-display text-2xl text-ink md:text-3xl lg:text-4xl">
              <HandwrittenUnderline>{t("title")}</HandwrittenUnderline>
              <Heart className="h-4 w-4 lg:h-5 lg:w-5" />
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft md:text-base lg:text-lg">
              {t("subtitle")}
            </p>
            <Link
              href="/diary"
              className="mt-4 inline-flex items-center gap-1 text-sm text-blush-700 transition-colors hover:text-blush-600 md:text-base lg:text-lg"
            >
              {t("readMore")}
            </Link>
          </div>
        </div>

        {/* Decorative hearts */}
        <FloatingDoodle className="absolute -top-2 -end-2" intensity={4} duration={6}>
          <Heart className="h-4 w-4 rotate-12 opacity-60 lg:h-5 lg:w-5" />
        </FloatingDoodle>
        <FloatingDoodle className="absolute -bottom-2 start-12" intensity={3} duration={7}>
          <Heart className="h-3 w-3 -rotate-12 opacity-50 lg:h-4 lg:w-4" />
        </FloatingDoodle>
      </div>
    </ScrollReveal>
  );
}
