"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { auth } from "@/auth";
import {
  getUpcomingShowsAdmin,
  getPastShowsAdmin,
  setPastShowsAdmin,
  getPhotosAdmin,
  setPhotosAdmin,
  getAbout,
  setAbout,
  type AdminShow,
  type AdminPhoto,
  type AdminAbout,
} from "@/lib/admin-store";

// Import the placeholder data constants. These live in the public-page
// template files (where they're rendered as fallback when admin is empty)
// — this action just READS them via TypeScript import + reshapes them
// into the admin schema, then writes them to the admin store.
// Nothing is duplicated; the constants stay where they are.
import { STATIC_PAST } from "@/app/[locale]/(site)/shows/page";
import { STATIC_PHOTOS } from "@/app/[locale]/(site)/gallery/page";
import {
  MILESTONES,
  INFLUENCES,
  FUN_FACTS,
} from "@/app/[locale]/(site)/about/page";

/**
 * Bulk-import the hard-coded placeholder data into the admin store.
 *
 * Each section (`shows` / `photos` / `about`) is independent —
 * importing one doesn't touch the others. Each action is conservative:
 * if the admin store ALREADY has data for that section it returns an
 * error string rather than clobbering. The admin can clear via the
 * normal per-row delete UI if they want to re-import.
 *
 * The point of this feature: every public page currently renders from a
 * hard-coded constants array when admin is empty. That means the inline
 * `<Editable*>` wrappers have no admin row to patch and don't render at
 * all. Importing the placeholders into admin gives every visible row an
 * admin id → the wrappers light up → everything becomes inline-editable.
 *
 * Returns a shape the client form can render as a status message.
 */

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export interface ImportResult {
  ok: boolean;
  imported?: number;
  /** Human-readable error or skip message — surfaced in the admin UI as-is. */
  message?: string;
}

/* ---------------------------------------------------------------------- */
/*  Shows                                                                 */
/* ---------------------------------------------------------------------- */

export async function importShowsPlaceholders(): Promise<ImportResult> {
  await requireAdmin();
  const [existingUp, existingPast] = await Promise.all([
    getUpcomingShowsAdmin(),
    getPastShowsAdmin(),
  ]);
  if (existingUp.length > 0 || existingPast.length > 0) {
    return {
      ok: false,
      message: `Shows already has ${existingUp.length + existingPast.length} row(s) — clear them first if you want a fresh import.`,
    };
  }

  // Only the past-show history is imported. The old placeholder "upcoming"
  // gigs (with example.com ticket links) were removed: imported, they'd be
  // advertised as real concerts.
  const past: AdminShow[] = STATIC_PAST.map((s) => ({
    id: s.id,
    date: s.date,
    venue: s.venue,
    city: s.city,
    title: s.title,
    status: s.status,
    ticketUrl: s.ticketUrl,
    notes: undefined,
  }));

  await setPastShowsAdmin(past);
  revalidatePath("/admin/shows");
  revalidatePublicSite();
  return { ok: true, imported: past.length };
}

/* ---------------------------------------------------------------------- */
/*  Photos                                                                */
/* ---------------------------------------------------------------------- */

export async function importPhotosPlaceholders(): Promise<ImportResult> {
  await requireAdmin();
  const existing = await getPhotosAdmin();
  if (existing.length > 0) {
    return {
      ok: false,
      message: `Photos already has ${existing.length} row(s) — clear them first if you want a fresh import.`,
    };
  }

  const photos: AdminPhoto[] = STATIC_PHOTOS.map((p) => ({
    id: randomId("photo"),
    src: p.src,
    alt: p.alt,
    category: p.category,
  }));

  await setPhotosAdmin(photos);
  revalidatePath("/admin/photos");
  revalidatePublicSite();
  return { ok: true, imported: photos.length };
}

/* ---------------------------------------------------------------------- */
/*  About                                                                 */
/* ---------------------------------------------------------------------- */

export async function importAboutPlaceholders(): Promise<ImportResult> {
  await requireAdmin();
  const existing = await getAbout();
  // About is a single record, not a list — "already populated" is judged
  // by whether ANY of its arrays has content. If everything's empty, we
  // import. Bio paragraphs are NOT included in the import — they're
  // markdown text and importing arbitrary placeholder prose would
  // create the wrong impression of canonical content. Admin should
  // type the real bio via the inline editor (now always available
  // since the EditableLongText wraps even the static fallback).
  const isPopulated =
    existing &&
    ((existing.bioParagraphs?.length ?? 0) > 0 ||
      (existing.funFacts?.length ?? 0) > 0 ||
      (existing.milestones?.length ?? 0) > 0 ||
      (existing.influences?.length ?? 0) > 0 ||
      (existing.pressQuotes?.length ?? 0) > 0);
  if (isPopulated) {
    return {
      ok: false,
      message: "About already has content — clear it first if you want a fresh import.",
    };
  }

  const next: AdminAbout = {
    bioParagraphs: [], // intentionally empty — admin fills via inline editor
    funFacts: [...FUN_FACTS],
    milestones: MILESTONES.map((m) => ({ year: m.year, text: m.text })),
    influences: INFLUENCES.map((i) => ({ name: i.name, icon: i.icon })),
    // Placeholder press quotes are unverified (credited to real outlets),
    // so they're not imported: real quotes are added in the admin panel.
    pressQuotes: [],
  };

  await setAbout(next);
  revalidatePath("/admin/about");
  revalidatePublicSite();
  const imported =
    next.funFacts.length +
    next.milestones.length +
    next.influences.length +
    next.pressQuotes.length;
  return { ok: true, imported };
}
