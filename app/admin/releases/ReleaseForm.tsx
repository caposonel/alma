import {
  adminInputStyle,
  adminLabelStyle,
  DangerButton,
  FieldRow,
  PrimaryButton,
} from "../_components";
import type { AdminRelease } from "@/lib/admin-store";

interface Props {
  release?: AdminRelease;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
}

const TYPE_OPTIONS: { value: AdminRelease["type"]; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "ep", label: "EP" },
  { value: "album", label: "Album" },
];

export function ReleaseForm({ release, action, deleteAction }: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    <form action={action}>
      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Title</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={release?.title ?? ""}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Type</span>
          <select
            name="type"
            defaultValue={release?.type ?? "single"}
            style={adminInputStyle}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Release date</span>
          <input
            name="releaseDate"
            type="date"
            required
            defaultValue={release?.releaseDate ?? todayIso}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>
            Spotify album ID (just the ID — used for the embed)
          </span>
          <input
            name="spotifyAlbumId"
            type="text"
            defaultValue={release?.spotifyAlbumId ?? ""}
            placeholder="e.g. 7HuPg1bhEr2eGUjvBKb8K9"
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Spotify URL</span>
          <input
            name="spotifyUrl"
            type="url"
            defaultValue={release?.spotifyUrl ?? ""}
            placeholder="https://open.spotify.com/album/..."
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Apple Music URL</span>
          <input
            name="appleMusicUrl"
            type="url"
            defaultValue={release?.appleMusicUrl ?? ""}
            placeholder="https://music.apple.com/..."
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>YouTube URL</span>
          <input
            name="youtubeUrl"
            type="url"
            defaultValue={release?.youtubeUrl ?? ""}
            placeholder="https://www.youtube.com/..."
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Bandcamp URL</span>
          <input
            name="bandcampUrl"
            type="url"
            defaultValue={release?.bandcampUrl ?? ""}
            placeholder="https://almagov.bandcamp.com/..."
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #F0E4D3",
        }}
      >
        <PrimaryButton>Save</PrimaryButton>
        {deleteAction && (
          <DangerButton formAction={deleteAction}>Delete</DangerButton>
        )}
      </div>
    </form>
  );
}
