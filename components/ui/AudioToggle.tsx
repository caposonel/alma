"use client";

import { useState, useEffect } from "react";
import { audioManager } from "@/lib/audio";

export function AudioToggle() {
  const [muted, setMuted] = useState(true); // Start muted until user interacts
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize audio on first user gesture
    const initOnGesture = () => {
      if (!initialized) {
        audioManager.init().then(() => {
          setInitialized(true);
          setMuted(audioManager.isMuted());
        });
      }
    };

    window.addEventListener("click", initOnGesture, { once: true });
    return () => window.removeEventListener("click", initOnGesture);
  }, [initialized]);

  const toggle = () => {
    if (!initialized) {
      audioManager.init().then(() => {
        setInitialized(true);
        const newMuted = audioManager.toggleMute();
        setMuted(newMuted);
      });
    } else {
      const newMuted = audioManager.toggleMute();
      setMuted(newMuted);
    }
  };

  return (
    <button
      onClick={toggle}
      className="-m-2 p-2 text-ink-soft/70 hover:text-ink-soft transition-colors"
      aria-label={muted ? "הפעל צלילים" : "השתק צלילים"}
      title={muted ? "הפעל צלילים" : "השתק צלילים"}
    >
      {muted ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
          <path
            d="M10 3L5 7H2v6h3l5 4V3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="15"
            y1="7"
            x2="19"
            y2="13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="19"
            y1="7"
            x2="15"
            y2="13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
          <path
            d="M10 3L5 7H2v6h3l5 4V3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 7.5C15 8.5 15.5 9.5 15.5 10.5S15 12.5 14 13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16 5.5C18 7 19 9 19 10.5S18 14 16 15.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
