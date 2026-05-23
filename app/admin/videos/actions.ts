"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getAdminVideos,
  setAdminVideos,
  type AdminVideo,
} from "@/lib/admin-store";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

function randomId(): string {
  return `video-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

const ALLOWED_CATEGORIES = [
  "official",
  "live",
  "session",
  "behind-scenes",
  "interview",
  "other",
] as const;
type VideoCategory = (typeof ALLOWED_CATEGORIES)[number];

function parseCategory(raw: FormDataEntryValue | null): VideoCategory {
  const s = String(raw ?? "official");
  return ALLOWED_CATEGORIES.includes(s as VideoCategory)
    ? (s as VideoCategory)
    : "official";
}

function buildVideoFromForm(
  formData: FormData,
  existing?: AdminVideo
): AdminVideo {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const youtubeId = String(formData.get("youtubeId") ?? "").trim();
  const category = parseCategory(formData.get("category"));
  const releaseDate = String(formData.get("releaseDate") ?? "").trim();
  const featured = formData.get("featured") === "on";

  return {
    id: existing?.id ?? randomId(),
    title: title || "Untitled",
    description: description || undefined,
    youtubeId,
    category,
    releaseDate: releaseDate || undefined,
    featured,
  };
}

function invalidatePublicVideoPaths(): void {
  revalidatePath("/gallery");
  revalidatePath("/en/gallery");
}

/**
 * If `next` is marked featured, unset the featured flag on every other video
 * (only one hero slot exists on the gallery page).
 */
function applyFeaturedExclusive(
  list: AdminVideo[],
  next: AdminVideo
): AdminVideo[] {
  if (!next.featured) return list;
  return list.map((v) => (v.id === next.id ? v : { ...v, featured: false }));
}

export async function createVideo(formData: FormData): Promise<void> {
  await requireAdmin();
  const video = buildVideoFromForm(formData);
  const videos = await getAdminVideos();
  const withNew = [video, ...videos];
  await setAdminVideos(applyFeaturedExclusive(withNew, video));
  revalidatePath("/admin/videos");
  invalidatePublicVideoPaths();
  redirect(`/admin/videos/${video.id}`);
}

export async function updateVideo(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const videos = await getAdminVideos();
  const idx = videos.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error(`Video ${id} not found`);
  const next = buildVideoFromForm(formData, videos[idx]);
  const updated = [...videos];
  updated[idx] = next;
  await setAdminVideos(applyFeaturedExclusive(updated, next));
  revalidatePath("/admin/videos");
  revalidatePath(`/admin/videos/${id}`);
  invalidatePublicVideoPaths();
}

export async function deleteVideo(id: string): Promise<void> {
  await requireAdmin();
  const videos = await getAdminVideos();
  await setAdminVideos(videos.filter((v) => v.id !== id));
  revalidatePath("/admin/videos");
  invalidatePublicVideoPaths();
  redirect("/admin/videos");
}
