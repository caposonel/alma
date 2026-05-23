import { FormHeader } from "../../_components";
import { LyricForm } from "../LyricForm";
import { createLyric } from "../actions";

export default function NewLyricPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title="New lyric"
        backHref="/admin/lyrics"
        backLabel="Back to lyrics"
      />
      <LyricForm action={createLyric} />
    </div>
  );
}
