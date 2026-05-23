import { getSettingsAdmin } from "@/lib/admin-store";
import { SOCIAL_LINKS } from "@/lib/config";
import {
  adminInputStyle,
  adminLabelStyle,
  FieldRow,
  PrimaryButton,
} from "../_components";
import { saveSettings } from "./actions";

export default async function AdminSettingsPage() {
  const settings = await getSettingsAdmin();
  const heroLines = settings?.heroDescription ?? [];
  // Pre-fill with the live default (Bandcamp) when Alma hasn't overridden it,
  // so the field is never empty and accidentally saves an empty string.
  const storeUrl = settings?.storeUrl ?? SOCIAL_LINKS.bandcamp;

  return (
    <div style={{ maxWidth: 720 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Site settings
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#5A4F4A",
            margin: "4px 0 0",
          }}
        >
          Hero text on the home page and other small bits of site copy.
        </p>
      </header>

      <form action={saveSettings}>
        <FieldRow>
          <span style={adminLabelStyle}>Hero description (3 lines)</span>
          <input
            name="heroLine1"
            type="text"
            defaultValue={heroLines[0] ?? ""}
            placeholder="Line 1"
            style={{ ...adminInputStyle, marginBottom: 8 }}
          />
          <input
            name="heroLine2"
            type="text"
            defaultValue={heroLines[1] ?? ""}
            placeholder="Line 2"
            style={{ ...adminInputStyle, marginBottom: 8 }}
          />
          <input
            name="heroLine3"
            type="text"
            defaultValue={heroLines[2] ?? ""}
            placeholder="Line 3"
            style={adminInputStyle}
          />
        </FieldRow>

        <FieldRow>
          <label htmlFor="storeUrl" style={adminLabelStyle}>
            Store URL (the "Store" nav link)
          </label>
          <input
            id="storeUrl"
            name="storeUrl"
            type="url"
            defaultValue={storeUrl}
            placeholder="https://almagov.bandcamp.com"
            style={adminInputStyle}
            required
          />
          <p
            style={{
              fontSize: 12,
              color: "#7A6F69",
              margin: "6px 0 0",
            }}
          >
            Must start with <code>https://</code>. Defaults to{" "}
            <code>{SOCIAL_LINKS.bandcamp}</code> if cleared.
          </p>
        </FieldRow>

        <PrimaryButton>Save settings</PrimaryButton>
      </form>
    </div>
  );
}
