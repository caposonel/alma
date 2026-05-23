import { notFound } from "next/navigation";
import {
  getUpcomingShowsAdmin,
  getPastShowsAdmin,
} from "@/lib/admin-store";
import { FormHeader } from "../../_components";
import { ShowForm } from "../ShowForm";
import { updateShow, deleteShow } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditShowPage({ params }: Props) {
  const { id } = await params;
  const [upcoming, past] = await Promise.all([
    getUpcomingShowsAdmin(),
    getPastShowsAdmin(),
  ]);
  const show = upcoming.find((s) => s.id === id) ?? past.find((s) => s.id === id);
  if (!show) notFound();

  const updateAction = async (formData: FormData): Promise<void> => {
    "use server";
    await updateShow(id, formData);
  };

  const deleteAction = async (): Promise<void> => {
    "use server";
    await deleteShow(id);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title={show.title || show.venue}
        backHref="/admin/shows"
        backLabel="Back to shows"
      />
      <ShowForm
        show={show}
        action={updateAction}
        deleteAction={deleteAction}
      />
    </div>
  );
}
