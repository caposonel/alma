import Link from "next/link";
import { getAdminLyrics } from "@/lib/admin-store";
import { EmptyState, ListRow, PageHeader } from "../_components";

export default async function AdminLyricsListPage() {
  const lyrics = await getAdminLyrics();
  const sorted = [...lyrics].sort((a, b) => {
    const aDate = a.releaseDate ?? "";
    const bDate = b.releaseDate ?? "";
    if (aDate && bDate) return bDate.localeCompare(aDate);
    return a.titleHe.localeCompare(b.titleHe);
  });

  return (
    <div>
      <PageHeader
        title="Lyrics"
        newHref="/admin/lyrics/new"
        newLabel="New lyric"
      />
      {/* Bulk-edit shortcut — for populating lyrics across many tracks in
          one session instead of clicking through 32 separate edit pages. */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/admin/lyrics/bulk"
          style={{
            display: "inline-block",
            padding: "6px 12px",
            border: "1px solid #888",
            borderRadius: 4,
            background: "#fff",
            color: "#000",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✎ Bulk edit all lyrics
        </Link>
        <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
          Edit every track on one page — fastest way to populate the catalog.
        </span>
      </div>
      {sorted.length === 0 ? (
        <EmptyState message="No lyrics yet. Add the first track to replace the static fallback." />
      ) : (
        <div>
          {sorted.map((lyric) => {
            const metaParts: string[] = [];
            if (lyric.releaseTitle) metaParts.push(lyric.releaseTitle);
            if (lyric.releaseDate) metaParts.push(lyric.releaseDate);
            metaParts.push(`/${lyric.slug}`);
            return (
              <ListRow
                key={lyric.slug}
                href={`/admin/lyrics/${encodeURIComponent(lyric.slug)}`}
                title={lyric.titleHe || "(ללא כותרת)"}
                meta={metaParts.join(" · ")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
