import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HandwrittenUnderline, TicketStub } from "@/components/ui";
import { Heart, Star } from "@/components/decorative";
import { ScrollReveal, StaggerGrid, StaggerItem, FloatingDoodle } from "@/components/motion";
import { StructuredData } from "@/components/seo";
import { ShowsMapClient } from "../ShowsMapClient";
import { EditableText, EditableUrl } from "@/components/admin/Editable";
import { patchShowFieldInline } from "@/app/admin/shows/actions";
import { saveContentOverrideInline } from "@/app/admin/settings/actions";
import { getSettingsAdmin } from "@/lib/admin-store";
import { readContentOverride } from "@/lib/content-overrides";
import { getUpcomingShows, getPastShows } from "@/lib/content";
import type { Show } from "@/lib/content";
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

export function generateMetadata(): Metadata {
  const title = "הופעות — עלמה גוב";
  const description = "כל ההופעות הקרובות ושעברו של עלמה גוב — תאריכים, מקומות, וכרטיסים.";
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shows`,
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "website",
      images: [
        {
          url: "/images/gallery-live-crowd.jpg",
          width: 1200,
          height: 630,
          alt: "עלמה גוב — קהל בהופעה חיה",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/gallery-live-crowd.jpg"],
    },
  };
}

interface StaticShow {
  id: string;
  date: string;
  venue: string;
  city: string;
  title?: string;
  status: "upcoming" | "past" | "sold-out";
  ticketUrl?: string;
}

export const STATIC_UPCOMING: StaticShow[] = [
  { id: "u1", date: "2026-06-12", venue: "המועדון של הבארבי", city: "תל אביב", status: "upcoming", ticketUrl: "https://example.com" },
  { id: "u2", date: "2026-07-03", venue: "תיאטרון תמונע", city: "חיפה", status: "upcoming", ticketUrl: "https://example.com" },
  { id: "u3", date: "2026-08-22", venue: "מוסררה", city: "ירושלים", status: "upcoming", ticketUrl: "https://example.com" },
];

export const STATIC_PAST: StaticShow[] = [
  { id: "ps1", date: "2026-05-12", venue: "QUEENTA", city: "ירושלים", status: "past" },
  { id: "ps2", date: "2026-01-29", venue: "תיאטרון גבעתיים", city: "גבעתיים", status: "past" },
  { id: "ps3", date: "2025-11-13", venue: "מופע 360", city: "ירושלים", title: "עקב הביקוש — מופע נוסף", status: "past" },
  { id: "ps4", date: "2025-08-09", venue: "פסטיבל ט״ו באב", city: "הרצליה", status: "past" },
  { id: "ps5", date: "2025-05-22", venue: "גגרין", city: "תל אביב-יפו", title: "השקת אלבום עם אבנר טואג", status: "past" },
  { id: "ps6", date: "2024-12-21", venue: "בארבי", city: "תל אביב-יפו", title: "מופע ״עולם שלי״", status: "past" },
  { id: "ps7", date: "2024-12-12", venue: "אמפי זכרון", city: "זכרון יעקב", status: "past" },
  { id: "ps8", date: "2024-08-17", venue: "בארבי", city: "תל אביב-יפו", title: "חומרים חדשים מהאלבום החדש", status: "past" },
];

/**
 * Build a MusicEvent JSON-LD entry for a single show.
 * Works for both the admin-managed `Show` shape and the `StaticShow`
 * fallback — both expose `date`, `venue`, `city`, `title?`, `ticketUrl?`.
 */
function buildEventSchema(show: {
  date: string;
  venue: string;
  city: string;
  title?: string;
  ticketUrl?: string;
  status?: string;
}) {
  const name = show.title
    ? `Alma Gov — ${show.title} (${show.venue})`
    : `Alma Gov at ${show.venue}`;
  const isPast = show.status === "past";
  const availability =
    show.status === "sold-out"
      ? "https://schema.org/SoldOut"
      : "https://schema.org/InStock";

  const event: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    // Past shows are usually offline; either way, in-person is the right call.
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: show.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: show.city,
        addressCountry: "IL",
      },
    },
    performer: { "@type": "MusicGroup", name: "Alma Gov" },
  };

  if (show.ticketUrl && !isPast) {
    event.offers = {
      "@type": "Offer",
      url: show.ticketUrl,
      availability,
    };
  }

  return event;
}

export default async function ShowsPage() {
  const t = await getTranslations("shows");
  const [upcomingShows, pastShows, settings] = await Promise.all([
    getUpcomingShows({ limit: 10 }).catch(() => []),
    getPastShows().catch(() => []),
    getSettingsAdmin().catch(() => null),
  ]);

  const showsTitle = readContentOverride(settings, "page.shows.title", t("title"));
  const showsSubtitle = readContentOverride(settings, "page.shows.subtitle", t("subtitle"));
  const upcomingHeading = readContentOverride(settings, "page.shows.upcoming", t("upcoming"));

  const upcoming = upcomingShows.length > 0 ? upcomingShows : null;
  const past = pastShows.length > 0 ? pastShows : null;

  /* Build MusicEvent JSON-LD for both upcoming and past shows. */
  const upcomingForSchema = upcoming ?? STATIC_UPCOMING;
  const pastForSchema = past ?? STATIC_PAST;
  const eventSchemas = [
    ...upcomingForSchema.map((s) =>
      buildEventSchema({
        date: s.date,
        venue: s.venue,
        city: s.city,
        title: "title" in s ? s.title : undefined,
        ticketUrl: s.ticketUrl,
        status: "status" in s ? s.status : "upcoming",
      })
    ),
    ...pastForSchema.map((s) =>
      buildEventSchema({
        date: s.date,
        venue: s.venue,
        city: s.city,
        title: "title" in s ? s.title : undefined,
        status: "status" in s ? s.status : "past",
      })
    ),
  ];

  return (
    <main className="px-6 py-12">
      {eventSchemas.length > 0 && <StructuredData data={eventSchemas} />}
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5" />
              <EditableText
                id="override.page.shows.title"
                label="Shows page title"
                value={showsTitle}
                save={saveContentOverrideInline.bind(null, "page.shows.title")}
                hint="Falls back to the translation file if cleared."
                as="div"
              >
                <h1 className="font-display text-4xl text-ink md:text-5xl">
                  <HandwrittenUnderline>{showsTitle}</HandwrittenUnderline>
                </h1>
              </EditableText>
              <Star className="h-5 w-5" variant="filled" />
            </div>
            <EditableText
              id="override.page.shows.subtitle"
              label="Shows page subtitle"
              value={showsSubtitle}
              save={saveContentOverrideInline.bind(null, "page.shows.subtitle")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <p className="mt-4 text-ink-soft">{showsSubtitle}</p>
            </EditableText>
          </div>
        </ScrollReveal>

        {/* Upcoming shows */}
        <section className="mt-10">
          <ScrollReveal>
            <EditableText
              id="override.page.shows.upcoming"
              label="Shows — Upcoming section heading"
              value={upcomingHeading}
              save={saveContentOverrideInline.bind(null, "page.shows.upcoming")}
              hint="Falls back to the translation file if cleared."
              as="div"
            >
              <h2 className="mb-4 text-center font-display text-xl text-blush-500">
                {upcomingHeading}
              </h2>
            </EditableText>
          </ScrollReveal>
          {upcoming || STATIC_UPCOMING.length > 0 ? (
            <StaggerGrid className="space-y-3" staggerDelay={0.08}>
              {(upcoming ?? STATIC_UPCOMING).map((show) => {
                const id = "_id" in show ? show._id : show.id;
                const adminId = "_id" in show ? show._id : null;
                const status =
                  ("status" in show && show.status) ||
                  ("status" in show ? show.status : "upcoming");
                return (
                  <StaggerItem key={id}>
                    <TicketStub className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className="block font-display text-2xl tabular-nums text-ink">
                            {new Date(show.date).toLocaleDateString("he-IL", { day: "2-digit" })}
                          </span>
                          <span className="block text-xs text-ink-soft">
                            {new Date(show.date).toLocaleDateString("he-IL", { month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div>
                          {adminId ? (
                            <EditableText
                              id={`show.${adminId}.venue`}
                              label={`Venue · ${show.venue}`}
                              value={show.venue}
                              save={patchShowFieldInline.bind(null, adminId, "venue")}
                              as="div"
                            >
                              <p className="font-medium text-ink">{show.venue}</p>
                            </EditableText>
                          ) : (
                            <p className="font-medium text-ink">{show.venue}</p>
                          )}
                          {adminId ? (
                            <EditableText
                              id={`show.${adminId}.city`}
                              label={`City · ${show.city}`}
                              value={show.city}
                              save={patchShowFieldInline.bind(null, adminId, "city")}
                              as="div"
                            >
                              <p className="text-sm text-ink-soft">{show.city}</p>
                            </EditableText>
                          ) : (
                            <p className="text-sm text-ink-soft">{show.city}</p>
                          )}
                          {("title" in show && show.title) && (
                            <p className="text-xs text-blush-400 mt-1">{show.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {status === "sold-out" ? (
                          <span className="rounded-full bg-ink-soft/10 px-3 py-1 text-xs text-ink-soft">
                            {t("soldOut")}
                          </span>
                        ) : show.ticketUrl ? (
                          adminId ? (
                            <EditableUrl
                              id={`show.${adminId}.ticketUrl`}
                              label={`Ticket URL · ${show.venue}`}
                              value={show.ticketUrl}
                              save={patchShowFieldInline.bind(null, adminId, "ticketUrl")}
                              hint="https:// link. Empty to clear."
                              as="span"
                            >
                              <a
                                href={show.ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-blush-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blush-700"
                              >
                                {t("tickets")}
                              </a>
                            </EditableUrl>
                          ) : (
                            <a
                              href={show.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-blush-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blush-700"
                            >
                              {t("tickets")}
                            </a>
                          )
                        ) : (
                          <span className="text-xs text-ink-soft/50">{t("comingSoon")}</span>
                        )}
                      </div>
                    </TicketStub>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          ) : (
            <ScrollReveal>
              <TicketStub className="mx-auto max-w-md text-center">
                <FloatingDoodle intensity={4} duration={5}>
                  <Heart className="mx-auto mb-3 h-5 w-5 opacity-60" />
                </FloatingDoodle>
                <p className="text-sm text-ink-soft">
                  {t("noUpcoming")}
                </p>
              </TicketStub>
            </ScrollReveal>
          )}
        </section>

        {/* Past shows + interactive map */}
        <section className="mt-16">
          <ShowsMapClient
            shows={
              (past ?? STATIC_PAST).map((s) => ({
                id: "_id" in s ? s._id : s.id,
                date: s.date,
                venue: s.venue,
                city: s.city,
                title: ("title" in s ? s.title : undefined) ?? undefined,
                notes: ("notes" in s ? (s as Show).notes : undefined) ?? undefined,
              }))
            }
          />
        </section>
      </div>
    </main>
  );
}
