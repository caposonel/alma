import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TicketStub } from "@/components/ui";
import { Star } from "@/components/decorative";
import { ScrollReveal } from "@/components/motion";

interface ShowsCardProps {
  shows: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    ticketUrl?: string;
  }>;
}

function formatDayMonth(dateStr: string): string {
  // Parse the YYYY-MM-DD string DIRECTLY instead of `new Date(dateStr)`.
  // The Date constructor parses YYYY-MM-DD as UTC midnight, then `.getDate()`
  // / `.getMonth()` apply the server's local timezone (Vercel runs in UTC,
  // the site is Israeli) — for a show stored as "2026-06-12" the server
  // returns "12" but an Israeli client in IDT (UTC+3) right at the
  // boundary could see "11", showing the wrong calendar day on the card.
  // Splitting on "-" sidesteps the timezone entirely.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return dateStr;
  const [, , month, day] = match;
  return `${day}.${month}`;
}

export async function ShowsCard({ shows }: ShowsCardProps) {
  const t = await getTranslations("homepage.shows");
  const top3 = shows.slice(0, 3);

  return (
    <ScrollReveal direction="left" className="flex-1">
      {/* Padding + every text size steps up at lg to match the
          enlarged hero composition above; the original sizes felt
          undersized next to the big portrait polaroid. */}
      <TicketStub className="p-6 md:p-8 lg:p-10">
        <h2 className="mb-6 flex items-center justify-center gap-2 font-display text-2xl text-ink md:text-3xl lg:text-4xl lg:mb-8">
          <Star className="h-5 w-5 lg:h-6 lg:w-6" />
          {t("title")}
          <Star className="h-5 w-5 lg:h-6 lg:w-6" variant="filled" />
        </h2>

        <div className="space-y-4 lg:space-y-6">
          {top3.length === 0 ? (
            <p className="text-center text-sm text-ink-soft md:text-base">
              {t("noUpcoming")}
            </p>
          ) : (
            top3.map((show) => (
              <div key={show.id} className="flex flex-col gap-1.5 lg:gap-2">
                <div className="flex items-baseline justify-between gap-3 lg:gap-5">
                  <div className="flex-1 text-sm md:text-base lg:text-lg">
                    <span className="font-semibold text-ink">{show.city}</span>
                    <span className="mx-1 text-ink-soft/40">,</span>
                    <span className="text-ink-soft">{show.venue}</span>
                  </div>
                  <div
                    className="flex-shrink-0 font-display text-2xl tabular-nums text-ink md:text-3xl lg:text-4xl"
                    style={{ letterSpacing: "0.02em" }}
                  >
                    {formatDayMonth(show.date)}
                  </div>
                </div>
                {show.ticketUrl ? (
                  <a
                    href={show.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blush-600 transition-colors hover:text-blush-700 md:text-base lg:text-lg"
                  >
                    {t("details")}
                  </a>
                ) : (
                  <span className="text-sm text-ink-soft/60 md:text-base lg:text-lg">{t("comingSoon")}</span>
                )}
                <div className="mt-1 border-b border-dashed border-blush-200/50" />
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-center lg:mt-8">
          <Link
            href="/shows"
            className="inline-flex items-center gap-1 text-sm font-medium text-blush-600 transition-colors hover:text-blush-700 md:text-base lg:text-lg"
          >
            {t("allShows")}
          </Link>
        </div>
      </TicketStub>
    </ScrollReveal>
  );
}
