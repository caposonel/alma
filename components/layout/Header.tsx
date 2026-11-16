"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ExternalLink } from "lucide-react";
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
  /**
   * Whether the diary has published entries. The "Diary" nav item is hidden
   * until it does, so the menu doesn't lead to an empty page.
   */
  showDiary?: boolean;
}

export function Header({ storeUrl, showDiary = true }: HeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const navLinks: NavLink[] = [
    ...baseNavLinks.filter((l) => showDiary || l.labelKey !== "diary"),
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

  /* Keyboard + focus handling for the drawer: Escape closes it, focus
   * moves to its close button on open and back to the menu button when it
   * closes (only if it was actually open, so page load doesn't steal focus). */
  useEffect(() => {
    if (drawerOpen) {
      wasOpenRef.current = true;
      // Wait a frame: the drawer is `inert` until this render commits.
      const id = requestAnimationFrame(() => closeButtonRef.current?.focus());
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setDrawerOpen(false);
      };
      document.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(id);
        document.removeEventListener("keydown", onKey);
      };
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuButtonRef.current?.focus();
    }
  }, [drawerOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-200",
          scrolled
            ? "border-b border-blush-100/50 bg-paper md:bg-paper/95 md:backdrop-blur-sm"
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
                    className={cn(className, "inline-flex items-center gap-1")}
                  >
                    {content}
                    {/* Leaves the site (Bandcamp store) */}
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                    <span className="sr-only">(נפתח באתר חיצוני)</span>
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
                className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.spotify}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Spotify"
                className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
              >
                <SpotifyIcon className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
              >
                <YoutubeIcon className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.bandcamp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bandcamp"
                className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
              >
                <BandcampIcon className="h-5 w-5" />
              </a>
            </div>
            {/* WCAG 2.5.5 wants 44×44px minimum hit-box on touch.
                `p-2.5` brings the 24×24 icon up to 44×44 with comfortable
                padding for thumb taps. `-m-2.5` keeps visual alignment
                with the surrounding nav (the extra padding is invisible). */}
            <button
              ref={menuButtonRef}
              onClick={() => setDrawerOpen(true)}
              className="-m-2.5 p-2.5 text-ink-soft md:hidden"
              aria-label="Menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — CSS-only animation (no Framer Motion).
       *
       * The previous version used Framer Motion for the outer wrapper,
       * backdrop fade, drawer slide (with spring physics), AND each
       * nav item with staggered delays — five concurrent JS-driven
       * animations on every drawer toggle, which was very laggy on
       * mid-tier phones.
       *
       * The new version:
       *   - keeps the drawer mounted at all times (no AnimatePresence)
       *   - toggles `pointer-events` + `opacity` + `transform`
       *   - transforms are native CSS → GPU composited automatically
       *   - no per-item stagger — the nav items just appear with the
       *     drawer instead of cascading in
       *   - `will-change-transform` hint on the drawer panel pre-promotes
       *     it to its own composite layer
       *
       * Result on mid-tier phones: opens/closes in ~250ms with smooth
       * 60fps instead of the previous stuttering ~600ms with frame drops.
       *
       * The drawer is always in the DOM but `pointer-events-none` when
       * closed, so it doesn't interfere with the rest of the page. */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden transition-opacity duration-200 ease-out",
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        // `inert` while closed: removes the hidden links from keyboard tab
        // order and the accessibility tree (aria-hidden alone left them
        // focusable).
        inert={!drawerOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-ink/20"
          onClick={() => setDrawerOpen(false)}
        />
        {/* Drawer panel — slides in from the end side (right in LTR,
            left in RTL). Tailwind doesn't have a logical-property
            translate, so we use a CSS variable trick: the panel sits
            at `end-0` and we translate it 100% along its inline-end
            axis when closed. translate-x respects RTL via the logical
            `start`/`end` Tailwind utilities in the className. */}
        <nav
          className={cn(
            "absolute inset-y-0 end-0 w-72 bg-paper px-6 py-4 shadow-lg",
            "transition-transform duration-300 ease-out will-change-transform",
            // In RTL the drawer sits on the LEFT (end-0). Sliding OFF
            // means moving to the LEFT, which is negative X. In LTR
            // the drawer is on the RIGHT; off means positive X.
            drawerOpen
              ? "translate-x-0"
              : "rtl:-translate-x-full ltr:translate-x-full"
          )}
          id="mobile-menu"
          aria-label="Mobile menu"
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="font-display text-2xl font-bold text-ink">עלמה גוב</span>
            <button
              ref={closeButtonRef}
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="-m-2 p-2 text-ink-soft"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {/* Nav items — no per-item animation; they appear with the
              drawer slide for a much snappier feel on mobile. */}
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = link.external
                ? false
                : link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const className = cn(
                "text-lg transition-colors",
                isActive ? "font-medium text-blush-700" : "text-ink-soft"
              );
              const label = t(link.labelKey);
              return link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(className, "inline-flex items-center gap-1.5")}
                >
                  {label}
                  <ExternalLink className="h-4 w-4 opacity-70" aria-hidden="true" />
                  <span className="sr-only">(נפתח באתר חיצוני)</span>
                </a>
              ) : (
                <Link key={link.href} href={link.href} className={className}>
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="mt-10 flex items-center gap-4">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.spotify}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Spotify"
              className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
            >
              <SpotifyIcon className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
            >
              <YoutubeIcon className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.bandcamp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Bandcamp"
              className="-m-1.5 p-1.5 text-ink-soft transition-colors hover:text-blush-500"
            >
              <BandcampIcon className="h-5 w-5" />
            </a>
          </div>
          <Daisy className="absolute bottom-6 start-6 h-8 w-8 opacity-30" />
        </nav>
      </div>
    </>
  );
}
