"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const PETAL_ROTATIONS = [0, 72, 144, 216, 288];

export function LoadingScreen() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="mx-auto h-16 w-16 text-pink-doodle"
        >
          {/* 5 petals drawing in sequence */}
          {PETAL_ROTATIONS.map((rot, i) => (
            reducedMotion ? (
              <ellipse
                key={rot}
                cx="20"
                cy="10"
                rx="4.5"
                ry="8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                transform={rot === 0 ? undefined : `rotate(${rot} 20 20)`}
                opacity="1"
              />
            ) : (
              <motion.ellipse
                key={rot}
                cx="20"
                cy="10"
                rx="4.5"
                ry="8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                transform={rot === 0 ? undefined : `rotate(${rot} 20 20)`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: {
                    duration: 0.4,
                    delay: i * 0.15,
                    ease: "easeOut",
                  },
                  opacity: {
                    duration: 0.1,
                    delay: i * 0.15,
                  },
                }}
              />
            )
          ))}
          {/* Center circle appears last */}
          {reducedMotion ? (
            <circle
              cx="20"
              cy="20"
              r="3.5"
              fill="currentColor"
              opacity="0.4"
            />
          ) : (
            <motion.circle
              cx="20"
              cy="20"
              r="3.5"
              fill="currentColor"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.4 }}
              transition={{
                duration: 0.3,
                delay: PETAL_ROTATIONS.length * 0.15,
                ease: "easeOut",
              }}
            />
          )}
        </svg>
        {reducedMotion ? (
          <p className="mt-4 font-display text-sm text-ink-soft">
            טוען...
          </p>
        ) : (
          <motion.p
            className="mt-4 font-display text-sm text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            טוען...
          </motion.p>
        )}
      </div>
    </div>
  );
}
