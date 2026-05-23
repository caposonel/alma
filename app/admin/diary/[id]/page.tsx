import { notFound } from "next/navigation";
import { getDiaryEntries } from "@/lib/admin-store";
import { FormHeader } from "../../_components";
import { DiaryForm } from "../DiaryForm";
import { updateDiaryEntry, deleteDiaryEntry } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDiaryEntryPage({ params }: Props) {
  const { id } = await params;
  const entries = await getDiaryEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) notFound();

  const updateAction = async (formData: FormData): Promise<void> => {
    "use server";
    await updateDiaryEntry(id, formData);
  };

  const deleteAction = async (): Promise<void> => {
    "use server";
    await deleteDiaryEntry(id);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title={entry.title || "Diary entry"}
        backHref="/admin/diary"
        backLabel="Back to diary"
      />
      <DiaryForm
        entry={entry}
        action={updateAction}
        deleteAction={deleteAction}
      />
    </div>
  );
}
