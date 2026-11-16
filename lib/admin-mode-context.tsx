"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Admin-mode state shared between the AdminBar (toggle), the various
 * `<Editable*>` wrappers (highlight on hover when edit mode is on), and the
 * EditorSidebar (renders the form for whichever field is selected).
 *
 * `isAdmin` is resolved client-side, only inside the `/admin/edit` preview
 * iframe (see the effect below). Visitors who aren't logged in never see any
 * of the editing UI — `editMode` is locked to false for them.
 *
 * `editMode` is a session-only client toggle (no persistence). It's off by
 * default so the admin sees the site as visitors do, and flips on when they
 * click the "Edit" button in the AdminBar.
 *
 * `activeField` is the descriptor of the field the user clicked on most
 * recently — drives what the EditorSidebar renders. Setting it to null
 * closes the sidebar.
 */

export interface EditorField {
  /** Stable identifier — e.g. "siteSettings.storeUrl". Used as the sidebar key. */
  id: string;
  /** Human label shown in the sidebar header. */
  label: string;
  /** Editor kind — picks which form the sidebar renders. */
  kind: "text" | "longtext" | "url" | "image";
  /** Current value. For "image" this is the URL string. */
  value: string;
  /**
   * Server action that persists the new value. The sidebar calls this and
   * waits on the promise before closing.
   *
   * Returning a string treats it as an error message displayed inline.
   * Returning void / undefined treats the save as successful.
   */
  save: (next: string) => Promise<void | string>;
  /** Optional help text shown under the input. */
  hint?: string;
  /** Optional placeholder for empty inputs. */
  placeholder?: string;
}

interface AdminModeContextValue {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  activeField: EditorField | null;
  setActiveField: (field: EditorField | null) => void;
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [editMode, setEditModeRaw] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<EditorField | null>(null);

  /* Wrap setEditMode so the sidebar closes whenever the user flips edit
   * mode off — otherwise a stale form could linger after the highlight
   * disappears. */
  const setEditMode = useCallback((on: boolean) => {
    setEditModeRaw(on);
    if (!on) setActiveField(null);
  }, []);

  /* Admin detection happens client-side, and only inside the `/admin/edit`
   * preview iframe. Checking the session on the server (as this used to)
   * read cookies in the public layout, which made every public page
   * dynamic and uncacheable. Steps:
   *   1. We're running inside an iframe (`window.self !== window.top`).
   *   2. The parent window is same-origin (cross-origin parents throw a
   *      `SecurityError` on property access).
   *   3. The parent's pathname starts with `/admin/edit`.
   *   4. `/api/auth/session` confirms a logged-in admin.
   * Then edit mode turns on. Public visitors never hit step 4, so the
   * public site does no extra work. Saving still goes through server
   * actions that verify the session themselves (`requireAdmin`). */
  useEffect(() => {
    if (typeof window === "undefined" || window.self === window.top) return;
    let inEditor = false;
    try {
      inEditor = window.parent.location.pathname.startsWith("/admin/edit");
    } catch {
      // Cross-origin parent — not our admin host, ignore.
    }
    if (!inEditor) return;
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((session: { user?: unknown } | null) => {
        if (cancelled || !session?.user) return;
        setIsAdmin(true);
        setEditMode(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setEditMode]);

  const value = useMemo<AdminModeContextValue>(
    () => ({
      isAdmin,
      // Force off for non-admin visitors regardless of any local toggle.
      editMode: isAdmin && editMode,
      setEditMode,
      activeField,
      setActiveField,
    }),
    [isAdmin, editMode, setEditMode, activeField]
  );

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  );
}

/**
 * Returns the admin-mode context, or a null-object fallback when called
 * outside the provider. Falling back rather than throwing means components
 * that use `useAdminMode()` work fine in isolation (Storybook, tests).
 */
export function useAdminMode(): AdminModeContextValue {
  const ctx = useContext(AdminModeContext);
  if (ctx) return ctx;
  return {
    isAdmin: false,
    editMode: false,
    setEditMode: () => {},
    activeField: null,
    setActiveField: () => {},
  };
}
