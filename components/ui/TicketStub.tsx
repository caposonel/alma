"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TicketStubProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Ticket stub card with dashed tear-line border and perforation dots.
 * Lifts slightly on hover with a spring animation.
 */
export function TicketStub({ children, className }: TicketStubProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-sm bg-paper-warm p-5 shadow-sm",
        // Perforation circles along the start (right in RTL) border
        "before:absolute before:inset-block-0 before:start-0 before:w-[2px]",
        "before:bg-[repeating-linear-gradient(to_bottom,var(--color-blush-300)_0px,var(--color-blush-300)_6px,transparent_6px,transparent_12px)]",
        className
      )}
      whileHover={{
        y: -3,
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        transition: { type: "spring", damping: 25, stiffness: 200 },
      }}
    >
      {/* Perforation dots along the tear line */}
      <div
        className="absolute inset-block-0 start-[-6px] w-3 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-paper) 3px, transparent 3px)",
          backgroundSize: "12px 12px",
          backgroundPosition: "center 0",
        }}
      />
      {children}
    </motion.div>
  );
}
