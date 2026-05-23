import { FormHeader } from "../../_components";
import { DiaryForm } from "../DiaryForm";
import { createDiaryEntry } from "../actions";

export default function NewDiaryEntryPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title="New diary entry"
        backHref="/admin/diary"
        backLabel="Back to diary"
      />
      <DiaryForm action={createDiaryEntry} />
    </div>
  );
}
