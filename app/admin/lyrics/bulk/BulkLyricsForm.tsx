"use client";

import { useState, useTransition } from "react";
import type { AdminLyric } from "@/lib/admin-store";

interface BulkLyricsFormProps {
  tracks: AdminLyric[];
  action: (
    patches: Record<string, { lyricsHe?: string }>
  ) => Promise<{ updated: string[]; skipped: string[] }>;
}

interface LyricPatch {
  lyricsHe: string;
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 180,
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 13,
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 4,
  resize: "vertical",
  boxSizing: "border-box",
};

const jsonTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  minHeight: 120,
  fontSize: 12,
};

export function BulkLyricsForm({ tracks, action }: BulkLyricsFormProps) {
  // One state slot per track, keyed by slug. Initialized from current admin
  // data so the textareas show what's saved right now (good for spot-edits).
  const [patches, setPatches] = useState<Record<string, LyricPatch>>(() => {
    const init: Record<string, LyricPatch> = {};
    for (const t of tracks) {
      init[t.slug] = { lyricsHe: t.lyricsHe ?? "" };
    }
    return init;
  });

  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    updated: string[];
    skipped: string[];
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updatePatch = (slug: string, value: string) => {
    setPatches((prev) => ({
      ...prev,
      [slug]: { lyricsHe: value },
    }));
  };

  /* Parse the JSON pane and merge its values into the per-track textareas.
   * Doesn't submit — the user can review/tweak before hitting Save All. */
  const handleApplyJson = () => {
    setJsonError(null);
    if (!jsonInput.trim()) {
      setJsonError("Paste a JSON object first.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      setJsonError(
        `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setJsonError("Expected an object keyed by slug, like { \"shir-varod\": { \"lyricsHe\": \"…\" } }");
      return;
    }
    const next = { ...patches };
    const unknownSlugs: string[] = [];
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!(slug in next)) {
        unknownSlugs.push(slug);
        continue;
      }
      if (!value || typeof value !== "object") continue;
      const v = value as { lyricsHe?: unknown };
      next[slug] = {
        lyricsHe:
          typeof v.lyricsHe === "string" ? v.lyricsHe : next[slug].lyricsHe,
      };
    }
    setPatches(next);
    if (unknownSlugs.length > 0) {
      setJsonError(
        `Applied. Unknown slugs (not in admin store, skipped): ${unknownSlugs.join(", ")}`
      );
    } else {
      setJsonError(null);
    }
  };

  const handleSaveAll = () => {
    setResult(null);
    setSaveError(null);
    startTransition(async () => {
      // Send a patch ONLY for tracks whose textarea contents differ from
      // the admin store's current value — keeps the payload small and the
      // server-side write log focused on what actually changed.
      const changed: Record<string, { lyricsHe?: string }> = {};
      for (const t of tracks) {
        const p = patches[t.slug];
        if (p.lyricsHe !== (t.lyricsHe ?? "")) {
          changed[t.slug] = { lyricsHe: p.lyricsHe };
        }
      }
      if (Object.keys(changed).length === 0) {
        setResult({ updated: [], skipped: [] });
        return;
      }
      try {
        const res = await action(changed);
        setResult(res);
      } catch (err) {
        // Surface server-action throws (auth failure, KV write error, etc.)
        // — previously these were swallowed and the user saw nothing change,
        // which looked like a silent no-op while typing into 32 textareas.
        setSaveError(
          err instanceof Error ? err.message : "Save failed — please try again."
        );
      }
    });
  };

  return (
    <div>
      {/* JSON paste shortcut at the top */}
      <details
        style={{
          marginBottom: 24,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 6,
          background: "#fafafa",
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Paste JSON (optional)
        </summary>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
          Drop a JSON object keyed by slug to fill many textareas at once. Example:
        </p>
        <pre
          style={{
            fontSize: 12,
            background: "#fff",
            border: "1px solid #eee",
            padding: 8,
            borderRadius: 4,
            overflowX: "auto",
          }}
        >{`{
  "shir-varod": {
    "lyricsHe": "line one\\nline two\\n…"
  },
  "ma-laasot-im-hazeev": {
    "lyricsHe": "…"
  }
}`}</pre>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          style={jsonTextareaStyle}
          placeholder='{"shir-varod": {"lyricsHe": "…"}, …}'
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={handleApplyJson}
            style={{
              padding: "6px 12px",
              border: "1px solid #888",
              borderRadius: 4,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Apply JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setJsonInput("");
              setJsonError(null);
            }}
            style={{
              padding: "6px 12px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "transparent",
              cursor: "pointer",
              color: "#666",
            }}
          >
            Clear
          </button>
          {jsonError && (
            <span style={{ fontSize: 13, color: "#b00" }}>{jsonError}</span>
          )}
        </div>
      </details>

      {/* Per-track textareas, grouped by release */}
      <TrackList tracks={tracks} patches={patches} onChange={updatePatch} />

      {/* Save bar */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: 24,
          padding: 12,
          background: "#fff",
          borderTop: "1px solid #ddd",
          display: "flex",
          gap: 12,
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isPending}
          style={{
            padding: "8px 20px",
            border: "none",
            borderRadius: 4,
            background: isPending ? "#999" : "#000",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: isPending ? "default" : "pointer",
          }}
        >
          {isPending ? "Saving…" : "Save All"}
        </button>
        {result && (
          <span style={{ fontSize: 13, color: "#333" }}>
            {result.updated.length === 0 && result.skipped.length === 0
              ? "No changes."
              : `Saved ${result.updated.length} track${result.updated.length === 1 ? "" : "s"}.`}
            {result.skipped.length > 0 && (
              <span style={{ color: "#b00" }}>
                {" "}
                Skipped (unknown slug): {result.skipped.join(", ")}
              </span>
            )}
          </span>
        )}
        {saveError && (
          <span style={{ fontSize: 13, color: "#b00" }}>
            ⚠ {saveError}
          </span>
        )}
      </div>
    </div>
  );
}

function TrackList({
  tracks,
  patches,
  onChange,
}: {
  tracks: AdminLyric[];
  patches: Record<string, LyricPatch>;
  onChange: (slug: string, value: string) => void;
}) {
  // Group adjacent same-release tracks visually so the list reads like a
  // discography rather than a 32-row mush.
  const blocks: Array<{ release: string; items: AdminLyric[] }> = [];
  for (const t of tracks) {
    const release = t.releaseTitle ?? "—";
    const last = blocks[blocks.length - 1];
    if (last && last.release === release) last.items.push(t);
    else blocks.push({ release, items: [t] });
  }

  return (
    <div>
      {blocks.map((block, i) => (
        <section key={`${block.release}-${i}`} style={{ marginBottom: 32 }}>
          <h3
            style={{
              margin: "0 0 12px",
              padding: "8px 0",
              borderBottom: "1px solid #ddd",
              fontSize: 16,
              color: "#444",
            }}
          >
            {block.release}
          </h3>
          {block.items.map((track) => (
            <TrackRow
              key={track.slug}
              track={track}
              patch={patches[track.slug]}
              onChange={onChange}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function TrackRow({
  track,
  patch,
  onChange,
}: {
  track: AdminLyric;
  patch: LyricPatch;
  onChange: (slug: string, value: string) => void;
}) {
  return (
    <div
      style={{
        marginBottom: 20,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 6,
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <strong style={{ fontSize: 15 }}>{track.titleHe}</strong>
        <span style={{ marginLeft: 8, color: "#aaa", fontSize: 12, fontFamily: "monospace" }}>
          {track.slug}
        </span>
      </div>
      <label style={{ fontSize: 13, color: "#444", display: "block" }}>
        <span style={{ display: "block", marginBottom: 4 }}>Hebrew (lyricsHe)</span>
        <textarea
          dir="rtl"
          value={patch.lyricsHe}
          onChange={(e) => onChange(track.slug, e.target.value)}
          style={textareaStyle}
          placeholder="לחצי כאן והדביקי את המילים…"
        />
      </label>
    </div>
  );
}
