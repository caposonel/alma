import { getReleasesAdmin } from "@/lib/admin-store";
import { EmptyState, ListRow, PageHeader } from "../_components";

const TYPE_LABEL: Record<string, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
};

export default async function AdminReleasesListPage() {
  const releases = await getReleasesAdmin();
  const sorted = [...releases].sort((a, b) =>
    b.releaseDate.localeCompare(a.releaseDate)
  );

  return (
    <div>
      <PageHeader
        title="Releases"
        newHref="/admin/releases/new"
        newLabel="New release"
      />
      {sorted.length === 0 ? (
        <EmptyState message="No releases yet." />
      ) : (
        sorted.map((release) => (
          <ListRow
            key={release.id}
            href={`/admin/releases/${release.id}`}
            title={release.title}
            meta={`${TYPE_LABEL[release.type] ?? release.type} · ${release.releaseDate}`}
          />
        ))
      )}
    </div>
  );
}
