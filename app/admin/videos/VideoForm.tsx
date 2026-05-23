import {
  adminInputStyle,
  adminLabelStyle,
  adminTextareaStyle,
  DangerButton,
  FieldRow,
  PrimaryButton,
} from "../_components";
import type { AdminVideo } from "@/lib/admin-store";

interface Props {
  video?: AdminVideo;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
}

const CATEGORY_OPTIONS: { value: AdminVideo["category"]; label: string }[] = [
  { value: "official", label: "Official (music video)" },
  { value: "live", label: "Live performance" },
  { value: "session", label: "Session / acoustic" },
  { value: "behind-scenes", label: "Behind the scenes" },
  { value: "interview", label: "Interview" },
  { value: "other", label: "Other" },
];

export function VideoForm({ video, action, deleteAction }: Props) {
  return (
    <form action={action}>
      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Title</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={video?.title ?? ""}
            dir="auto"
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Description (optional)</span>
          <textarea
            name="description"
            defaultValue={video?.description ?? ""}
            dir="auto"
            style={{ ...adminTextareaStyle, minHeight: 80 }}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>YouTube ID</span>
          <input
            name="youtubeId"
            type="text"
            required
            defaultValue={video?.youtubeId ?? ""}
            placeholder="dQw4w9WgXcQ"
            style={adminInputStyle}
          />
          <small
            style={{
              display: "block",
              marginTop: 4,
              fontSize: 11,
              color: "#5A4F4A",
            }}
          >
            The 11-char ID from the YouTube URL (e.g. <code>?v=</code> part).
          </small>
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Category</span>
          <select
            name="category"
            defaultValue={video?.category ?? "official"}
            style={adminInputStyle}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Release date (optional)</span>
          <input
            name="releaseDate"
            type="date"
            defaultValue={video?.releaseDate ?? ""}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            name="featured"
            type="checkbox"
            defaultChecked={!!video?.featured}
          />
          <span style={{ fontSize: 14 }}>
            Featured (shown as the hero video on the gallery page)
          </span>
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
