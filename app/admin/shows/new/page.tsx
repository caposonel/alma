import { FormHeader } from "../../_components";
import { ShowForm } from "../ShowForm";
import { createShow } from "../actions";

export default function NewShowPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title="New show"
        backHref="/admin/shows"
        backLabel="Back to shows"
      />
      <ShowForm action={createShow} />
    </div>
  );
}
