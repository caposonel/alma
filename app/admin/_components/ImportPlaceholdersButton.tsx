"use client";

import { useState, useTransition } from "react";
import type { ImportResult } from "../_actions/import-placeholders";

/**
 * Single-button "import placeholder content into admin" trigger used on
 * each admin section's list page (Diary, Shows, Photos, About).
 *
 * Why this exists: when admin is empty for a section, the public page
 * renders from a hardcoded constants array — and the inline `<Editable*>`
 * wrappers can't attach to constants. Importing seeds the admin store
 * with rows derived from those constants, so every visible item
 * suddenly has an admin id → inline editing lights up on every page.
 *
 * The action is conservative: it refuses to import when the target
 * section already has data. The button surfaces that as an inline
 * message so admins know whether they need to clear first.
 */
export function ImportPlaceholdersButton({
  action,
  sectionLabel,
}: {
  action: () => Promise<ImportResult>;
  sectionLabel: string;
}) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div
      style={{
        margin: "8px 0 24px",
        padding: 12,
        background: "#FFF8EC",
        border: "1px solid #F0DCAA",
        borderRadius: 6,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
      }}
    >
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const r = await action();
            setResult(r);
          });
        }}
        style={{
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          border: "1px solid #A07820",
          borderRadius: 4,
          background: isPending ? "#E5D7C8" : "#FFD7A8",
          color: "#3A2A0A",
          cursor: isPending ? "default" : "pointer",
        }}
      >
        {isPending ? "Importing…" : `✦ Import ${sectionLabel} placeholders`}
      </button>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "#5A4F4A",
          lineHeight: 1.4,
        }}
      >
        Seeds the {sectionLabel.toLowerCase()} admin store with rows derived
        from the hardcoded placeholder content that the public page
        currently falls back to. Once imported, every row becomes
        inline-editable from the live preview.
      </p>
      {result && (
        <p
          role="status"
          style={{
            margin: 0,
            padding: "6px 10px",
            fontSize: 12,
            borderRadius: 4,
            width: "100%",
            background: result.ok ? "#DDF4DC" : "#FBEAEA",
            color: result.ok ? "#234C20" : "#7A2424",
          }}
        >
          {result.ok
            ? `Imported ${result.imported} row${result.imported === 1 ? "" : "s"} — refresh the public page to see them.`
            : result.message}
        </p>
      )}
    </div>
  );
}
