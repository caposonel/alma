import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HandwrittenUnderline } from "@/components/ui";
import {
  Heart,
  Daisy,
  Star,
  Guitar,
  Butterfly,
  MusicNote,
  NotebookLines,
} from "@/components/decorative";
import { ScrollReveal, FloatingDoodle } from "@/components/motion";
import { BandcampIcon } from "@/components/ui/SocialIcons";
import { ContactForm } from "./ContactForm";
import { EditableText } from "@/components/admin/Editable";
import { saveContentOverrideInline } from "@/app/admin/settings/actions";
import { getSettingsAdmin } from "@/lib/admin-store";
import { readContentOverride } from "@/lib/content-overrides";
import { SOCIAL_LINKS } from "@/lib/config";

export function generateMetadata(): Metadata {
  const title = "צור קשר — עלמה גוב";
  const description = "רוצים לשלוח מכתב? הזמנה להופעה? שאלה? כתבו לי.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://almagov.co.il/contact",
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "website",
      images: [
        {
          url: "/images/alma-portrait-diary.jpg",
          width: 1200,
          height: 630,
          alt: "עלמה גוב — פורטרט",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/alma-portrait-diary.jpg"],
    },
  };
}

export default async function ContactPage() {
  const [t, settings] = await Promise.all([
    getTranslations("contact"),
    getSettingsAdmin().catch(() => null),
  ]);
  const contactTitle = readContentOverride(settings, "page.contact.title", t("title"));
  const contactSubtitle = readContentOverride(settings, "page.contact.subtitle", t("subtitle"));

  return (
    <main className="px-6 py-12 md:py-16">
      {/* Hide the sticky MailingBar on the contact page only — the form here
          IS the subscribe affordance, the bar would be redundant. CSS-based
          hide bypasses SSR/CSR pathname-detection edge cases that bit us with
          the HE default route's missing locale prefix. */}
      <style>{`[data-mailing-bar] { display: none !important; }`}</style>
      {/* ── Page heading ── */}
      <ScrollReveal>
        <div className="text-center">
          <EditableText
            id="override.page.contact.title"
            label="Contact page title"
            value={contactTitle}
            save={saveContentOverrideInline.bind(null, "page.contact.title")}
            hint="Falls back to the translation file if cleared."
            as="div"
          >
            <h1 className="font-display text-4xl text-ink md:text-5xl">
              <HandwrittenUnderline>{contactTitle}</HandwrittenUnderline>
              <Heart className="ms-2 inline-block h-5 w-5" />
            </h1>
          </EditableText>
          <EditableText
            id="override.page.contact.subtitle"
            label="Contact page subtitle"
            value={contactSubtitle}
            save={saveContentOverrideInline.bind(null, "page.contact.subtitle")}
            hint="Falls back to the translation file if cleared."
            as="div"
          >
            <p className="mt-4 text-ink-soft">{contactSubtitle}</p>
          </EditableText>
        </div>
      </ScrollReveal>

      {/* ── Two-column layout ── */}
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-5 md:gap-14">
        {/* ─── Left column: info + social + decorative ─── */}
        <div className="order-2 flex flex-col gap-8 md:order-1 md:col-span-2">
          {/* Contact info cards */}
          <ScrollReveal direction="right">
            <div className="space-y-4">
              {/* Email card */}
              <div className="rounded-lg border border-blush-200 bg-paper-warm p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <h3 className="text-base font-semibold text-ink">
                    {t("infoGeneralEmail")}
                  </h3>
                </div>
                <a
                  href="mailto:almagov.music@gmail.com"
                  dir="ltr"
                  className="text-sm text-blush-500 underline decoration-blush-300 underline-offset-2 transition-colors hover:text-blush-600"
                >
                  almagov.music@gmail.com
                </a>
              </div>

              {/* Booking card */}
              <div className="rounded-lg border border-blush-200 bg-paper-warm p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <Guitar className="h-5 w-3" />
                  <h3 className="text-base font-semibold text-ink">
                    {t("infoBookingEmail")}
                  </h3>
                </div>
                <a
                  href="mailto:almagov.music@gmail.com"
                  dir="ltr"
                  className="text-sm text-blush-500 underline decoration-blush-300 underline-offset-2 transition-colors hover:text-blush-600"
                >
                  almagov.music@gmail.com
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Social links */}
          <ScrollReveal direction="right" delay={0.1}>
            <div className="rounded-lg border border-blush-200 bg-paper-warm p-5 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-ink">
                {t("infoFollow")}
              </h3>
              <div className="flex gap-4">
                {/* Instagram */}
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-500 transition-colors hover:bg-blush-200 hover:text-blush-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                {/* Spotify */}
                <a
                  href={SOCIAL_LINKS.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Spotify"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-500 transition-colors hover:bg-blush-200 hover:text-blush-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.3-.56.4-.86.2-2.36-1.44-5.32-1.76-8.82-.96-.34.08-.66-.14-.74-.46s.14-.66.46-.74c3.84-.88 7.12-.5 9.76 1.1.3.18.38.56.2.86zm1.22-2.72c-.24.38-.74.5-1.12.24-2.7-1.66-6.82-2.14-10.02-1.18-.4.12-.82-.1-.94-.5s.1-.82.5-.94c3.64-1.1 8.17-.56 11.3 1.34.36.22.5.72.28 1.04zm.1-2.82c-3.24-1.92-8.56-2.1-11.64-1.16-.48.14-1-.12-1.14-.6-.14-.48.12-1 .6-1.14 3.54-1.08 9.42-.88 13.14 1.34.44.26.58.84.32 1.28-.26.42-.84.56-1.28.28z" />
                  </svg>
                </a>
                {/* YouTube */}
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-500 transition-colors hover:bg-blush-200 hover:text-blush-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M21.8 8.001a2.749 2.749 0 0 0-1.935-1.946C18.155 5.5 12 5.5 12 5.5s-6.155 0-7.865.555A2.749 2.749 0 0 0 2.2 8.001 28.6 28.6 0 0 0 1.75 12a28.6 28.6 0 0 0 .45 3.999 2.749 2.749 0 0 0 1.935 1.946C5.845 18.5 12 18.5 12 18.5s6.155 0 7.865-.555a2.749 2.749 0 0 0 1.935-1.946A28.6 28.6 0 0 0 22.25 12a28.6 28.6 0 0 0-.45-3.999zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                  </svg>
                </a>
                {/* Bandcamp */}
                <a
                  href={SOCIAL_LINKS.bandcamp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bandcamp"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-500 transition-colors hover:bg-blush-200 hover:text-blush-600"
                >
                  <BandcampIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Decorative doodles */}
          <ScrollReveal direction="right" delay={0.2}>
            <div className="relative flex items-center justify-center gap-6 py-4">
              <FloatingDoodle intensity={4} duration={6}>
                <Butterfly className="h-7 w-8 opacity-40" />
              </FloatingDoodle>
              <FloatingDoodle intensity={5} duration={5}>
                <Star className="h-4 w-4 opacity-30" variant="filled" />
              </FloatingDoodle>
              <FloatingDoodle intensity={3} duration={7}>
                <MusicNote className="h-5 w-4 opacity-40" />
              </FloatingDoodle>
            </div>
          </ScrollReveal>
        </div>

        {/* ─── Right column: form ─── */}
        <div className="order-1 md:order-2 md:col-span-3">
          <ScrollReveal delay={0.15}>
            <NotebookLines
              className="rounded-lg bg-paper-warm p-6 shadow-sm md:p-8"
              showMargin
            >
              <ContactForm />
            </NotebookLines>
          </ScrollReveal>
        </div>
      </div>

      {/* ── Bottom floating doodles ── */}
      <div className="mx-auto mt-14 flex max-w-5xl items-center justify-center gap-8">
        <FloatingDoodle intensity={4} duration={6}>
          <Guitar className="h-10 w-4 opacity-30" />
        </FloatingDoodle>
        <FloatingDoodle intensity={5} duration={5}>
          <Daisy className="h-6 w-6 opacity-40" />
        </FloatingDoodle>
        <FloatingDoodle intensity={3} duration={7}>
          <MusicNote className="h-5 w-4 opacity-35" />
        </FloatingDoodle>
        <FloatingDoodle intensity={4} duration={8}>
          <Butterfly className="h-6 w-7 opacity-30" />
        </FloatingDoodle>
      </div>
    </main>
  );
}
