import type { AdminSiteSettings } from "./admin-store";

/**
 * Read a single override from `settings.contentOverrides`, with a fallback
 * if the admin hasn't set one for that key.
 *
 * Used everywhere on the public site to bridge inline-editing to fields
 * whose default value lives outside the admin store (translation strings
 * via next-intl `t()`, hard-coded headings in JSX, etc.). The pattern:
 *
 *   const aboutTitle = readContentOverride(
 *     settings,
 *     "page.about.title",
 *     t("title"),
 *   );
 *
 *   <EditableText
 *     id="override.page.about.title"
 *     label="About page title"
 *     value={aboutTitle}
 *     save={saveContentOverrideInline.bind(null, "page.about.title")}
 *   >
 *     <h1>{aboutTitle}</h1>
 *   </EditableText>
 *
 * The wrapper shows the admin-overridden value if present (and the
 * inline editor pre-fills with it), otherwise the fallback. Saving via
 * the inline editor patches `settings.contentOverrides[key]`; clearing
 * (saving empty) removes the override and the page falls back to the
 * default again.
 *
 * Server-safe — pure read, no side effects. Pass `null` / `undefined` for
 * settings when none have been fetched (returns the fallback).
 */
export function readContentOverride(
  settings: AdminSiteSettings | null | undefined,
  key: string,
  fallback: string
): string {
  const value = settings?.contentOverrides?.[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
