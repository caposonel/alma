"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Heart, Daisy } from "@/components/decorative";
import { HandwrittenUnderline } from "@/components/ui";
import { InstagramIcon, SpotifyIcon, YoutubeIcon, BandcampIcon } from "@/components/ui/SocialIcons";
import { SOCIAL_LINKS } from "@/lib/config";

type NavLink = {
  href: string;
  labelKey: "home" | "diary" | "music" | "shows" | "gallery" | "about" | "store" | "contact";
  external?: boolean;
};

// Static portion of the nav. The store entry is appended at render time so
// the URL can come from an admin-controlled prop (with a Bandcamp default).
const baseNavLinks: NavLink[] = [
  { href: "/", labelKey: "home" },
  { href: "/diary", labelKey: "diary" },
  { href: "/music", labelKey: "music" },
  { href: "/shows", labelKey: "shows" },
  { href: "/gallery", labelKey: "gallery" },
  { href: "/about", labelKey: "about" },
];

const contactNavLink: NavLink = { href: "/contact", labelKey: "contact" };

interface HeaderProps {
  /**
   * URL for the "Store" nav item. Server-only `getSettingsAdmin()` lookup
   * lives in the layout — this client component just receives the resolved
   * value (with a Bandcamp fallback applied by the caller).
   */
  storeUrl: string;
}

export function Header({ storeUrl }: HeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks: NavLink[] = [
    ...baseNavLinks,
    { href: storeUrl, labelKey: "store", external: true },
    contactNavLink,
  ];

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-200",
          scrolled
            ? "border-b border-blush-100/50 bg-paper/95 backdrop-blur-sm"
            : "bg-paper"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          {/* Right zone: wordmark */}
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-display text-3xl font-bold text-ink">עלמה גוב</span>
            <Heart className="h-4 w-4" />
          </Link>

          {/* Center zone: nav (desktop) */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="ניווט ראשי">
            {navLinks.map((link) => {
              const isActive = link.external
                ? false
                : link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              const className = cn(
                "text-sm transition-colors hover:text-blush-500",
                isActive ? "text-ink" : "text-ink-soft"
              );
              const label = t(link.labelKey);
              const content = isActive ? (
                <HandwrittenUnderline>{label}</HandwrittenUnderline>
              ) : (
                label
              );
              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                );
              }
              return (
                <Link key={link.href} href={link.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </nav>

          {/* Left zone: socials (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-ink-soft transition-colors hover:text-blush-500"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.spotify}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Spotify"
                className="text-ink-soft transition-colors hover:text-blush-500"
              >
                <SpotifyIcon className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-ink-soft transition-colors hover:text-blush-500"
              >
                <YoutubeIcon className="h-5 w-5" />
              </a>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-ink-soft md:hidden"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Animated mobile drawer.
          The outer wrapper must be a `motion.div` (not a plain `<div>`) so
          `<AnimatePresence>` can track its exit. Previously the plain div
          unmounted instantly, taking the inner motion.nav with it before
          its `exit={{ x: "100%" }}` could play — the drawer disappeared
          with a flicker instead of sliding out. */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-ink/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer panel — slides in from the right (end in RTL) */}
            <motion.nav
              className="absolute inset-y-0 end-0 w-72 bg-paper px-6 py-4 shadow-lg"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              aria-label="Mobile menu"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-ink">עלמה גוב</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="text-ink-soft"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* Staggered menu items */}
              <motion.div
                className="flex flex-col gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
                }}
              >
                {navLinks.map((link) => {
                  const isActive = link.external
                    ? false
                    : link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                  const className = cn(
                    "text-lg transition-colors",
                    isActive ? "font-medium text-blush-500" : "text-ink-soft"
                  );
                  const label = t(link.labelKey);
                  return (
                    <motion.div
                      key={link.href}
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                      }}
                    >
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                        >
                          {label}
                        </a>
                      ) : (
                        <Link href={link.href} className={className}>
                          {label}
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
              <div className="mt-10 flex items-center gap-4">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-ink-soft transition-colors hover:text-blush-500"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
                <a href={SOCIAL_LINKS.spotify} target="_blank" rel="noopener noreferrer" aria-label="Spotify" className="text-ink-soft transition-colors hover:text-blush-500">
                  <SpotifyIcon className="h-5 w-5" />
                </a>
                <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-ink-soft transition-colors hover:text-blush-500">
                  <YoutubeIcon className="h-5 w-5" />
                </a>
                <a href={SOCIAL_LINKS.bandcamp} target="_blank" rel="noopener noreferrer" aria-label="Bandcamp" className="text-ink-soft transition-colors hover:text-blush-500">
                  <BandcampIcon className="h-5 w-5" />
                </a>
              </div>
              <Daisy className="absolute bottom-6 start-6 h-8 w-8 opacity-30" />
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
