"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface LyricsRevealProps {
  text: string;
  className?: string;
  dir?: "rtl" | "ltr";
  /**
   * Inline style passed through to the wrapper. Used by the lyrics page
   * to override `fontFamily` to the display variable so the handwritten
   * font applies cleanly to each animated line.
   */
  style?: React.CSSProperties;
}

/**
 * Renders multi-line lyric text with a staggered fade-up entrance —
 * each line wipes in 6px from below over ~0.45s, 0.12s apart.
 *
 * Respects `prefers-reduced-motion`: falls back to a static `<pre>` so the
 * lyrics are still readable without the entrance animation.
 *
 * Bilingual-friendly: pass `dir="rtl"` for Hebrew, `"ltr"` for English.
 */
export function LyricsReveal({
  text,
  className,
  dir = "rtl",
  style,
}: LyricsRevealProps) {
  const reducedMotion = useReducedMotion();
  const lines = text.split("\n");

  if (reducedMotion) {
    return (
      <pre className={className} dir={dir} style={style}>
        {text}
      </pre>
    );
  }

  return (
    <motion.div
      className={className}
      dir={dir}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        visible: { transition: { staggerChildren: 0.12 } },
      }}
      style={{ whiteSpace: "pre-wrap", ...style }}
    >
      {lines.map((line, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 6 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.45, ease: "easeOut" },
            },
          }}
        >
          {line || " "}
        </motion.div>
      ))}
    </motion.div>
  );
}
