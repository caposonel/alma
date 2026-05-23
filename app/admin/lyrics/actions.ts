"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getAdminLyrics,
  setAdminLyrics,
  type AdminLyric,
} from "@/lib/admin-store";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

function buildLyricFromForm(
  formData: FormData,
  existing?: AdminLyric
): AdminLyric {
  const slugInput = String(formData.get("slug") ?? "").trim();
  const titleHe = String(formData.get("titleHe") ?? "").trim();
  const lyricsHe = String(formData.get("lyricsHe") ?? "");
  const spotifyTrackId = String(formData.get("spotifyTrackId") ?? "").trim();
  const releaseTitle = String(formData.get("releaseTitle") ?? "").trim();
  const releaseDate = String(formData.get("releaseDate") ?? "").trim();

  const slug = slugInput || existing?.slug || slugify(titleHe);

  return {
    slug,
    titleHe: titleHe || "(ללא כותרת)",
    lyricsHe,
    spotifyTrackId: spotifyTrackId || undefined,
    releaseTitle: releaseTitle || undefined,
    releaseDate: releaseDate || undefined,
  };
}

function invalidatePublicLyricPaths(slug: string): void {
  revalidatePath(`/lyrics/${slug}`);
}

export async function createLyric(formData: FormData): Promise<void> {
  await requireAdmin();
  const lyric = buildLyricFromForm(formData);
  const lyrics = await getAdminLyrics();
  if (lyrics.some((l) => l.slug === lyric.slug)) {
    throw new Error(
      `A lyric with slug "${lyric.slug}" already exists. Pick a different slug.`
    );
  }
  await setAdminLyrics([lyric, ...lyrics]);
  revalidatePath("/admin/lyrics");
  invalidatePublicLyricPaths(lyric.slug);
  redirect(`/admin/lyrics/${encodeURIComponent(lyric.slug)}`);
}

export async function updateLyric(
  slug: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const lyrics = await getAdminLyrics();
  const idx = lyrics.findIndex((l) => l.slug === slug);
  if (idx === -1) throw new Error(`Lyric "${slug}" not found`);
  // Slug is locked on edit — preserve the existing one no matter what the
  // form sends (the input is read-only client-side, but defensive on server).
  const next: AdminLyric = {
    ...buildLyricFromForm(formData, lyrics[idx]),
    slug: lyrics[idx].slug,
  };
  const updated = [...lyrics];
  updated[idx] = next;
  await setAdminLyrics(updated);
  revalidatePath("/admin/lyrics");
  revalidatePath(`/admin/lyrics/${encodeURIComponent(slug)}`);
  invalidatePublicLyricPaths(slug);
}

export async function deleteLyric(slug: string): Promise<void> {
  await requireAdmin();
  const lyrics = await getAdminLyrics();
  await setAdminLyrics(lyrics.filter((l) => l.slug !== slug));
  revalidatePath("/admin/lyrics");
  invalidatePublicLyricPaths(slug);
  redirect("/admin/lyrics");
}

/**
 * Bulk-update many tracks' lyric text in a single action. Designed for the
 * scenario where the rights holder has all 32 of Alma's song lyrics in a
 * structured format (e.g. exported from Word/Notes/a Sheet) and wants to
 * paste them all in at once rather than editing 32 admin rows one-by-one.
 *
 * Accepts a flat object keyed by slug:
 *   {
 *     "shir-varod":      { "lyricsHe": "..." },
 *     "ma-laasot-im-hazeev": { "lyricsHe": "..." },
 *     ...
 *   }
 *
 * Behavior:
 *   - Only updates `lyricsHe`. All other fields (titleHe, spotifyTrackId,
 *     releaseTitle, etc.) stay untouched — this is a lyrics-population pass,
 *     not a schema migration.
 *   - Slugs that don't match an existing row are silently skipped (returned
 *     in the `skipped` array of the result so the UI can show them).
 *   - Auth-gated like every other admin write.
 *
 * Returns a summary `{ updated, skipped }` so the admin UI can show which
 * slugs were applied and which were misspelled.
 */
export async function bulkUpdateLyrics(
  patches: Record<string, { lyricsHe?: string }>
): Promise<{ updated: string[]; skipped: string[] }> {
  await requireAdmin();
  const lyrics = await getAdminLyrics();
  const bySlug = new Map(lyrics.map((l) => [l.slug, l] as const));
  const updated: string[] = [];
  const skipped: string[] = [];
  for (const [slug, patch] of Object.entries(patches)) {
    const existing = bySlug.get(slug);
    if (!existing) {
      skipped.push(slug);
      continue;
    }
    const next: AdminLyric = {
      ...existing,
      lyricsHe: patch.lyricsHe ?? existing.lyricsHe ?? "",
    };
    bySlug.set(slug, next);
    updated.push(slug);
  }
  await setAdminLyrics(Array.from(bySlug.values()));
  revalidatePath("/admin/lyrics");
  for (const slug of updated) {
    invalidatePublicLyricPaths(slug);
  }
  return { updated, skipped };
}
