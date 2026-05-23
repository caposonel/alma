import { FormHeader } from "../../_components";
import { VideoForm } from "../VideoForm";
import { createVideo } from "../actions";

export default function NewVideoPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title="New video"
        backHref="/admin/videos"
        backLabel="Back to videos"
      />
      <VideoForm action={createVideo} />
    </div>
  );
}
