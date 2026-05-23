"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSubscribers, removeSubscriber } from "@/lib/admin-store";

/**
 * Server actions for the subscriber inbox.
 *
 * Admin routes are middleware-gated, but server actions can be invoked from
 * anywhere with a valid POST so we re-check here defense-in-depth.
 */
async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

export async function deleteSubscriber(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await removeSubscriber(id);
  revalidatePath("/admin/subscribers");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin", "layout");
}

/**
 * Returns the current subscriber list as a CSV string. Server action so the
 * client can trigger the export without exposing the storage layer.
 */
export async function exportSubscribersCsv(): Promise<string> {
  await requireAdmin();
  const subs = await getSubscribers();
  const header = "email,country,subscribedAt";
  const rows = subs.map((s) =>
    [s.email, s.country ?? "", s.subscribedAt].map(csvEscape).join(",")
  );
  return [header, ...rows].join("\n");
}

/**
 * Minimal RFC-4180-ish escaping: wrap in quotes when the value contains
 * a comma, quote, or newline; double up internal quotes.
 */
function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
