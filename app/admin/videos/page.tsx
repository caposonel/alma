import Link from "next/link";
import { getAdminVideos, type AdminVideo } from "@/lib/admin-store";
import { EmptyState, PageHeader } from "../_components";

const CATEGORY_LABEL: Record<AdminVideo["category"], string> = {
  official: "Official",
  live: "Live",
  session: "Session",
  "behind-scenes": "Behind the scenes",
  interview: "Interview",
  other: "Other",
};

function videoMeta(video: AdminVideo): string {
  const parts: string[] = [CATEGORY_LABEL[video.category]];
  if (video.releaseDate) parts.push(video.releaseDate);
  parts.push(video.youtubeId);
  return parts.join(" · ");
}

export default async function AdminVideosListPage() {
  const videos = await getAdminVideos();
  const sorted = [...videos].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const aDate = a.releaseDate ?? "";
    const bDate = b.releaseDate ?? "";
    return bDate.localeCompare(aDate);
  });

  return (
    <div>
      <PageHeader
        title="Videos"
        newHref="/admin/videos/new"
        newLabel="New video"
      />
      {sorted.length === 0 ? (
        <EmptyState message="No videos yet. Add the first one to replace the static fallback." />
      ) : (
        <div>
          {sorted.map((video) => (
            <Link
              key={video.id}
              href={`/admin/videos/${video.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "white",
                border: "1px solid #F0E4D3",
                borderRadius: 4,
                textDecoration: "none",
                color: "inherit",
                marginBottom: 8,
                gap: 12,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 500,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {video.title || "(untitled)"}
                </span>
                {video.featured && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#B85959",
                      color: "white",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    Featured
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#5A4F4A",
                  flexShrink: 0,
                }}
              >
                {videoMeta(video)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
