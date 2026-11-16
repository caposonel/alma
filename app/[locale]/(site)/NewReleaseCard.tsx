import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { TicketStub } from "@/components/ui";
import { Star } from "@/components/decorative";
import { ScrollReveal } from "@/components/motion";
import { SpotifyIcon, AppleMusicIcon, YoutubeIcon } from "@/components/ui/SocialIcons";
import { SOCIAL_LINKS } from "@/lib/config";
import type { DiscographyAlbum } from "@/components/ui/AlbumDiscography";

/**
 * Homepage "חדש" card: the newest release (derived from the admin-managed
 * songs, so it updates by itself), with its cover, a play button that opens
 * the music page on that track, and streaming links.
 */
export function NewReleaseCard({ album }: { album: DiscographyAlbum }) {
  const year = album.releaseDate ? album.releaseDate.slice(0, 4) : null;
  const first = album.tracks.find((t) => t.youtubeId) ?? album.tracks[0];
  // `#play=<videoId>` is picked up by MusicPlayerSection on /music.
  const playHref = first?.youtubeId ? `/music#play=${first.youtubeId}` : "/music";
  const spotify =
    album.links?.spotify ??
    (first?.spotifyTrackId
      ? `https://open.spotify.com/track/${first.spotifyTrackId}`
      : SOCIAL_LINKS.spotify);
  const youtube = first?.youtubeId
    ? `https://www.youtube.com/watch?v=${first.youtubeId}`
    : album.links?.youtube ?? SOCIAL_LINKS.youtube;
  const apple = album.links?.appleMusic ?? SOCIAL_LINKS.appleMusic;
  const count = album.tracks.length;

  return (
    <ScrollReveal direction="right" className="flex-1">
      <TicketStub className="p-6 md:p-8 lg:p-10">
        <h2 className="mb-6 flex items-center justify-center gap-2 font-display text-3xl font-bold text-ink md:text-4xl lg:mb-8">
          <Star className="h-5 w-5 lg:h-6 lg:w-6" />
          חדש
          <Star className="h-5 w-5 lg:h-6 lg:w-6" variant="filled" />
        </h2>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="w-40 shrink-0 -rotate-2 rounded-sm bg-white p-2 pb-4 shadow-md sm:w-36 lg:w-44">
            {album.coverUrl ? (
              <Image
                src={album.coverUrl}
                alt={album.releaseTitle}
                width={300}
                height={300}
                unoptimized
                className="aspect-square w-full rounded-[2px] object-cover"
              />
            ) : (
              <div className="aspect-square w-full rounded-[2px] bg-blush-100" aria-hidden="true" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center text-center sm:items-start sm:text-start">
            <p className="font-display text-3xl font-bold leading-tight text-ink lg:text-4xl" dir="auto">
              {album.releaseTitle}
            </p>
            <p className="mt-1 text-sm font-medium text-ink-soft">
              {[year, count > 1 ? `${count} שירים` : "סינגל"].filter(Boolean).join(" · ")}
            </p>

            <Link
              href={playHref}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-blush-600 px-6 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              להאזנה
            </Link>

            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Chip href={spotify} label="Spotify" icon={<SpotifyIcon className="h-4 w-4" />} />
              <Chip href={apple} label="Apple Music" icon={<AppleMusicIcon className="h-4 w-4" />} />
              <Chip href={youtube} label="YouTube" icon={<YoutubeIcon className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </TicketStub>
    </ScrollReveal>
  );
}

function Chip({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-blush-200 bg-paper px-4 text-sm text-ink transition-colors hover:border-blush-400 hover:text-blush-700"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
