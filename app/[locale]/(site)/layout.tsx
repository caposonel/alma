import { Header, Footer } from "@/components/layout";
import { PageTransition, ScrollProgress } from "@/components/motion";
import { AlmaMascot } from "@/components/decorative/AlmaMascot";
import { MailingBarVisible } from "@/components/ui/MailingBarVisible";
import { MusicPlayerProvider } from "@/lib/music-player-context";
import { AdminModeProvider } from "@/lib/admin-mode-context";
import { EditorSidebar } from "@/components/admin/EditorSidebar";
import { ClientExtras } from "./_ClientExtras";
import { getSettingsAdmin } from "@/lib/admin-store";
import { SOCIAL_LINKS } from "@/lib/config";
import { getAllDiaryEntries } from "@/lib/content";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Site settings are read server-side and threaded into client components
  // as props. Keeps the Header a client component (it needs scroll/state)
  // while making the store URL admin-editable without a per-render KV read
  // inside the client bundle.
  // A KV outage must not take down every public page — fall back to defaults.
  const settings = await getSettingsAdmin().catch((err) => {
    console.error("[site layout] settings read failed:", err);
    return null;
  });
  const storeUrl = settings?.storeUrl ?? SOCIAL_LINKS.bandcamp;

  // Show the "Diary" menu item only once the diary has real entries.
  const hasDiary =
    (await getAllDiaryEntries({ limit: 1 }).catch(() => [])).length > 0;

  /* No server-side session check here: reading cookies would make every
   * public page dynamic (uncacheable). The inline-editing UI only activates
   * inside the `/admin/edit` preview iframe, and AdminModeProvider checks
   * the session client-side there. */
  return (
    <AdminModeProvider>
      <MusicPlayerProvider>
        <ScrollProgress />
        <Header storeUrl={storeUrl} showDiary={hasDiary} />
        <PageTransition>
          <div className="min-h-screen">{children}</div>
        </PageTransition>
        <Footer />
        {/* Space for the fixed MailingBar, sized from its real height (set
            by the bar as --mailing-bar-h), so it never covers the footer. */}
        <div aria-hidden="true" style={{ height: "var(--mailing-bar-h)" }} />
        <AlmaMascot />
        <MailingBarVisible />
        {/* Rarely-active decorative client components — code-split
            (next/dynamic) so the initial bundle doesn't ship JS for the
            StickerSheet easter egg or WebGL PaperBackground. */}
        <ClientExtras />
        {/* Slide-in editor — only activates when this page is loaded inside
            the /admin/edit preview iframe (see AdminModeProvider). Stays
            mounted but inert in normal public-site visits. */}
        <EditorSidebar />
      </MusicPlayerProvider>
    </AdminModeProvider>
  );
}
