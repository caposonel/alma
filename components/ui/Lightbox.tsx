"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxPhoto {
  src: string;
  alt: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  children: (openAt: (index: number) => void) => React.ReactNode;
}

/**
 * Full-screen photo lightbox with backdrop blur.
 * Navigate with arrow keys or by swiping, close with Escape or click outside.
 * Behaves as a modal dialog: focus moves in on open, Tab stays inside, and
 * focus returns to the photo that opened it on close.
 *
 * Uses render-prop pattern: children receives an `openAt(index)` callback
 * to trigger the lightbox from any photo in the grid.
 */
export function Lightbox({ photos, children }: LightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  const next = useCallback(() => {
    setActiveIndex((prev) =>
      prev !== null ? (prev + 1) % photos.length : null
    );
  }, [photos.length]);

  const prev = useCallback(() => {
    setActiveIndex((prev) =>
      prev !== null ? (prev - 1 + photos.length) % photos.length : null
    );
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          close();
          break;
        case "ArrowLeft":
          // In RTL, left arrow goes to next
          next();
          break;
        case "ArrowRight":
          // In RTL, right arrow goes to previous
          prev();
          break;
        case "Tab": {
          // Keep keyboard focus inside the dialog.
          const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled])"
          );
          if (!focusables || focusables.length === 0) break;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement;
          if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
            e.preventDefault();
            first.focus();
          }
          break;
        }
      }
    };

    document.addEventListener("keydown", handler);
    // Lock body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, next, prev]);

  // Move focus into the dialog on open; give it back to the opener on close.
  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      openerRef.current?.focus?.();
    };
  }, [isOpen]);

  const photo = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <>
      {children((index) => setActiveIndex(index))}

      <AnimatePresence>
        {isOpen && photo && (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={photo.alt || "תמונה"}
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-ink/70 backdrop-blur-md"
              onClick={close}
            />

            {/* Image container */}
            <motion.div
              className="relative z-10 mx-4 max-h-[85vh] max-w-[90vw] touch-pan-y"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              // Swipe between photos. RTL: the next photo comes from the
              // left, so a swipe to the right goes forward.
              drag={photos.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={(_, info) => {
                if (info.offset.x > 60) next();
                else if (info.offset.x < -60) prev();
              }}
            >
              <div className="rounded-sm bg-white p-3 shadow-2xl">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1200}
                  height={900}
                  sizes="90vw"
                  draggable={false}
                  className="max-h-[70vh] w-auto object-contain"
                />
                {/* Caption below the photo, inside the white frame. It
                    used to be absolutely positioned over a fixed-height
                    strip, so two-line captions ran up over the image. */}
                {photo.alt && (
                  <p className="mt-2 text-center font-body text-base leading-snug text-ink">
                    {photo.alt}
                  </p>
                )}
              </div>

              {/* Counter stays outside on dark backdrop. dir="ltr" so it
                  reads "3 / 10", not "10 / 3", in the RTL page. */}
              <p dir="ltr" className="mt-2 text-center text-xs text-white/70">
                {(activeIndex ?? 0) + 1} / {photos.length}
              </p>
            </motion.div>

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute start-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  aria-label="התמונה הקודמת"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:-scale-x-100">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="absolute end-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  aria-label="התמונה הבאה"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:-scale-x-100">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}

            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={close}
              className="absolute end-4 top-4 z-20 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label="סגור"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
