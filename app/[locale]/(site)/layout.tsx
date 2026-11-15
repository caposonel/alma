import { Header, Footer } from "@/components/layout";
import { PageTransition, ScrollProgress } from "@/components/motion";
import { AlmaMascot } from "@/components/decorative/AlmaMascot";
import { MailingBar } from "@/components/ui/MailingBar";
import { MusicPlayerProvider } from "@/lib/music-player-context";
import { AdminModeProvider } from "@/lib/admin-mode-context";
import { EditorSidebar } from "@/components/admin/EditorSidebar";
import { ClientExtras } from "./_ClientExtras";
import { auth } from "@/auth";
import { getSettingsAdmin } from "@/lib/admin-store";
import { SOCIAL_LINKS } from "@/lib/config";

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

  /* Determine whether the visitor is an authenticated admin. The
   * inline-editing UI only ACTIVATES inside the `/admin/edit` preview
   * iframe (the AdminModeProvider detects it's been embedded there); the
   * public site itself shows no admin UI to anyone, admin or not. */
  const session = await auth();
  const isAdmin = !!session?.user;

  return (
    <AdminModeProvider isAdmin={isAdmin}>
      <MusicPlayerProvider>
        <ScrollProgress />
        <Header storeUrl={storeUrl} />
        <PageTransition>
          {/* Bottom padding so the sticky MailingBar doesn't cover content. */}
          <div className="min-h-screen pb-20 md:pb-24">{children}</div>
        </PageTransition>
        <Footer />
        <AlmaMascot />
        <MailingBar />
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
