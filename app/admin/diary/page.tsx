import { getDiaryEntries } from "@/lib/admin-store";
import { EmptyState, ListRow, PageHeader } from "../_components";

export default async function AdminDiaryListPage() {
  const entries = await getDiaryEntries();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader title="Diary" newHref="/admin/diary/new" newLabel="New entry" />
      {sorted.length === 0 ? (
        <EmptyState message="No diary entries yet. Create your first one." />
      ) : (
        <div>
          {sorted.map((entry) => (
            <ListRow
              key={entry.id}
              href={`/admin/diary/${entry.id}`}
              title={entry.title || "(untitled)"}
              meta={entry.date}
            />
          ))}
        </div>
      )}
    </div>
  );
}
