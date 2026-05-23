import { getAdminLyrics } from "@/lib/admin-store";
import { FormHeader } from "../../_components";
import { BulkLyricsForm } from "./BulkLyricsForm";
import { bulkUpdateLyrics } from "../actions";

/**
 * Bulk lyric editor — every track on one page.
 *
 * Why this exists: the per-track edit flow is great for a single change,
 * but populating lyrics for the full catalog (32 tracks) one-by-one via
 * the normal `/admin/lyrics/[slug]` page is tedious. This page lays every
 * track out as a side-by-side HE/EN textarea pair so the rights holder can
 * paste everything in one session and save it all with a single submit.
 *
 * Two input modes:
 *   1. Per-track textareas — fill them in directly. Save All applies.
 *   2. JSON paste — drop a `{ "<slug>": { "lyricsHe": "...", "lyricsEn": "..." } }`
 *      object into the JSON area at the top and click "Apply JSON" to
 *      populate the textareas below. Useful when the lyrics live in a
 *      separate document already in that shape.
 *
 * Everything goes through the same `bulkUpdateLyrics` server action.
 */
export default async function BulkLyricsPage() {
  const lyrics = await getAdminLyrics();
  const sorted = [...lyrics].sort((a, b) => {
    const aDate = a.releaseDate ?? "";
    const bDate = b.releaseDate ?? "";
    if (aDate && bDate) return bDate.localeCompare(aDate);
    return a.titleHe.localeCompare(b.titleHe);
  });

  const submit = async (
    patches: Record<string, { lyricsHe?: string; lyricsEn?: string }>
  ): Promise<{ updated: string[]; skipped: string[] }> => {
    "use server";
    return bulkUpdateLyrics(patches);
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <FormHeader
        title="Bulk lyrics editor"
        backHref="/admin/lyrics"
        backLabel="Back to lyrics"
      />
      <p style={{ marginTop: 0, marginBottom: 24, color: "#555", lineHeight: 1.5 }}>
        Edit lyrics for every track on one page. Either fill in the textareas
        directly or paste a JSON object keyed by slug into the JSON pane at
        the top and click <em>Apply JSON</em> to populate the textareas. Save
        All writes everything in one shot.
      </p>
      <BulkLyricsForm tracks={sorted} action={submit} />
    </div>
  );
}
