"use client";

import { motion } from "framer-motion";
import { scaleIn, viewportOnce } from "@/lib/motion";

/** Scale-in reveal for the hero title */
export function HeroAnimations({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}

/** Stagger each hero description line one by one */
export function HeroLineStagger({ lines }: { lines: string[] }) {
  return (
    <motion.div
      className="mt-6 space-y-1"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
      }}
    >
      {lines.map((line, i) => (
        <motion.p
          key={i}
          className="text-lg text-ink-soft"
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
          }}
        >
          {line}
        </motion.p>
      ))}
    </motion.div>
  );
}

/** Gentle pulse animation on the CTA button to draw attention */
export function HeroPulseButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
