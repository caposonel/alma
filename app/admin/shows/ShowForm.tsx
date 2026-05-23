import {
  adminInputStyle,
  adminLabelStyle,
  adminTextareaStyle,
  DangerButton,
  FieldRow,
  PrimaryButton,
} from "../_components";
import type { AdminShow } from "@/lib/admin-store";

interface Props {
  show?: AdminShow;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
}

const STATUS_OPTIONS: { value: AdminShow["status"]; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "sold-out", label: "Sold out (still upcoming)" },
  { value: "past", label: "Past" },
];

export function ShowForm({ show, action, deleteAction }: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    <form action={action}>
      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Date</span>
          <input
            name="date"
            type="date"
            required
            defaultValue={show?.date ?? todayIso}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Venue</span>
          <input
            name="venue"
            type="text"
            required
            defaultValue={show?.venue ?? ""}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>City</span>
          <input
            name="city"
            type="text"
            required
            defaultValue={show?.city ?? ""}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>
            Title (optional — e.g. album release show)
          </span>
          <input
            name="title"
            type="text"
            defaultValue={show?.title ?? ""}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Status</span>
          <select
            name="status"
            defaultValue={show?.status ?? "upcoming"}
            style={adminInputStyle}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>
            Ticket URL (optional — only for upcoming shows)
          </span>
          <input
            name="ticketUrl"
            type="url"
            defaultValue={show?.ticketUrl ?? ""}
            placeholder="https://..."
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Notes (optional)</span>
          <textarea
            name="notes"
            defaultValue={show?.notes ?? ""}
            style={{ ...adminTextareaStyle, minHeight: 100 }}
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
