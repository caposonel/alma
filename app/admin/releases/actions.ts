"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getReleasesAdmin,
  setReleasesAdmin,
  type AdminRelease,
} from "@/lib/admin-store";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

function randomId(): string {
  return `release-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

const ALLOWED_TYPES = ["album", "ep", "single"] as const;
type ReleaseType = (typeof ALLOWED_TYPES)[number];

function parseType(raw: FormDataEntryValue | null): ReleaseType {
  const s = String(raw ?? "single");
  return ALLOWED_TYPES.includes(s as ReleaseType)
    ? (s as ReleaseType)
    : "single";
}

function buildReleaseFromForm(
  formData: FormData,
  existing?: AdminRelease
): AdminRelease {
  return {
    id: existing?.id ?? randomId(),
    title: String(formData.get("title") ?? "").trim() || "Untitled",
    type: parseType(formData.get("type")),
    releaseDate:
      String(formData.get("releaseDate") ?? "").trim() ||
      new Date().toISOString().slice(0, 10),
    spotifyAlbumId:
      String(formData.get("spotifyAlbumId") ?? "").trim() || undefined,
    spotifyUrl: String(formData.get("spotifyUrl") ?? "").trim() || undefined,
    appleMusicUrl:
      String(formData.get("appleMusicUrl") ?? "").trim() || undefined,
    youtubeUrl: String(formData.get("youtubeUrl") ?? "").trim() || undefined,
    bandcampUrl: String(formData.get("bandcampUrl") ?? "").trim() || undefined,
  };
}

export async function createRelease(formData: FormData): Promise<void> {
  await requireAdmin();
  const releases = await getReleasesAdmin();
  const release = buildReleaseFromForm(formData);
  await setReleasesAdmin([release, ...releases]);
  revalidatePath("/admin/releases");
  revalidatePath("/music");
  redirect(`/admin/releases/${release.id}`);
}

export async function updateRelease(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const releases = await getReleasesAdmin();
  const idx = releases.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Release ${id} not found`);
  const next = buildReleaseFromForm(formData, releases[idx]);
  const updated = [...releases];
  updated[idx] = next;
  await setReleasesAdmin(updated);
  revalidatePath("/admin/releases");
  revalidatePath(`/admin/releases/${id}`);
  revalidatePath("/music");
}

export async function deleteRelease(id: string): Promise<void> {
  await requireAdmin();
  const releases = await getReleasesAdmin();
  await setReleasesAdmin(releases.filter((r) => r.id !== id));
  revalidatePath("/admin/releases");
  revalidatePath("/music");
  redirect("/admin/releases");
}
