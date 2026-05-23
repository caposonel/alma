"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getDiaryEntries,
  setDiaryEntries,
  type AdminDiaryEntry,
} from "@/lib/admin-store";
import { deleteBlobIfManaged } from "@/lib/admin-cleanup";

/**
 * Server actions for the diary editor. All actions check for an authenticated
 * session; without one they throw immediately so a leaked URL can't write
 * data.
 */
async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

function slugify(input: string): string {
  // Minimal slugifier: lowercase, replace non [a-z0-9] runs with `-`, trim.
  // Hebrew chars are stripped (we keep latin/digits/hyphen), so callers can
  // explicitly set a slug if they want Hebrew.
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function buildEntryFromForm(
  formData: FormData,
  existing?: AdminDiaryEntry
): AdminDiaryEntry {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const featured = formData.get("featured") === "on";

  return {
    id: existing?.id ?? randomId("diary"),
    title: title || "Untitled",
    slug: slugInput || slugify(title),
    date: date || new Date().toISOString().slice(0, 10),
    excerpt,
    body,
    coverImage: coverImage || undefined,
    featured,
    publishedAt: existing?.publishedAt ?? new Date().toISOString(),
  };
}

export async function createDiaryEntry(formData: FormData): Promise<void> {
  await requireAdmin();
  const entries = await getDiaryEntries();
  const entry = buildEntryFromForm(formData);
  await setDiaryEntries([entry, ...entries]);
  revalidatePath("/admin/diary");
  revalidatePath("/diary");
  revalidatePath("/");
  redirect(`/admin/diary/${entry.id}`);
}

export async function updateDiaryEntry(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const entries = await getDiaryEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) {
    throw new Error(`Diary entry ${id} not found`);
  }
  const previous = entries[idx];
  const next = buildEntryFromForm(formData, previous);
  const updated = [...entries];
  updated[idx] = next;
  await setDiaryEntries(updated);

  // If the cover image was swapped for a different blob URL, prune the old
  // one. Same URL or a non-blob URL (local /uploads/) is left alone.
  if (
    previous.coverImage &&
    previous.coverImage !== next.coverImage
  ) {
    await deleteBlobIfManaged(previous.coverImage);
  }

  revalidatePath("/admin/diary");
  revalidatePath(`/admin/diary/${id}`);
  revalidatePath("/diary");
  revalidatePath(`/diary/${next.slug}`);
  revalidatePath("/");
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await requireAdmin();
  const entries = await getDiaryEntries();
  const removed = entries.find((e) => e.id === id);
  const filtered = entries.filter((e) => e.id !== id);
  await setDiaryEntries(filtered);

  // Clean up the cover image blob (if any) after the row is gone.
  if (removed?.coverImage) {
    await deleteBlobIfManaged(removed.coverImage);
  }

  revalidatePath("/admin/diary");
  revalidatePath("/diary");
  revalidatePath("/");
  redirect("/admin/diary");
}

/* ---------------------------------------------------------------------- */
/*  Inline single-field patch for the `<Editable*>` wrappers on the       */
/*  public site. Takes the entry id + a field name + the raw string       */
/*  value, patches just that one field, revalidates the public paths.     */
/* ---------------------------------------------------------------------- */

type DiaryInlineField = "title" | "excerpt" | "body" | "coverImage" | "date";

export async function patchDiaryFieldInline(
  id: string,
  field: DiaryInlineField,
  next: string
): Promise<string | void> {
  await requireAdmin();
  const entries = await getDiaryEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return `Diary entry ${id} not found`;
  const previous = entries[idx];
  const trimmed = field === "body" ? next : next.trim();
  const updated: AdminDiaryEntry = { ...previous };
  switch (field) {
    case "title":
      updated.title = trimmed || "Untitled";
      // Note: slug is intentionally NOT updated to avoid breaking existing
      // public URLs / external links. To re-slug, use the per-entry admin
      // form which exposes the slug field.
      break;
    case "excerpt":
      updated.excerpt = trimmed;
      break;
    case "body":
      updated.body = trimmed;
      break;
    case "coverImage":
      updated.coverImage = trimmed || undefined;
      // If the cover was swapped to a different blob, prune the old one.
      if (
        previous.coverImage &&
        previous.coverImage !== updated.coverImage
      ) {
        await deleteBlobIfManaged(previous.coverImage);
      }
      break;
    case "date":
      if (trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return "Date must be in YYYY-MM-DD format.";
      }
      updated.date = trimmed || new Date().toISOString().slice(0, 10);
      break;
  }
  const list = [...entries];
  list[idx] = updated;
  await setDiaryEntries(list);
  revalidatePath("/admin/diary");
  revalidatePath(`/admin/diary/${id}`);
  revalidatePath("/diary");
  revalidatePath(`/diary/${updated.slug}`);
  revalidatePath(`/en/diary/${updated.slug}`);
  revalidatePath("/");
}
