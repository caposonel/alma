import type { Variants, Transition } from "framer-motion";

// RTL: physical "left" in LTR is "right" in RTL.
// Our site is always RTL, so elements should enter from the right (positive x).
const RTL_FACTOR = -1;

/* ---------- Shared transition presets ----------
 *
 * Hover/tap/click spring presets used across PolaroidFrame, Button,
 * TicketStub, Mixtape, MailingBar, Lightbox, Tape, etc. Previously each
 * call site declared its own `{ type: "spring", damping: 20, stiffness: 200 }`
 * with slightly different but interchangeable values (13+ inline copies);
 * promoted here for one source of truth.
 */

/** Springy snap for hover/tap interactions — pops in, settles quickly. */
export const springPop: Transition = {
  type: "spring",
  damping: 20,
  stiffness: 200,
};

/** Slower, smoother spring for entrance animations (drawer slides etc.) */
export const springSlide: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 180,
};

/** Bouncier spring — for playful elements that should overshoot a bit. */
export const springBouncy: Transition = {
  type: "spring",
  damping: 15,
  stiffness: 150,
};

/* ---------- Viewport defaults ---------- */

export const viewportOnce = { once: true, margin: "-60px" as const };

/* ---------- Variant factories ---------- */

/** Fade-in while sliding up */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/** Fade-in while sliding down */
export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/** Fade-in while sliding from the start side (right in RTL) */
export const fadeInStart: Variants = {
  hidden: { opacity: 0, x: 60 * RTL_FACTOR },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/** Fade-in while sliding from the end side (left in RTL) */
export const fadeInEnd: Variants = {
  hidden: { opacity: 0, x: -60 * RTL_FACTOR },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/** Simple opacity fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

/** Scale up from slightly smaller */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

/** Stagger container — children animate sequentially */
export function staggerContainer(staggerDelay = 0.08): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };
}

/** Default child variant for stagger grids */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ---------- Direction resolver ---------- */

type Direction = "up" | "down" | "left" | "right";

export function getDirectionVariants(direction: Direction): Variants {
  switch (direction) {
    case "up":
      return fadeUp;
    case "down":
      return fadeDown;
    case "left":
      return fadeInEnd;
    case "right":
      return fadeInStart;
    default:
      return fadeUp;
  }
}
