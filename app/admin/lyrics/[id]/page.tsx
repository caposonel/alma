import { notFound } from "next/navigation";
import { getAdminLyrics } from "@/lib/admin-store";
import { FormHeader } from "../../_components";
import { LyricForm } from "../LyricForm";
import { updateLyric, deleteLyric } from "../actions";

interface Props {
  // `[id]` here is the lyric slug — slugs are the natural unique key for
  // lyrics (they also drive the public URL).
  params: Promise<{ id: string }>;
}

export default async function EditLyricPage({ params }: Props) {
  const { id } = await params;
  const slug = decodeURIComponent(id);
  const lyrics = await getAdminLyrics();
  const lyric = lyrics.find((l) => l.slug === slug);
  if (!lyric) notFound();

  const updateAction = async (formData: FormData): Promise<void> => {
    "use server";
    await updateLyric(slug, formData);
  };

  const deleteAction = async (): Promise<void> => {
    "use server";
    await deleteLyric(slug);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title={lyric.titleHe || "Lyric"}
        backHref="/admin/lyrics"
        backLabel="Back to lyrics"
      />
      <LyricForm
        lyric={lyric}
        action={updateAction}
        deleteAction={deleteAction}
        slugLocked
      />
    </div>
  );
}
