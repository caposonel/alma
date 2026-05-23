import { FormHeader } from "../../_components";
import { ReleaseForm } from "../ReleaseForm";
import { createRelease } from "../actions";

export default function NewReleasePage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title="New release"
        backHref="/admin/releases"
        backLabel="Back to releases"
      />
      <ReleaseForm action={createRelease} />
    </div>
  );
}
