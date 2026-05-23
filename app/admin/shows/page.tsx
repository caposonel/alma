import {
  getUpcomingShowsAdmin,
  getPastShowsAdmin,
  type AdminShow,
} from "@/lib/admin-store";
import { EmptyState, ListRow, PageHeader } from "../_components";
import { ImportPlaceholdersButton } from "../_components/ImportPlaceholdersButton";
import { importShowsPlaceholders } from "../_actions/import-placeholders";

function showMeta(show: AdminShow): string {
  const parts = [show.date, show.city, show.venue];
  if (show.status === "sold-out") parts.push("(sold out)");
  return parts.filter(Boolean).join(" · ");
}

export default async function AdminShowsListPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingShowsAdmin(),
    getPastShowsAdmin(),
  ]);
  const sortedUpcoming = [...upcoming].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const sortedPast = [...past].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader title="Shows" newHref="/admin/shows/new" newLabel="New show" />

      {upcoming.length === 0 && past.length === 0 && (
        <ImportPlaceholdersButton
          action={importShowsPlaceholders}
          sectionLabel="shows"
        />
      )}

      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#5A4F4A",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginBottom: 12,
          }}
        >
          Upcoming
        </h2>
        {sortedUpcoming.length === 0 ? (
          <EmptyState message="No upcoming shows." />
        ) : (
          sortedUpcoming.map((show) => (
            <ListRow
              key={show.id}
              href={`/admin/shows/${show.id}`}
              title={show.title || show.venue}
              meta={showMeta(show)}
            />
          ))
        )}
      </section>

      <section>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#5A4F4A",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginBottom: 12,
          }}
        >
          Past
        </h2>
        {sortedPast.length === 0 ? (
          <EmptyState message="No past shows." />
        ) : (
          sortedPast.map((show) => (
            <ListRow
              key={show.id}
              href={`/admin/shows/${show.id}`}
              title={show.title || show.venue}
              meta={showMeta(show)}
            />
          ))
        )}
      </section>
    </div>
  );
}
