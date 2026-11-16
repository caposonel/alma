import type { CSSProperties } from "react";

/**
 * Visually hides a spam-trap ("honeypot") input while keeping it in the DOM
 * for bots to fill. It is clipped in place instead of being pushed off-screen
 * with `left: -9999px`: in this right-to-left site a far-left element widens
 * the document, and on phones the browser scrolled the whole contact page
 * sideways out of view.
 */
export const HONEYPOT_STYLE: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  opacity: 0,
  pointerEvents: "none",
};
