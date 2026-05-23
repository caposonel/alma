"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getPhotosAdmin,
  setPhotosAdmin,
  type AdminPhoto,
} from "@/lib/admin-store";
import { deleteBlobIfManaged } from "@/lib/admin-cleanup";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

function randomId(): string {
  return `photo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/**
 * Save the entire gallery in one shot. The form posts parallel arrays:
 *   ids[]      — existing photo id (or empty string for a new row)
 *   src[]      — path under /public, e.g. /images/foo.jpg
 *   alt[]      — alt text / caption
 *   category[] — grouping label (e.g. "הופעות")
 * Rows where both `src` and `alt` are blank are treated as deletions.
 *
 * Any blob URLs that disappear from the gallery (because the row was deleted
 * or its `src` was replaced with a different URL) are scheduled for cleanup
 * via `deleteBlobIfManaged`. Local /uploads/ paths and external CDNs are
 * left alone.
 */
export async function savePhotos(formData: FormData): Promise<void> {
  await requireAdmin();
  const ids = formData.getAll("ids").map((v) => String(v));
  const sources = formData.getAll("src").map((v) => String(v));
  const alts = formData.getAll("alt").map((v) => String(v));
  const categories = formData.getAll("category").map((v) => String(v));

  const n = Math.max(ids.length, sources.length, alts.length, categories.length);
  const next: AdminPhoto[] = [];
  for (let i = 0; i < n; i++) {
    const src = (sources[i] ?? "").trim();
    const alt = (alts[i] ?? "").trim();
    const category = (categories[i] ?? "").trim();
    // Skip empty rows.
    if (!src && !alt && !category) continue;
    next.push({
      id: ids[i] || randomId(),
      src,
      alt,
      category: category || "כללי",
    });
  }

  // Diff previous vs next so we can prune any blob URLs that are no longer
  // referenced. We compare URLs (not ids) — replacing a row's `src` should
  // free the old blob even though the id is unchanged.
  const previous = await getPhotosAdmin();
  const survivingUrls = new Set(next.map((p) => p.src).filter(Boolean));
  const orphanUrls = previous
    .map((p) => p.src)
    .filter((src): src is string => Boolean(src) && !survivingUrls.has(src));

  await setPhotosAdmin(next);

  // Fire-and-forget per-URL cleanup (each call has its own try/catch via the
  // helper, so a single failure can't block the others).
  await Promise.all(orphanUrls.map((url) => deleteBlobIfManaged(url)));

  revalidatePath("/admin/photos");
  revalidatePath("/gallery");
}

/* ---------------------------------------------------------------------- */
/*  Inline single-field patch for the `<Editable*>` wrappers on the       */
/*  public gallery. Patches one field on one photo row by id.             */
/* ---------------------------------------------------------------------- */

type PhotoInlineField = "src" | "alt" | "category";

export async function patchPhotoFieldInline(
  id: string,
  field: PhotoInlineField,
  next: string
): Promise<string | void> {
  await requireAdmin();
  const photos = await getPhotosAdmin();
  const idx = photos.findIndex((p) => p.id === id);
  if (idx === -1) return `Photo ${id} not found`;
  const previous = photos[idx];
  const trimmed = next.trim();
  const updated: AdminPhoto = { ...previous };
  switch (field) {
    case "src":
      if (!trimmed) return "Image URL can't be empty.";
      updated.src = trimmed;
      // Free the previous blob if it was a managed URL and the new src is different.
      if (previous.src && previous.src !== updated.src) {
        await deleteBlobIfManaged(previous.src);
      }
      break;
    case "alt":
      updated.alt = trimmed;
      break;
    case "category":
      updated.category = trimmed || "כללי";
      break;
  }
  const list = [...photos];
  list[idx] = updated;
  await setPhotosAdmin(list);
  revalidatePath("/admin/photos");
  revalidatePath("/gallery");
  revalidatePath("/en/gallery");
}
