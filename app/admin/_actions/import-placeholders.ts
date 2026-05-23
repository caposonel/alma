"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getDiaryEntries,
  setDiaryEntries,
  getUpcomingShowsAdmin,
  getPastShowsAdmin,
  setUpcomingShowsAdmin,
  setPastShowsAdmin,
  getPhotosAdmin,
  setPhotosAdmin,
  getAbout,
  setAbout,
  type AdminDiaryEntry,
  type AdminShow,
  type AdminPhoto,
  type AdminAbout,
} from "@/lib/admin-store";

// Import the placeholder data constants. These live in the public-page
// template files (where they're rendered as fallback when admin is empty)
// — this action just READS them via TypeScript import + reshapes them
// into the admin schema, then writes them to the admin store.
// Nothing is duplicated; the constants stay where they are.
import { STATIC_DIARY_ENTRIES } from "@/app/[locale]/(site)/diary/page";
import {
  STATIC_UPCOMING,
  STATIC_PAST,
} from "@/app/[locale]/(site)/shows/page";
import { STATIC_PHOTOS } from "@/app/[locale]/(site)/gallery/page";
import {
  STATIC_PRESS_QUOTES,
  MILESTONES,
  INFLUENCES,
  FUN_FACTS,
} from "@/app/[locale]/(site)/about/page";

/**
 * Bulk-import the hard-coded placeholder data into the admin store.
 *
 * Each section (`diary` / `shows` / `photos` / `about`) is independent —
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
/*  Diary                                                                 */
/* ---------------------------------------------------------------------- */

export async function importDiaryPlaceholders(): Promise<ImportResult> {
  await requireAdmin();
  const existing = await getDiaryEntries();
  if (existing.length > 0) {
    return {
      ok: false,
      message: `Diary already has ${existing.length} entr${existing.length === 1 ? "y" : "ies"} — clear them first if you want a fresh import.`,
    };
  }

  const now = new Date().toISOString();
  const entries: AdminDiaryEntry[] = STATIC_DIARY_ENTRIES.map((s) => ({
    id: s._id,
    title: s.title,
    slug: s.slug.current,
    date: s.date,
    // The static fallback only has an `excerpt` — no full body. We seed an
    // empty body so admins can fill the full post via the inline body
    // editor on the public detail page later.
    excerpt: s.excerpt ?? "",
    body: "",
    // Static fallback's image is a local /images/... path. Admin's
    // `coverImage` accepts a URL string, so the path works as-is — the
    // public render still finds the file under /public/images.
    coverImage: s.staticImage?.src,
    featured: s.featured ?? false,
    publishedAt: now,
  }));

  await setDiaryEntries(entries);
  revalidatePath("/admin/diary");
  revalidatePath("/diary");
  revalidatePath("/");
  for (const e of entries) {
    revalidatePath(`/diary/${e.slug}`);
    revalidatePath(`/en/diary/${e.slug}`);
  }
  return { ok: true, imported: entries.length };
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

  const upcoming: AdminShow[] = STATIC_UPCOMING.map((s) => ({
    id: s.id,
    date: s.date,
    venue: s.venue,
    city: s.city,
    title: s.title,
    status: s.status,
    ticketUrl: s.ticketUrl,
    notes: undefined,
  }));
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

  await Promise.all([
    setUpcomingShowsAdmin(upcoming),
    setPastShowsAdmin(past),
  ]);
  revalidatePath("/admin/shows");
  revalidatePath("/shows");
  revalidatePath("/");
  return { ok: true, imported: upcoming.length + past.length };
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
  revalidatePath("/gallery");
  revalidatePath("/en/gallery");
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
    pressQuotes: STATIC_PRESS_QUOTES.map((q) => ({
      quote: q.quote,
      source: q.source,
      sourceUrl: undefined,
    })),
  };

  await setAbout(next);
  revalidatePath("/admin/about");
  revalidatePath("/about");
  revalidatePath("/en/about");
  const imported =
    next.funFacts.length +
    next.milestones.length +
    next.influences.length +
    next.pressQuotes.length;
  return { ok: true, imported };
}
