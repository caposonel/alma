import { revalidatePath } from "next/cache";

/**
 * Refresh every cached public page after an admin edit.
 *
 * Public pages are statically cached (ISR). They live under the hidden
 * `[locale]` segment, so a call like `revalidatePath("/diary")` may not match
 * the cached `/he/diary` entry. Revalidating the root layout purges all of
 * them; the site is small and edits are rare, so this costs little.
 */
export function revalidatePublicSite(): void {
  revalidatePath("/", "layout");
}
