"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, LogOut, Pencil } from "lucide-react";
import { useAdminMode } from "@/lib/admin-mode-context";
import { cn } from "@/lib/utils";

/**
 * Thin floating toolbar that appears at the very top of every public page
 * when the visitor is logged in as admin. Surfaces three controls:
 *
 *   1. Edit-mode toggle — flips the `<Editable*>` highlight UI on/off
 *      everywhere. Off by default so the admin sees the site as a
 *      visitor would; flip on to start clicking elements to edit them.
 *   2. Dashboard link — jumps to the classic `/admin` UI for things that
 *      don't have an obvious inline-editable representation (subscribers,
 *      contact messages, etc.).
 *   3. Sign out — clears the NextAuth session.
 *
 * Hidden entirely for non-admin visitors. The whole component returns
 * null when `useAdminMode().isAdmin` is false.
 */
export function AdminBar({ locale }: { locale: string }) {
  const { isAdmin, editMode, setEditMode } = useAdminMode();
  if (!isAdmin) return null;

  const adminUrl = "/admin"; // admin tree lives outside the [locale] segment
  const signOutUrl = "/admin/logout";

  return (
    <motion.div
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.25 }}
      className="fixed top-0 start-0 end-0 z-[55] flex items-center justify-between gap-2 bg-neutral-900/95 px-4 py-1.5 text-xs text-white shadow-md backdrop-blur-sm"
      role="region"
      aria-label="Admin toolbar"
    >
      <div className="flex items-center gap-1 opacity-80">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          admin
        </span>
        <span className="text-neutral-500">/</span>
        <span className="text-neutral-300">{locale.toUpperCase()}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
            editMode
              ? "bg-amber-400 text-neutral-900 hover:bg-amber-300"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          aria-pressed={editMode}
        >
          <Pencil className="h-3 w-3" />
          {editMode ? "Editing — click any element" : "Edit"}
        </button>
        <AnimatePresence>
          {editMode && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap text-neutral-300"
            >
              Hover an element, click to open the editor.
            </motion.span>
          )}
        </AnimatePresence>
        <a
          href={adminUrl}
          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-3 w-3" />
          Dashboard
        </a>
        <a
          href={signOutUrl}
          className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs text-white/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3 w-3" />
          Sign out
        </a>
      </div>
    </motion.div>
  );
}
