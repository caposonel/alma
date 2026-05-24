"use client";

import dynamic from "next/dynamic";

/**
 * Bundle of rarely-active decorative client components that should NOT
 * ship in the initial bundle. Each is loaded asynchronously on the
 * client, after the main UI has painted:
 *
 *   - `StickerSheet`: hidden drawer — only opens when the user triple-
 *     clicks the daisy in the footer (rare easter egg).
 *   - `PetalTrail`: cursor-trail effect, only activates after triple-
 *     clicking the AlmaMascot.
 *   - `PaperBackground`: WebGL paper texture. The component itself short-
 *     circuits on mobile / reduced-motion, but the bundle still ships
 *     even if it never renders — dynamic import keeps that out of the
 *     initial JS payload entirely.
 *
 * `ssr: false` because all three are pointless on the server (no DOM,
 * no localStorage, no WebGL). Visitors who never interact with any of
 * these (most of them) never download the JS.
 */
const StickerSheet = dynamic(
  () => import("@/components/ui/StickerSheet").then((m) => m.StickerSheet),
  { ssr: false }
);
const PetalTrail = dynamic(
  () => import("@/components/motion/PetalTrail").then((m) => m.PetalTrail),
  { ssr: false }
);
const PaperBackground = dynamic(
  () =>
    import("@/components/motion/PaperBackground").then(
      (m) => m.PaperBackground
    ),
  { ssr: false }
);

export function ClientExtras() {
  return (
    <>
      <PaperBackground />
      <StickerSheet />
      <PetalTrail />
    </>
  );
}
