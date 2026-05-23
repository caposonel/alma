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
 * `isAdmin` is set server-side via the NextAuth session and threaded down
 * from the site layout. Visitors who aren't logged in never see any of the
 * editing UI — `editMode` is locked to false for them.
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

export function AdminModeProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: ReactNode;
}) {
  const [editMode, setEditModeRaw] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<EditorField | null>(null);

  /* Wrap setEditMode so the sidebar closes whenever the user flips edit
   * mode off — otherwise a stale form could linger after the highlight
   * disappears. */
  const setEditMode = useCallback((on: boolean) => {
    setEditModeRaw(on);
    if (!on) setActiveField(null);
  }, []);

  /* Auto-enable edit mode when this page is loaded inside the `/admin/edit`
   * preview iframe. Detection logic:
   *   1. We're running inside an iframe (`window.self !== window.top`).
   *   2. The parent window is same-origin (try/catch the property access —
   *      cross-origin parents throw a `SecurityError` on access).
   *   3. The parent's pathname starts with `/admin/edit`.
   * If all three hold AND the visitor is an admin, flip edit mode on.
   *
   * Doesn't run when visiting the public site directly — the parent check
   * fails (no iframe) and editMode stays off. So a logged-in admin
   * browsing the site sees zero editing UI; the experience only lights up
   * inside the admin preview pane. */
  useEffect(() => {
    if (!isAdmin || typeof window === "undefined") return;
    if (window.self === window.top) return;
    try {
      const parentPath = window.parent.location.pathname;
      if (parentPath.startsWith("/admin/edit")) {
        setEditMode(true);
      }
    } catch {
      // Cross-origin parent — not our admin host, ignore.
    }
  }, [isAdmin, setEditMode]);

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
