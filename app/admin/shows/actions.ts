"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getUpcomingShowsAdmin,
  getPastShowsAdmin,
  setUpcomingShowsAdmin,
  setPastShowsAdmin,
  type AdminShow,
} from "@/lib/admin-store";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

function randomId(): string {
  return `show-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

const ALLOWED_STATUSES = ["upcoming", "past", "sold-out"] as const;
type ShowStatus = (typeof ALLOWED_STATUSES)[number];

function parseStatus(raw: FormDataEntryValue | null): ShowStatus {
  const s = String(raw ?? "upcoming");
  return ALLOWED_STATUSES.includes(s as ShowStatus)
    ? (s as ShowStatus)
    : "upcoming";
}

function buildShowFromForm(
  formData: FormData,
  existing?: AdminShow
): AdminShow {
  const date = String(formData.get("date") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const status = parseStatus(formData.get("status"));
  const ticketUrl = String(formData.get("ticketUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    id: existing?.id ?? randomId(),
    date: date || new Date().toISOString().slice(0, 10),
    venue: venue || "TBA",
    city: city || "TBA",
    title: title || undefined,
    status,
    ticketUrl: ticketUrl || undefined,
    notes: notes || undefined,
  };
}

/** Find a show by id across the two buckets. Returns its bucket + the row. */
async function locateShow(
  id: string
): Promise<
  | { bucket: "upcoming"; show: AdminShow; index: number; list: AdminShow[] }
  | { bucket: "past"; show: AdminShow; index: number; list: AdminShow[] }
  | null
> {
  const upcoming = await getUpcomingShowsAdmin();
  const u = upcoming.findIndex((s) => s.id === id);
  if (u !== -1) {
    return { bucket: "upcoming", show: upcoming[u], index: u, list: upcoming };
  }
  const past = await getPastShowsAdmin();
  const p = past.findIndex((s) => s.id === id);
  if (p !== -1) {
    return { bucket: "past", show: past[p], index: p, list: past };
  }
  return null;
}

function isPastBucket(status: ShowStatus): "upcoming" | "past" {
  return status === "past" ? "past" : "upcoming";
}

function invalidatePublicShowPaths(): void {
  revalidatePath("/");
  revalidatePath("/shows");
}

export async function createShow(formData: FormData): Promise<void> {
  await requireAdmin();
  const show = buildShowFromForm(formData);
  const target = isPastBucket(show.status);
  if (target === "past") {
    const past = await getPastShowsAdmin();
    await setPastShowsAdmin([show, ...past]);
  } else {
    const upcoming = await getUpcomingShowsAdmin();
    await setUpcomingShowsAdmin([show, ...upcoming]);
  }
  revalidatePath("/admin/shows");
  invalidatePublicShowPaths();
  redirect(`/admin/shows/${show.id}`);
}

export async function updateShow(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const located = await locateShow(id);
  if (!located) {
    throw new Error(`Show ${id} not found`);
  }

  const next = buildShowFromForm(formData, located.show);
  const targetBucket = isPastBucket(next.status);

  // Same bucket — in-place update.
  if (targetBucket === located.bucket) {
    const updated = [...located.list];
    updated[located.index] = next;
    if (targetBucket === "past") {
      await setPastShowsAdmin(updated);
    } else {
      await setUpcomingShowsAdmin(updated);
    }
  } else {
    // Moving between buckets — remove from source, prepend to target.
    if (located.bucket === "upcoming") {
      const upcoming = await getUpcomingShowsAdmin();
      await setUpcomingShowsAdmin(upcoming.filter((s) => s.id !== id));
      const past = await getPastShowsAdmin();
      await setPastShowsAdmin([next, ...past]);
    } else {
      const past = await getPastShowsAdmin();
      await setPastShowsAdmin(past.filter((s) => s.id !== id));
      const upcoming = await getUpcomingShowsAdmin();
      await setUpcomingShowsAdmin([next, ...upcoming]);
    }
  }

  revalidatePath("/admin/shows");
  revalidatePath(`/admin/shows/${id}`);
  invalidatePublicShowPaths();
}

export async function deleteShow(id: string): Promise<void> {
  await requireAdmin();
  const upcoming = await getUpcomingShowsAdmin();
  const past = await getPastShowsAdmin();
  if (upcoming.some((s) => s.id === id)) {
    await setUpcomingShowsAdmin(upcoming.filter((s) => s.id !== id));
  }
  if (past.some((s) => s.id === id)) {
    await setPastShowsAdmin(past.filter((s) => s.id !== id));
  }
  revalidatePath("/admin/shows");
  invalidatePublicShowPaths();
  redirect("/admin/shows");
}

/* ---------------------------------------------------------------------- */
/*  Inline single-field patch for the `<Editable*>` wrappers on the       */
/*  public site. Patches one field on one show; bucket stays the same.    */
/* ---------------------------------------------------------------------- */

type ShowInlineField =
  | "venue"
  | "city"
  | "date"
  | "title"
  | "ticketUrl"
  | "notes";

export async function patchShowFieldInline(
  id: string,
  field: ShowInlineField,
  next: string
): Promise<string | void> {
  await requireAdmin();
  const located = await locateShow(id);
  if (!located) return `Show ${id} not found`;
  const trimmed = next.trim();
  const updated: AdminShow = { ...located.show };
  switch (field) {
    case "venue":
      updated.venue = trimmed || "TBA";
      break;
    case "city":
      updated.city = trimmed || "TBA";
      break;
    case "date":
      if (trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return "Date must be YYYY-MM-DD.";
      }
      updated.date = trimmed || new Date().toISOString().slice(0, 10);
      break;
    case "title":
      updated.title = trimmed || undefined;
      break;
    case "ticketUrl":
      if (trimmed && !trimmed.startsWith("https://")) {
        return "Ticket URL must start with https://";
      }
      updated.ticketUrl = trimmed || undefined;
      break;
    case "notes":
      updated.notes = trimmed || undefined;
      break;
  }
  const list = [...located.list];
  list[located.index] = updated;
  if (located.bucket === "past") {
    await setPastShowsAdmin(list);
  } else {
    await setUpcomingShowsAdmin(list);
  }
  revalidatePath("/admin/shows");
  revalidatePath(`/admin/shows/${id}`);
  invalidatePublicShowPaths();
}
