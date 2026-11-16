import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getAdminLyrics } from "@/lib/admin-store";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // The site is Hebrew-only — one unprefixed URL per route. The previous
  // implementation also emitted a parallel `/en/...` URL for every entry,
  // but those URLs 404 now that the EN locale was removed from routing,
  // which is actively SEO-harmful (Google would crawl, hit 404s, and
  // downgrade the page's authority).
  function entry(path: string, opts: {
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }): MetadataRoute.Sitemap[number] {
    return {
      url: path === "/" ? baseUrl : `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: opts.changeFrequency,
      priority: opts.priority,
    };
  }

  // Lyrics pages for every admin-managed song that has lyrics. A store
  // outage just omits them rather than failing the whole sitemap.
  const lyrics = await getAdminLyrics().catch(() => []);
  const lyricEntries = lyrics
    .filter((l) => l.slug && l.lyricsHe?.trim())
    .map((l) =>
      entry(`/lyrics/${encodeURIComponent(l.slug)}`, {
        priority: 0.5,
        changeFrequency: "monthly",
      })
    );

  return [
    entry("/", { priority: 1, changeFrequency: "weekly" }),
    entry("/music", { priority: 0.8, changeFrequency: "monthly" }),
    entry("/shows", { priority: 0.7, changeFrequency: "monthly" }),
    entry("/gallery", { priority: 0.7, changeFrequency: "monthly" }),
    entry("/about", { priority: 0.6, changeFrequency: "monthly" }),
    entry("/contact", { priority: 0.5, changeFrequency: "yearly" }),
    entry("/diary", { priority: 0.4, changeFrequency: "weekly" }),
    ...lyricEntries,
  ];
}
