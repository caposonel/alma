import {
  adminInputStyle,
  adminLabelStyle,
  adminTextareaStyle,
  DangerButton,
  FieldRow,
  PrimaryButton,
} from "../_components";
import { FileUpload } from "../_FileUpload";
import { RichTextEditor } from "../_RichTextEditor";
import type { AdminDiaryEntry } from "@/lib/admin-store";

interface Props {
  entry?: AdminDiaryEntry;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
}

/**
 * Shared diary entry editor form. Used by both `/admin/diary/new` and
 * `/admin/diary/[id]`. The delete button is only rendered when a
 * `deleteAction` is provided (i.e. on edit).
 */
export function DiaryForm({ entry, action, deleteAction }: Props) {
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
            defaultValue={entry?.title ?? ""}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>
            Slug (URL fragment — leave empty to auto-generate)
          </span>
          <input
            name="slug"
            type="text"
            defaultValue={entry?.slug ?? ""}
            placeholder="my-entry"
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Date</span>
          <input
            name="date"
            type="date"
            required
            defaultValue={entry?.date ?? todayIso}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Excerpt (short preview text)</span>
          <textarea
            name="excerpt"
            defaultValue={entry?.excerpt ?? ""}
            style={{ ...adminTextareaStyle, minHeight: 80 }}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <span style={adminLabelStyle}>Body</span>
        <RichTextEditor
          name="body"
          defaultValue={entry?.body ?? ""}
          placeholder="Write the diary entry…"
        />
      </FieldRow>

      <FieldRow>
        <FileUpload
          name="coverImage"
          defaultValue={entry?.coverImage ?? ""}
          label="Cover image"
          urlPlaceholder="/images/diary-placeholder.jpg"
        />
      </FieldRow>

      <FieldRow>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            name="featured"
            type="checkbox"
            defaultChecked={!!entry?.featured}
          />
          <span style={{ fontSize: 14 }}>
            Featured (highlight on diary index)
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
