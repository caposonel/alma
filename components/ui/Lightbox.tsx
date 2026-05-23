"use client";

import { useState, useEffect, useCallback } from "react";
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
 * Navigate with arrow keys, close with Escape or click outside.
 *
 * Uses render-prop pattern: children receives an `openAt(index)` callback
 * to trigger the lightbox from any photo in the grid.
 */
export function Lightbox({ photos, children }: LightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;

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

  const photo = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <>
      {children((index) => setActiveIndex(index))}

      <AnimatePresence>
        {isOpen && photo && (
          <motion.div
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
              className="relative z-10 mx-4 max-h-[85vh] max-w-[90vw]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="relative rounded-sm bg-white p-3 pb-10 shadow-2xl">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1200}
                  height={900}
                  sizes="90vw"
                  className="max-h-[75vh] w-auto object-contain"
                />
                {/* Caption inside the white frame */}
                <p className="absolute bottom-2 start-3 end-3 text-center font-body text-base leading-snug text-ink">
                  {photo.alt}
                </p>
              </div>

              {/* Counter stays outside on dark backdrop */}
              <p className="mt-2 text-center text-xs text-white/60">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="absolute end-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  aria-label="התמונה הבאה"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}

            {/* Close button */}
            <button
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
