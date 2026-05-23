"use client";

import { useState } from "react";
import { adminInputStyle, adminLabelStyle } from "../_components";
import { FileUpload } from "../_FileUpload";
import type { AdminPhoto } from "@/lib/admin-store";

interface RowState extends AdminPhoto {
  /**
   * Stable per-row React key. Required because:
   * - On a remove, list indices shift, so `index` is unstable.
   * - On add/save round-trips, new rows may not yet have an `id`, so we can't
   *   key on that either.
   * - `FileUpload` and the other inputs hold internal/controlled state that
   *   needs to stick with its row when neighbours are removed.
   */
  _key: string;
}

interface Props {
  initial: AdminPhoto[];
}

function makeKey(): string {
  return `row-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/**
 * Inline editor for the photo gallery. Renders one row per photo with an
 * image upload widget + alt / category inputs. Rows can be added or removed
 * locally; the form submits all rows at once to `savePhotos`.
 *
 * Hidden `ids[]` inputs preserve existing photo IDs across save.
 *
 * Empty rows (no src, no alt, no category) are dropped on save server-side.
 */
export function PhotoRows({ initial }: Props) {
  const [rows, setRows] = useState<RowState[]>(() =>
    initial.length > 0
      ? initial.map((p) => ({ ...p, _key: makeKey() }))
      : [{ id: "", src: "", alt: "", category: "", _key: makeKey() }]
  );

  function updateRow(idx: number, patch: Partial<AdminPhoto>) {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: "",
        src: "",
        alt: "",
        category: prev.at(-1)?.category ?? "",
        _key: makeKey(),
      },
    ]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {rows.map((row, idx) => (
        <div
          key={row._key}
          style={{
            background: "white",
            border: "1px solid #F0E4D3",
            borderRadius: 6,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <input type="hidden" name="ids" value={row.id} />

          <div style={{ marginBottom: 12 }}>
            <FileUpload
              name="src"
              defaultValue={row.src}
              label="Image"
              urlPlaceholder="/images/gallery-x.jpg"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <label>
              <span style={adminLabelStyle}>Category</span>
              <input
                name="category"
                type="text"
                value={row.category}
                onChange={(e) => updateRow(idx, { category: e.target.value })}
                placeholder="הופעות / מאחורי הקלעים / חיים"
                style={adminInputStyle}
              />
            </label>
            <label>
              <span style={adminLabelStyle}>Alt text / caption</span>
              <input
                name="alt"
                type="text"
                value={row.alt}
                onChange={(e) => updateRow(idx, { alt: e.target.value })}
                style={adminInputStyle}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <button
              type="button"
              onClick={() => removeRow(idx)}
              style={{
                background: "transparent",
                border: 0,
                color: "#B85959",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        style={{
          padding: "8px 16px",
          background: "transparent",
          border: "1px dashed #E5A0A0",
          borderRadius: 4,
          color: "#B85959",
          fontSize: 13,
          cursor: "pointer",
          marginTop: 8,
        }}
      >
        + Add another photo
      </button>
    </div>
  );
}
