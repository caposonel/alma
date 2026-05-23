"use server";
import "server-only";

/**
 * Best-effort orphan cleanup for assets stored on Vercel Blob.
 *
 * When admin actions delete or replace an image-bearing record (a photo, a
 * diary cover, etc.) the previous URL becomes orphaned. For Vercel Blob URLs
 * (`*.public.blob.vercel-storage.com`) we call `del(url)` so the storage
 * bill stays bounded. Locally-uploaded files under `/uploads/` are ignored;
 * they live in `public/uploads/` (gitignored) and can be reaped by the user.
 *
 * The helper swallows errors on purpose — a failed cleanup must never block
 * a user-facing delete. The original delete already succeeded by the time
 * this runs; the worst case is a leftover blob the user can prune manually.
 */
export async function deleteBlobIfManaged(
  url: string | undefined | null
): Promise<void> {
  if (!url) return;
  if (!url.includes(".public.blob.vercel-storage.com")) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch (err) {
    console.error("Failed to delete blob:", url, err);
  }
}
