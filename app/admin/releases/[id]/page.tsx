import { notFound } from "next/navigation";
import { getReleasesAdmin } from "@/lib/admin-store";
import { FormHeader } from "../../_components";
import { ReleaseForm } from "../ReleaseForm";
import { updateRelease, deleteRelease } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditReleasePage({ params }: Props) {
  const { id } = await params;
  const releases = await getReleasesAdmin();
  const release = releases.find((r) => r.id === id);
  if (!release) notFound();

  const updateAction = async (formData: FormData): Promise<void> => {
    "use server";
    await updateRelease(id, formData);
  };

  const deleteAction = async (): Promise<void> => {
    "use server";
    await deleteRelease(id);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title={release.title}
        backHref="/admin/releases"
        backLabel="Back to releases"
      />
      <ReleaseForm
        release={release}
        action={updateAction}
        deleteAction={deleteAction}
      />
    </div>
  );
}
