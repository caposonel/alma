"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAdminMode, type EditorField } from "@/lib/admin-mode-context";
import { uploadImageAction } from "@/app/admin/_actions/upload";

/**
 * Slide-in editor panel for the inline admin UI.
 *
 * Lives in the layout (rendered once) and listens to `activeField` from
 * AdminModeContext. When `activeField` is non-null, the panel slides in
 * from the inline-end edge (right in LTR, left in RTL) with the form
 * appropriate to the field kind. Closing the panel (X button, escape key,
 * or backdrop click) clears `activeField`.
 *
 * The form's `save` action is the field's own `save` prop — each
 * `<Editable*>` wrapper hands the sidebar a server action bound to its
 * specific data path. The sidebar doesn't know what's being edited, only
 * that "this string should be persisted via this function." This keeps the
 * sidebar fully decoupled from the data model.
 */
export function EditorSidebar() {
  const { activeField, setActiveField } = useAdminMode();
  return (
    <AnimatePresence>
      {activeField && (
        <SidebarContent
          key={activeField.id}
          field={activeField}
          onClose={() => setActiveField(null)}
        />
      )}
    </AnimatePresence>
  );
}

function SidebarContent({
  field,
  onClose,
}: {
  field: EditorField;
  onClose: () => void;
}) {
  // Local draft — start from the field's current value so the user sees
  // what they're about to overwrite.
  const [draft, setDraft] = useState<string>(field.value);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset draft when the field changes (different element clicked while
  // sidebar is already open).
  useEffect(() => {
    setDraft(field.value);
    setError(null);
  }, [field.id, field.value]);

  // Close on Escape — standard panel behavior.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await field.save(draft);
        if (typeof result === "string") {
          setError(result);
          return;
        }
        onClose();
      } catch (err) {
        // Server actions that call `redirect()` throw an internal
        // `NEXT_REDIRECT` error — let it bubble so Next can perform the
        // navigation. Catching it here just shows "NEXT_REDIRECT" in the
        // sidebar's error box and leaves the user stuck on a saved-but-
        // -looks-failed state.
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          typeof (err as { digest?: unknown }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <>
      {/* Backdrop — soft so the underlying page is still visible */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/20"
        aria-hidden="true"
      />
      {/* Panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="fixed end-0 top-0 bottom-0 z-[61] flex w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-label={`Edit ${field.label}`}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400">
              Edit
            </p>
            <h2 className="font-display text-xl text-neutral-900">
              {field.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Form body — kind-specific */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {field.kind === "image" ? (
            <ImageEditor
              currentUrl={draft}
              onPick={(url) => setDraft(url)}
            />
          ) : field.kind === "longtext" ? (
            <textarea
              dir="auto"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={field.placeholder}
              className="block w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm leading-relaxed text-neutral-900 focus:border-neutral-500 focus:outline-none"
              rows={14}
              autoFocus
            />
          ) : (
            <input
              dir="auto"
              type={field.kind === "url" ? "url" : "text"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={field.placeholder}
              className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
              autoFocus
            />
          )}
          {field.hint && (
            <p className="mt-2 text-xs text-neutral-500">{field.hint}</p>
          )}
          {error && (
            <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer with save/cancel */}
        <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </footer>
      </motion.aside>
    </>
  );
}

/**
 * Image upload sub-form. Reuses the existing `uploadImageAction` so the
 * validation rules (file size, format, etc. in `lib/admin-upload`) stay
 * consistent with the rest of the admin panel.
 */
function ImageEditor({
  currentUrl,
  onPick,
}: {
  currentUrl: string;
  onPick: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (!res.ok || !res.url) {
        setError(res.error ?? "Upload failed");
        return;
      }
      onPick(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {currentUrl && (
        <div className="overflow-hidden rounded border border-neutral-200 bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt="Current"
            className="block max-h-72 w-full object-contain"
          />
        </div>
      )}
      <label className="block rounded border-2 border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-600 hover:border-neutral-500 hover:bg-neutral-50">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {uploading ? "Uploading…" : "Click to pick a new image"}
      </label>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
