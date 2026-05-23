import Link from "next/link";
import {
  getDiaryEntries,
  getAllShowsAdmin,
  getReleasesAdmin,
  getPhotosAdmin,
  getAdminVideos,
  getAdminLyrics,
  getAbout,
  getMessages,
  getSubscribers,
} from "@/lib/admin-store";

/**
 * Admin dashboard — landing page after sign-in. Shows the current count for
 * each content type plus a card linking to the editor.
 */
export default async function AdminDashboardPage() {
  const [
    diary,
    shows,
    releases,
    photos,
    videos,
    lyrics,
    about,
    messages,
    subscribers,
  ] = await Promise.all([
    getDiaryEntries(),
    getAllShowsAdmin(),
    getReleasesAdmin(),
    getPhotosAdmin(),
    getAdminVideos(),
    getAdminLyrics(),
    getAbout(),
    getMessages(),
    getSubscribers(),
  ]);

  const unreadMessages = messages.filter((m) => !m.read).length;

  const aboutSections = about
    ? about.bioParagraphs.length +
      about.funFacts.length +
      about.milestones.length +
      about.influences.length +
      about.pressQuotes.length
    : 0;

  const sections: {
    label: string;
    count: number | null;
    href: string;
    blurb: string;
    badge?: number;
  }[] = [
    {
      label: "Messages",
      count: messages.length,
      href: "/admin/messages",
      blurb: "Contact form submissions.",
      badge: unreadMessages,
    },
    {
      label: "Subscribers",
      count: subscribers.length,
      href: "/admin/subscribers",
      blurb: "Newsletter signups from the mailing bar.",
    },
    {
      label: "Diary entries",
      count: diary.length,
      href: "/admin/diary",
      blurb: "Letters, songs, and stories.",
    },
    {
      label: "Shows",
      count: shows.length,
      href: "/admin/shows",
      blurb: "Upcoming and past performances.",
    },
    {
      label: "Releases",
      count: releases.length,
      href: "/admin/releases",
      blurb: "Albums, EPs, and singles.",
    },
    {
      label: "Photos",
      count: photos.length,
      href: "/admin/photos",
      blurb: "Gallery photos.",
    },
    {
      label: "Videos",
      count: videos.length,
      href: "/admin/videos",
      blurb: "YouTube clips on the gallery page.",
    },
    {
      label: "Lyrics",
      count: lyrics.length,
      href: "/admin/lyrics",
      blurb: "Song lyrics on the /lyrics pages.",
    },
    {
      label: "About page",
      count: aboutSections,
      href: "/admin/about",
      blurb: "Bio, fun facts, milestones, influences, press quotes.",
    },
    {
      label: "Site settings",
      count: null,
      href: "/admin/settings",
      blurb: "Hero text and other one-offs.",
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
        Welcome back, Alma.
      </h1>
      <p style={{ color: "#5A4F4A", marginBottom: 32 }}>
        What would you like to edit today?
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              display: "block",
              padding: 20,
              background: "white",
              border: "1px solid #F0E4D3",
              borderRadius: 8,
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
                gap: 8,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {s.label}
                {s.badge !== undefined && s.badge > 0 && (
                  <span
                    aria-label={`${s.badge} unread`}
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#B85959",
                    }}
                  />
                )}
              </h2>
              {s.count !== null && (
                <span
                  style={{
                    fontSize: 12,
                    background: "#F5EBE0",
                    padding: "2px 8px",
                    borderRadius: 999,
                    color: "#5A4F4A",
                  }}
                >
                  {s.count}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "#5A4F4A", margin: 0 }}>
              {s.blurb}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
