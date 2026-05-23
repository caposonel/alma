"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImageAction } from "./_actions/upload";
import { adminInputStyle, adminLabelStyle } from "./_components";

interface Props {
  /** Name of the hidden form field that carries the final image URL. */
  name: string;
  /** Existing image URL — preselects the preview on edit forms. */
  defaultValue?: string;
  /** Label shown above the upload control. */
  label?: string;
  /** Placeholder shown in the URL fallback input. */
  urlPlaceholder?: string;
  /** When true, the hidden URL input is `required` so the form can't submit empty. */
  required?: boolean;
}

/**
 * File upload widget for the admin panel.
 *
 * Shows a styled "Choose file" button + image preview. On select, posts the
 * file to `uploadImageAction`, then stores the returned public URL in a
 * hidden input the parent `<form>` submits like any other field.
 *
 * Also exposes a small "Use URL instead" toggle that flips into a plain text
 * input — useful for paths that already live under `/public/images/...`.
 */
export function FileUpload({
  name,
  defaultValue = "",
  label,
  urlPlaceholder = "/images/example.jpg",
  required = false,
}: Props) {
  const [url, setUrl] = useState<string>(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState<boolean>(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadImageAction(formData);
      if (result.ok && result.url) {
        setUrl(result.url);
      } else {
        setError(result.error ?? "Upload failed");
      }
      // Reset the file input so re-picking the same file fires a change.
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handleRemove() {
    setUrl("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      {label && <span style={adminLabelStyle}>{label}</span>}

      {/* The actual value the parent form reads. Kept in sync with `url`. */}
      <input
        type="hidden"
        name={name}
        value={url}
        required={required}
        readOnly
      />

      {urlMode ? (
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={urlPlaceholder}
            style={adminInputStyle}
          />
          <ToggleLink onClick={() => setUrlMode(false)}>
            Use file upload instead
          </ToggleLink>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {url ? (
              <ImagePreview url={url} onRemove={handleRemove} />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  background: "#FAF4EB",
                  border: "1px dashed #E5D7C8",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#A89A8E",
                  fontSize: 11,
                  textAlign: "center",
                  padding: 8,
                  boxSizing: "border-box",
                }}
              >
                no image
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  padding: "8px 14px",
                  background: "white",
                  border: "1px solid #E5D7C8",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#5A4F4A",
                  cursor: pending ? "wait" : "pointer",
                  display: "inline-block",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending
                  ? "Uploading…"
                  : url
                    ? "Replace image"
                    : "Choose file"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  disabled={pending}
                  style={{ display: "none" }}
                />
              </label>
              <ToggleLink onClick={() => setUrlMode(true)}>
                Use URL instead
              </ToggleLink>
            </div>
          </div>

          {url && (
            <div
              style={{
                fontSize: 11,
                color: "#8A7E72",
                marginTop: 6,
                wordBreak: "break-all",
              }}
            >
              {url}
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            background: "#FBEEEE",
            border: "1px solid #E5A0A0",
            borderRadius: 4,
            color: "#B85959",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function ImagePreview({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}) {
  return (
    <div style={{ position: "relative", width: 96, height: 96 }}>
      {/* Plain <img> on purpose: admin-only, no need for next/image cost +
          the local /uploads paths or absolute blob URLs work the same here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="preview"
        style={{
          width: 96,
          height: 96,
          objectFit: "cover",
          borderRadius: 6,
          border: "1px solid #E5D7C8",
          background: "#FAF4EB",
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        title="Remove image"
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: 11,
          border: "1px solid #E5A0A0",
          background: "white",
          color: "#B85959",
          fontSize: 14,
          lineHeight: 1,
          cursor: "pointer",
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function ToggleLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        color: "#B85959",
        fontSize: 12,
        cursor: "pointer",
        textDecoration: "underline",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}
