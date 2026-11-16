"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { auth } from "@/auth";
import { getAbout, setAbout, type AdminAbout } from "@/lib/admin-store";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

/**
 * Parse + persist the About page content.
 *
 * The form submits a single hidden `about` field containing a JSON-stringified
 * AdminAbout payload. We validate the shape defensively, drop unknown fields,
 * and write the whole object to KV in one go.
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function parseAboutPayload(raw: string): AdminAbout {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid about payload");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid about payload");
  }
  const obj = parsed as Record<string, unknown>;

  const bioParagraphs = isStringArray(obj.bioParagraphs)
    ? obj.bioParagraphs.map((s) => s.trim()).filter((s) => s.length > 0)
    : [];
  const funFacts = isStringArray(obj.funFacts)
    ? obj.funFacts.map((s) => s.trim()).filter((s) => s.length > 0)
    : [];

  const milestonesRaw = Array.isArray(obj.milestones) ? obj.milestones : [];
  const milestones: AdminAbout["milestones"] = [];
  for (const item of milestonesRaw) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const year = typeof m.year === "string" ? m.year.trim() : "";
    const text = typeof m.text === "string" ? m.text.trim() : "";
    if (year || text) milestones.push({ year, text });
  }

  const influencesRaw = Array.isArray(obj.influences) ? obj.influences : [];
  const influences: AdminAbout["influences"] = [];
  for (const item of influencesRaw) {
    if (!item || typeof item !== "object") continue;
    const inf = item as Record<string, unknown>;
    const name = typeof inf.name === "string" ? inf.name.trim() : "";
    const icon = typeof inf.icon === "string" ? inf.icon.trim() : "";
    if (name || icon) influences.push({ name, icon });
  }

  const quotesRaw = Array.isArray(obj.pressQuotes) ? obj.pressQuotes : [];
  const pressQuotes: AdminAbout["pressQuotes"] = [];
  for (const item of quotesRaw) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const quote = typeof q.quote === "string" ? q.quote.trim() : "";
    const source = typeof q.source === "string" ? q.source.trim() : "";
    const sourceUrl =
      typeof q.sourceUrl === "string" && q.sourceUrl.trim().length > 0
        ? q.sourceUrl.trim()
        : undefined;
    if (quote || source) pressQuotes.push({ quote, source, sourceUrl });
  }

  return {
    bioParagraphs,
    funFacts,
    milestones,
    influences,
    pressQuotes,
  };
}

export async function saveAbout(formData: FormData): Promise<void> {
  await requireAdmin();
  const raw = String(formData.get("about") ?? "{}");
  const next = parseAboutPayload(raw);
  await setAbout(next);
  revalidatePath("/admin/about");
  revalidatePublicSite();
}

/* ---------------------------------------------------------------------- */
/*  Inline single-paragraph patch for the `<EditableLongText>` wrappers   */
/*  on the public /about page. Updates one bio paragraph by index; if     */
/*  the new value is empty the paragraph is removed entirely (keeping     */
/*  the array compact rather than leaving an empty slot).                 */
/* ---------------------------------------------------------------------- */

function defaultAbout(): AdminAbout {
  return {
    bioParagraphs: [],
    funFacts: [],
    milestones: [],
    influences: [],
    pressQuotes: [],
  };
}

async function patchAbout(
  patch: (about: AdminAbout) => AdminAbout
): Promise<void> {
  const existing = (await getAbout()) ?? defaultAbout();
  const next = patch(existing);
  await setAbout(next);
  revalidatePath("/admin/about");
  revalidatePublicSite();
}

/**
 * Replace bio paragraph at `index`. The whole stack of paragraphs (joined
 * by double newlines) can also be edited as one blob via
 * `saveAboutBioParagraphsInline`, but per-paragraph patches let the
 * inline editor open a small textarea right where the paragraph lives.
 */
export async function saveAboutBioParagraphInline(
  index: number,
  next: string
): Promise<string | void> {
  await requireAdmin();
  if (!Number.isInteger(index) || index < 0) return "Invalid paragraph index.";
  await patchAbout((about) => {
    const bio = [...about.bioParagraphs];
    const trimmed = next.trim();
    if (trimmed.length === 0) {
      bio.splice(index, 1);
    } else if (index >= bio.length) {
      bio.push(trimmed);
    } else {
      bio[index] = trimmed;
    }
    return { ...about, bioParagraphs: bio };
  });
}

/**
 * Bulk-replace the bio paragraph stack from a single multi-line textarea
 * (blank lines separate paragraphs). Used by the public /about page when
 * the admin wants to edit the whole bio in one shot rather than going
 * paragraph-by-paragraph.
 */
export async function saveAboutBioParagraphsInline(
  next: string
): Promise<string | void> {
  await requireAdmin();
  const paragraphs = next
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  await patchAbout((about) => ({ ...about, bioParagraphs: paragraphs }));
}
