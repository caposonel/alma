"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Guitar, Butterfly } from "@/components/decorative";
import {
  InstagramIcon,
  SpotifyIcon,
  YoutubeIcon,
} from "@/components/ui/SocialIcons";
import { AudioToggle } from "@/components/ui/AudioToggle";
import { SOCIAL_LINKS } from "@/lib/config";

export function Footer() {
  const t = useTranslations("footer");
  // Calendar year — read inside a `useEffect` so server-side render and
  // initial client paint agree (server may run in UTC, client in IDT; at
  // the Dec 31 / Jan 1 boundary `new Date().getFullYear()` could disagree).
  // We render an empty span on the first paint and fill the year on the
  // client. The flash is invisible to anyone not at the year boundary.
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <footer>
      {/* Decorative footer strip */}
      <div className="relative overflow-hidden border-t border-blush-100/50 bg-paper px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Guitar className="h-10 w-4 opacity-60" />
          <p className="font-display text-xl text-ink md:text-2xl">
            {t("tagline")}
          </p>
          <Butterfly className="h-6 w-7 opacity-60" />
        </div>

        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-ink-soft">
              {t("copyright")}
              {year !== null && ` ${year}`}
            </p>
            <AudioToggle />
          </div>
          <div className="flex items-center gap-4">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.spotify}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Spotify"
              className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
            >
              <SpotifyIcon className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
            >
              <YoutubeIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
