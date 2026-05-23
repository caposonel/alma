"use client";

import { useState } from "react";
import { exportSubscribersCsv } from "./actions";

/**
 * Client-side trigger that calls the server action to build the CSV, then
 * downloads it as a file. Kept out of the page component so the page itself
 * can stay a server component.
 */
export function ExportButton() {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const csv = await exportSubscribersCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `alma-subscribers-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
      alert("Export failed. Check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      style={{
        padding: "8px 14px",
        background: "transparent",
        color: "#5A4F4A",
        border: "1px solid #E5D7C8",
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 500,
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? "Exporting…" : "Export CSV"}
    </button>
  );
}
