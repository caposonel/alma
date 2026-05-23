"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getSettingsAdmin,
  setSettingsAdmin,
  type AdminSiteSettings,
} from "@/lib/admin-store";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

export async function saveSettings(formData: FormData): Promise<void> {
  await requireAdmin();
  const hero1 = String(formData.get("heroLine1") ?? "").trim();
  const hero2 = String(formData.get("heroLine2") ?? "").trim();
  const hero3 = String(formData.get("heroLine3") ?? "").trim();
  const heroLines = [hero1, hero2, hero3].filter((s) => s.length > 0);

  // Minimal URL validation — must start with https:// so we never inject
  // a non-https link into the public header. Empty string clears the
  // override and the site falls back to the Bandcamp constant.
  const rawStoreUrl = String(formData.get("storeUrl") ?? "").trim();
  let storeUrl: string | undefined;
  if (rawStoreUrl.length === 0) {
    storeUrl = undefined;
  } else if (rawStoreUrl.startsWith("https://")) {
    storeUrl = rawStoreUrl;
  } else {
    // Keep the save flow simple — surface the error via thrown Error which
    // Next.js renders in the dev overlay / 500 page rather than silently
    // saving an invalid URL.
    throw new Error("storeUrl must start with https://");
  }

  const next: AdminSiteSettings = {
    heroDescription: heroLines.length > 0 ? heroLines : undefined,
    storeUrl,
  };

  await setSettingsAdmin(next);
  revalidatePath("/admin/settings");
  // Revalidate the public pages that read site settings (hero on home,
  // Header store link on every page under [locale]/(site)).
  revalidatePath("/", "layout");
}

/* ---------------------------------------------------------------------- */
/*  Single-field actions for the inline `<Editable*>` editors on the      */
/*  public site. Each takes a raw string value (not FormData) and patches */
/*  ONLY that field on the existing settings record — so nothing else     */
/*  the admin has set gets clobbered by a partial update.                 */
/* ---------------------------------------------------------------------- */

async function patchSettings(
  patch: Partial<AdminSiteSettings>
): Promise<void> {
  const existing = (await getSettingsAdmin()) ?? {};
  await setSettingsAdmin({ ...existing, ...patch });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

/**
 * Save just the `storeUrl` field. Used by `<EditableUrl>` wrappers on the
 * public site. Returns a user-facing error string on validation failure
 * (the EditorSidebar surfaces it inline); throws on auth failure so the
 * dev overlay shows the stack.
 */
export async function saveStoreUrlInline(next: string): Promise<string | void> {
  await requireAdmin();
  const trimmed = next.trim();
  if (trimmed.length === 0) {
    await patchSettings({ storeUrl: undefined });
    return;
  }
  if (!trimmed.startsWith("https://")) {
    return "Store URL must start with https://";
  }
  await patchSettings({ storeUrl: trimmed });
}

/**
 * Save the hero description (3-line stack rendered above the hero CTA).
 * Takes a single string with newlines as line separators — matches what
 * the EditorSidebar's longtext mode emits.
 */
export async function saveHeroDescriptionInline(
  next: string
): Promise<string | void> {
  await requireAdmin();
  const lines = next
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  await patchSettings({
    heroDescription: lines.length > 0 ? lines : undefined,
  });
}

/**
 * Set (or clear) a single key in `settings.contentOverrides`. Lets any
 * `<EditableText>` on the public site target a translation string or
 * hard-coded heading — the wrapper passes `key = "page.about.title"`
 * etc. and the public template reads it via `getContentOverride()`
 * before falling back to its default.
 *
 * Empty / whitespace-only value clears the override (so the page falls
 * back to the translation / static default again).
 */
/* Allowlist regex for content-override keys. Defence-in-depth: even though
 * this action is auth-gated, an attacker who compromised the admin session
 * (phishing, leaked cookie) could otherwise dump arbitrary keys into KV.
 * The format we actually use everywhere is:
 *
 *   page.<section>.<field>     →  page.about.title
 *   page.<section>.<field>.<n> →  page.about.bio.0
 *
 * `siteSettings.heroDescription` etc. use dedicated server actions, NOT
 * this one — so we can keep the allowlist tight to the `page.*` namespace.
 */
const OVERRIDE_KEY_PATTERN = /^page\.[a-z][a-z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*){1,3}$/;

export async function saveContentOverrideInline(
  key: string,
  next: string
): Promise<string | void> {
  await requireAdmin();
  const trimmedKey = key.trim();
  if (!trimmedKey) return "Override key can't be empty.";
  if (!OVERRIDE_KEY_PATTERN.test(trimmedKey)) {
    return `Invalid override key "${trimmedKey}". Expected dot-path like "page.<section>.<field>".`;
  }
  const existing = (await getSettingsAdmin()) ?? {};
  const overrides = { ...(existing.contentOverrides ?? {}) };
  const trimmedValue = next.trim();
  if (trimmedValue.length === 0) {
    delete overrides[trimmedKey];
  } else {
    // Preserve newlines inside the value, only trim the edges. Longtext
    // overrides (e.g. multi-paragraph content) need internal whitespace
    // to round-trip.
    overrides[trimmedKey] = next.replace(/^\s+|\s+$/g, "");
  }
  await patchSettings({
    contentOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
  });
}
