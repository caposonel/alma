import { notFound } from "next/navigation";
import { getAdminVideos } from "@/lib/admin-store";
import { FormHeader } from "../../_components";
import { VideoForm } from "../VideoForm";
import { updateVideo, deleteVideo } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditVideoPage({ params }: Props) {
  const { id } = await params;
  const videos = await getAdminVideos();
  const video = videos.find((v) => v.id === id);
  if (!video) notFound();

  const updateAction = async (formData: FormData): Promise<void> => {
    "use server";
    await updateVideo(id, formData);
  };

  const deleteAction = async (): Promise<void> => {
    "use server";
    await deleteVideo(id);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title={video.title || "Video"}
        backHref="/admin/videos"
        backLabel="Back to videos"
      />
      <VideoForm
        video={video}
        action={updateAction}
        deleteAction={deleteAction}
      />
    </div>
  );
}
