"use client";

import { useRef, useState } from "react";

/**
 * Two-pane live-edit workspace. Left = page selector, right = iframe of the
 * public site. The iframe's URL is what the admin user picks from the left.
 *
 * The iframe is loaded same-origin, so the public site's
 * `AdminModeProvider` can read `window.parent.location.pathname` and detect
 * that it's been embedded by `/admin/edit` — that's what activates edit
 * mode inside the iframe (no query param, no postMessage handshake).
 *
 * The EditorSidebar slides in INSIDE the iframe (it's rendered by the
 * public site's layout). So clicking an editable element shows the form
 * over the page content, exactly where the visitor would see it.
 */

interface PageOption {
  /** Human label in the sidebar. */
  label: string;
  /** Path the iframe loads when this option is picked. */
  path: string;
  /** Brief secondary line under the label. */
  hint?: string;
}

const PAGES: PageOption[] = [
  { label: "בית", path: "/", hint: "Home" },
  { label: "מוזיקה", path: "/music", hint: "Music" },
  { label: "יומן", path: "/diary", hint: "Diary" },
  { label: "גלריה", path: "/gallery", hint: "Gallery" },
  { label: "הופעות", path: "/shows", hint: "Shows" },
  { label: "אודות", path: "/about", hint: "About" },
  { label: "יצירת קשר", path: "/contact", hint: "Contact" },
];

export function EditWorkspace() {
  const [path, setPath] = useState<string>("/");
  const [reloadKey, setReloadKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Hebrew-only — EN support was removed site-wide. PAGES list is fixed.
  const pages = PAGES;

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        height: "calc(100vh - 64px)",
        minHeight: 600,
      }}
    >
      {/* Left: page selector */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: "#fff",
          border: "1px solid #E5D7C8",
          borderRadius: 6,
          padding: 16,
          overflowY: "auto",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
          Live edit
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#777", lineHeight: 1.4 }}>
          Pick a page on the left. Inside the preview, hover over any element
          with a dashed outline and click to open the editor.
        </p>

        {/* Locale toggle removed — site is Hebrew-only. */}

        {/* Page list */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {pages.map((page) => {
            const active = page.path === path;
            return (
              <button
                key={page.path}
                type="button"
                onClick={() => {
                  setPath(page.path);
                  // Always bump so the iframe `src` query string changes
                  // even if the user re-clicks the currently-active page
                  // (acts as a refresh in that case).
                  setReloadKey((k) => k + 1);
                }}
                style={{
                  textAlign: "start",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: 4,
                  background: active ? "#FFD7A8" : "transparent",
                  color: "#2A2A2A",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                <span style={{ display: "block" }}>{page.label}</span>
                {page.hint && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: active ? "#7A5A2A" : "#999",
                      fontFamily: "monospace",
                      marginTop: 2,
                    }}
                  >
                    {page.hint}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <hr
          style={{
            margin: "16px 0",
            border: "none",
            borderTop: "1px solid #eee",
          }}
        />

        {/* Toolbar — refresh iframe, open in new tab */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff",
              cursor: "pointer",
              color: "#333",
            }}
          >
            ↻ Reload preview
          </button>
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 10px",
              fontSize: 12,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff",
              color: "#333",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Open in new tab ↗
          </a>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "#999",
            lineHeight: 1.5,
          }}
        >
          The public site itself shows no admin UI — the editor only
          appears inside this preview.
        </p>
      </aside>

      {/* Right: live preview iframe */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          border: "1px solid #E5D7C8",
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <iframe
          ref={iframeRef}
          // Cache-busted URL: `_e` changes every time reloadKey bumps, so
          // the browser sees a brand-new URL and navigates the iframe to
          // it — even if `path` happens to equal the previous one. This
          // is more reliable than React's key-based remount, which can
          // skip the actual navigation when both renders produce
          // structurally similar iframes. The public site ignores the
          // `_e` query param (no route depends on it).
          src={`${path}${path.includes("?") ? "&" : "?"}_e=${reloadKey}`}
          title="Live preview"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
