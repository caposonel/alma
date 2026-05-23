import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EditWorkspace } from "./EditWorkspace";

/**
 * Live-edit workspace.
 *
 * Embeds the public site in an iframe and exposes a left-side pane that
 * lets the admin pick which page to preview. Inside the iframe, the
 * `AdminModeProvider` auto-detects that it's been loaded by a parent at
 * `/admin/edit` and flips edit mode on — that lights up every
 * `<Editable*>` wrapper sprinkled in the public page templates with a
 * dashed outline. Click any wrapped element → the `EditorSidebar`
 * (rendered inside the iframe, from the public site layout) slides in
 * with a form for that field.
 *
 * Why not render the public-page content directly inside `/admin/edit`
 * instead of an iframe? Two reasons:
 *   1. The public site has its own `<html>`, locale routing, fonts,
 *      and providers. Replicating all that inside the admin frame would
 *      duplicate a lot of layout code and risk drift between the two.
 *   2. An iframe is a perfect WYSIWYG — what you see IS exactly what
 *      visitors see. No "preview only" caveats.
 */
export default async function AdminEditPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin");
  }
  return <EditWorkspace />;
}
