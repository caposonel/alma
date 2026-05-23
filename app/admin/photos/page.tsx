import { getPhotosAdmin } from "@/lib/admin-store";
import { PrimaryButton } from "../_components";
import { ImportPlaceholdersButton } from "../_components/ImportPlaceholdersButton";
import { importPhotosPlaceholders } from "../_actions/import-placeholders";
import { PhotoRows } from "./PhotoRows";
import { savePhotos } from "./actions";

export default async function AdminPhotosPage() {
  const photos = await getPhotosAdmin();

  return (
    <div>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Photos</h1>
        <p
          style={{
            fontSize: 13,
            color: "#5A4F4A",
            margin: "4px 0 0",
          }}
        >
          Each photo references a file under <code>/public/images/</code>.
          Upload files to the server / Vercel project separately; this editor
          only manages the metadata.
        </p>
      </header>

      {photos.length === 0 && (
        <ImportPlaceholdersButton
          action={importPhotosPlaceholders}
          sectionLabel="photos"
        />
      )}

      <form action={savePhotos}>
        <PhotoRows initial={photos} />
        <div style={{ marginTop: 24 }}>
          <PrimaryButton>Save photos</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
