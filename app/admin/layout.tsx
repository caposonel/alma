import type { Metadata } from "next";
import Link from "next/link";
import { Heebo } from "next/font/google";
import { auth } from "@/auth";
import { getUnreadMessageCount } from "@/lib/admin-store";

const heebo = Heebo({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin — Alma Gov",
  robots: { index: false, follow: false },
};

/**
 * Admin panel layout. English-only LTR, plain styling (function over form).
 *
 * This layout sets its own `<html>` element because the `/admin` tree lives
 * outside of `app/[locale]/...` and therefore doesn't inherit the bilingual
 * locale layout's html/body.
 *
 * Sidebar nav is rendered conditionally — when there's no session (i.e. on
 * the login page) we render a minimal shell without nav links so unauth users
 * don't see an interactive nav.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  // Only fetch the unread count when the user is signed in — saves a KV read
  // on the login page.
  const unreadCount = isAuthenticated ? await getUnreadMessageCount() : 0;

  return (
    <html lang="en" dir="ltr" className={heebo.variable}>
      <body
        className="font-sans antialiased"
        style={{
          fontFamily: "var(--font-heebo), system-ui, sans-serif",
          background: "#FBF6F0",
          color: "#2A2A2A",
          margin: 0,
        }}
      >
        {isAuthenticated ? (
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <AdminSidebar unreadCount={unreadCount} />
            <main
              style={{
                flex: 1,
                padding: "32px 40px",
                maxWidth: "100%",
                overflow: "auto",
              }}
            >
              {children}
            </main>
          </div>
        ) : (
          <main style={{ padding: "32px 16px" }}>{children}</main>
        )}
      </body>
    </html>
  );
}

function AdminSidebar({ unreadCount }: { unreadCount: number }) {
  const navItems: { href: string; label: string; badge?: number }[] = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/edit", label: "✎ Live edit" },
    { href: "/admin/messages", label: "Messages", badge: unreadCount },
    { href: "/admin/subscribers", label: "Subscribers" },
    { href: "/admin/diary", label: "Diary" },
    { href: "/admin/shows", label: "Shows" },
    { href: "/admin/releases", label: "Releases" },
    { href: "/admin/photos", label: "Photos" },
    { href: "/admin/videos", label: "Videos" },
    { href: "/admin/lyrics", label: "Lyrics" },
    { href: "/admin/about", label: "About" },
    { href: "/admin/settings", label: "Settings" },
  ];
  return (
    <aside
      style={{
        width: 220,
        background: "#F5EBE0",
        borderRight: "1px solid #E5D7C8",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 24 }}>
        Alma Gov Admin
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: 4,
              color: "#2A2A2A",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                aria-label={`${item.badge} unread`}
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "#B85959",
                  marginInlineStart: 8,
                }}
              />
            )}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: 24 }}>
        <Link
          href="/admin/logout"
          style={{
            display: "block",
            padding: "8px 12px",
            color: "#B85959",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Log out
        </Link>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            padding: "8px 12px",
            color: "#5A4F4A",
            textDecoration: "none",
            fontSize: 12,
          }}
        >
          View site →
        </Link>
      </div>
    </aside>
  );
}
