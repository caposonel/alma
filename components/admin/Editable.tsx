"use client";

import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { useAdminMode, type EditorField } from "@/lib/admin-mode-context";
import { cn } from "@/lib/utils";

/**
 * Inline-editing wrappers. Sprinkle these around any element in any page
 * template to make it editable from the AdminBar's "Edit" mode.
 *
 * Three variants are exported here, all built on the same `<Editable>`
 * primitive:
 *
 *   - `<EditableText>`   — short single-line text (titles, labels, URLs)
 *   - `<EditableLongText>` — multi-line text (descriptions, bodies)
 *   - `<EditableImage>`  — image upload (re-uses the existing admin upload
 *                          action so file-size / format rules stay in sync)
 *
 * Usage from a server component:
 *
 *   <EditableText
 *     id="siteSettings.storeUrl"
 *     label="Store URL"
 *     value={storeUrl}
 *     save={async (next) => { "use server"; await updateStoreUrl(next); }}
 *   >
 *     <a href={storeUrl}>Visit store</a>
 *   </EditableText>
 *
 * When edit mode is off (default), this renders just the `children` —
 * zero visual overhead. When edit mode is on AND the visitor is admin,
 * the children get an outlined hover state and become clickable. Click
 * opens the EditorSidebar pre-filled with `value`.
 */

interface BaseProps {
  id: string;
  label: string;
  value: string;
  save: (next: string) => Promise<void | string>;
  hint?: string;
  placeholder?: string;
  /**
   * Children rendered in the normal (non-editing) view. They're left
   * untouched when edit mode is off, and wrapped in a hover-highlightable
   * span when it's on.
   */
  children: ReactNode;
  /**
   * Optional element type for the wrapper. Defaults to `span` (inline).
   * Pass `"div"` for block content (e.g. a paragraph or image you want
   * to wrap without breaking the layout).
   */
  as?: "span" | "div";
  /** Optional className passed through to the wrapper. */
  className?: string;
}

function Editable({
  field,
  children,
  as = "span",
  className,
}: {
  field: EditorField;
  children: ReactNode;
  as?: "span" | "div";
  className?: string;
}) {
  const { editMode, isAdmin, setActiveField, activeField } = useAdminMode();

  // Off mode (or non-admin): render children naked. No overhead, no
  // attribute leakage, no z-index gymnastics.
  if (!isAdmin || !editMode) {
    if (className) {
      const Wrapper = as;
      return <Wrapper className={className}>{children}</Wrapper>;
    }
    return <>{children}</>;
  }

  const isActive = activeField?.id === field.id;
  const Wrapper = as;
  return (
    <Wrapper
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveField(field);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveField(field);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${field.label}`}
      data-editable-id={field.id}
      className={cn(
        "group relative cursor-pointer rounded-sm outline outline-2 outline-offset-2 transition-colors",
        isActive
          ? "outline-amber-400 bg-amber-50/40"
          : // Visible-but-soft dashed amber outline in edit mode so the
            // admin can SEE what's editable at a glance — the previous
            // `outline-amber-300/0` (fully transparent) only revealed
            // outlines on hover, which left admins thinking nothing was
            // editable. On hover the outline + background intensify.
            "outline-dashed outline-amber-300/70 bg-amber-50/10 hover:outline-amber-400 hover:bg-amber-50/40",
        className
      )}
    >
      {children}
      <span
        aria-hidden="true"
        // Subtle always-visible chip in edit mode so the click target is
        // self-announcing. Intensifies on hover for direct feedback.
        // `whitespace-nowrap` keeps long labels (e.g. "Music page —
        // lyrics section heading") from word-wrapping into a vertical
        // stack when the wrapping span is narrow. The chip is absolutely
        // positioned so it's allowed to overflow its parent's width.
        // `max-w` caps it on extremely small viewports so it doesn't
        // shoot off the page edge.
        className="pointer-events-none absolute -top-3 end-1 z-10 inline-flex max-w-[80vw] items-center gap-1 whitespace-nowrap rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-neutral-900 opacity-70 shadow-sm transition-opacity group-hover:opacity-100"
      >
        <Pencil className="h-2.5 w-2.5" />
        {field.label}
      </span>
    </Wrapper>
  );
}

export function EditableText(props: BaseProps) {
  return (
    <Editable
      field={{
        id: props.id,
        label: props.label,
        kind: "text",
        value: props.value,
        save: props.save,
        hint: props.hint,
        placeholder: props.placeholder,
      }}
      as={props.as ?? "span"}
      className={props.className}
    >
      {props.children}
    </Editable>
  );
}

export function EditableLongText(props: BaseProps) {
  return (
    <Editable
      field={{
        id: props.id,
        label: props.label,
        kind: "longtext",
        value: props.value,
        save: props.save,
        hint: props.hint,
        placeholder: props.placeholder,
      }}
      as={props.as ?? "div"}
      className={props.className}
    >
      {props.children}
    </Editable>
  );
}

export function EditableUrl(props: BaseProps) {
  return (
    <Editable
      field={{
        id: props.id,
        label: props.label,
        kind: "url",
        value: props.value,
        save: props.save,
        hint: props.hint,
        placeholder: props.placeholder ?? "https://…",
      }}
      as={props.as ?? "span"}
      className={props.className}
    >
      {props.children}
    </Editable>
  );
}

export function EditableImage(props: BaseProps) {
  return (
    <Editable
      field={{
        id: props.id,
        label: props.label,
        kind: "image",
        value: props.value,
        save: props.save,
        hint:
          props.hint ??
          "Click the upload area to pick a new image. Saves replace the current one.",
        placeholder: props.placeholder,
      }}
      as={props.as ?? "div"}
      className={props.className}
    >
      {props.children}
    </Editable>
  );
}
