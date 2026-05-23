import { getDiaryEntries } from "@/lib/admin-store";
import { EmptyState, ListRow, PageHeader } from "../_components";
import { ImportPlaceholdersButton } from "../_components/ImportPlaceholdersButton";
import { importDiaryPlaceholders } from "../_actions/import-placeholders";

export default async function AdminDiaryListPage() {
  const entries = await getDiaryEntries();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader title="Diary" newHref="/admin/diary/new" newLabel="New entry" />
      {entries.length === 0 && (
        <ImportPlaceholdersButton
          action={importDiaryPlaceholders}
          sectionLabel="diary"
        />
      )}
      {sorted.length === 0 ? (
        <EmptyState message="No diary entries yet. Create your first one — or use the import button above to seed from the hardcoded placeholders." />
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
