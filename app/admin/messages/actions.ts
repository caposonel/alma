"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  deleteMessageById,
  markAllMessagesRead,
  markMessageRead,
} from "@/lib/admin-store";

/**
 * Server actions for the messages inbox.
 *
 * All write actions check the session — admin routes are gated by middleware,
 * but server actions can be invoked from anywhere with a valid POST so we
 * re-check here defense-in-depth.
 */
async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
}

export async function markAsRead(id: string): Promise<void> {
  await requireAdmin();
  await markMessageRead(id);
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin", "layout");
}

export async function markAllRead(): Promise<void> {
  await requireAdmin();
  await markAllMessagesRead();
  revalidatePath("/admin/messages");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(id: string): Promise<void> {
  await requireAdmin();
  await deleteMessageById(id);
  revalidatePath("/admin/messages");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin", "layout");
  redirect("/admin/messages");
}
