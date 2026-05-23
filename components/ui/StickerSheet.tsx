"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface StickerPlacement {
  id: string;
  sticker: string;
  x: number;
  y: number;
}

const STICKER_CATALOG = [
  { id: "heart", emoji: "❤️", label: "לב" },
  { id: "star", emoji: "⭐", label: "כוכב" },
  { id: "flower", emoji: "🌸", label: "פרח" },
  { id: "note", emoji: "🎵", label: "תו" },
  { id: "butterfly", emoji: "🦋", label: "פרפר" },
  { id: "cat", emoji: "🐱", label: "חתול" },
  { id: "guitar", emoji: "🎸", label: "גיטרה" },
  { id: "sun", emoji: "🌞", label: "שמש" },
  { id: "rainbow", emoji: "🌈", label: "קשת" },
  { id: "sparkle", emoji: "✨", label: "ניצוצות" },
  { id: "leaf", emoji: "🍃", label: "עלה" },
  { id: "microphone", emoji: "🎤", label: "מיקרופון" },
];

const STORAGE_KEY = "alma-stickers";
const CLICK_COUNT_KEY = "alma-daisy-clicks";

function loadPlacements(): StickerPlacement[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePlacements(placements: StickerPlacement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(placements));
  } catch {
    // Storage full or unavailable
  }
}

export function StickerSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [placements, setPlacements] = useState<StickerPlacement[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setPlacements(loadPlacements());
  }, []);

  const addSticker = useCallback(
    (stickerId: string, x: number, y: number) => {
      const catalog = STICKER_CATALOG.find((s) => s.id === stickerId);
      if (!catalog) return;

      const newPlacement: StickerPlacement = {
        id: `${stickerId}-${Date.now()}`,
        sticker: catalog.emoji,
        x,
        y,
      };

      setPlacements((prev) => {
        const updated = [...prev, newPlacement];
        savePlacements(updated);
        return updated;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    setPlacements([]);
    savePlacements([]);
  }, []);

  const handleDragStart = (stickerId: string) => {
    setDragging(stickerId);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!dragging) return;
      // Store coordinates relative to the document, not the viewport — so the
      // sticker stays at the drop point as the user scrolls.
      addSticker(dragging, e.clientX + window.scrollX, e.clientY + window.scrollY);
      setDragging(null);
    },
    [dragging, addSticker]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      {/* Placed stickers on page — `absolute` positioned, page-coordinate
          based so they stay anchored to the document as the user scrolls. */}
      {placements.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none z-20 text-2xl select-none"
          style={{ left: `${p.x}px`, top: `${p.y}px`, transform: "translate(-50%, -50%)" }}
        >
          {p.sticker}
        </div>
      ))}

      {/* Drop zone (invisible full-page layer when drawer is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sticker drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-0 start-0 end-0 z-50 rounded-t-2xl border-t border-blush-200 bg-white/95 backdrop-blur-md p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-ink">מדבקות ✨</h3>
              <div className="flex items-center gap-2">
                {placements.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-ink-soft/60 hover:text-blush-500 transition-colors"
                  >
                    נקה הכל
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full hover:bg-blush-50 flex items-center justify-center text-ink-soft"
                  aria-label="סגור"
                >
                  ✕
                </button>
              </div>
            </div>

            <p className="text-xs text-ink-soft/60 mb-3">
              גררו מדבקות לכל מקום בעמוד!
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {STICKER_CATALOG.map((sticker) => (
                <motion.button
                  key={sticker.id}
                  draggable
                  onDragStart={() => handleDragStart(sticker.id)}
                  onClick={() => {
                    // On click (non-drag), place randomly within the current
                    // viewport — but store coordinates in page space so the
                    // sticker stays where it landed as the user scrolls.
                    const x = window.scrollX + 100 + Math.random() * (window.innerWidth - 200);
                    const y = window.scrollY + 100 + Math.random() * (window.innerHeight - 200);
                    addSticker(sticker.id, x, y);
                  }}
                  whileHover={prefersReduced ? {} : { scale: 1.2 }}
                  whileTap={prefersReduced ? {} : { scale: 0.9 }}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-blush-50 cursor-grab active:cursor-grabbing transition-colors"
                  title={sticker.label}
                >
                  <span className="text-2xl">{sticker.emoji}</span>
                  <span className="text-[9px] text-ink-soft/50">{sticker.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret trigger — expose via a global function */}
      <StickerTrigger onOpen={() => setIsOpen(true)} />
    </>
  );
}

/**
 * Listens for triple-click on any Daisy in the footer.
 * Uses a global click counter stored in sessionStorage.
 */
function StickerTrigger({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    let clickCount = 0;
    let lastClickTime = 0;

    const handler = (e: MouseEvent) => {
      // Check if clicked element or its parent is inside the footer and is/contains a Daisy SVG
      const target = e.target as HTMLElement;
      const footer = target.closest("footer");
      if (!footer) return;

      const svg = target.closest("svg");
      if (!svg) return;

      const now = Date.now();
      if (now - lastClickTime > 1500) {
        clickCount = 0;
      }
      clickCount++;
      lastClickTime = now;

      if (clickCount >= 3) {
        clickCount = 0;
        onOpen();
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [onOpen]);

  return null;
}
