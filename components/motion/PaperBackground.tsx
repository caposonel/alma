"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useIsMobile } from "@/lib/use-is-mobile";

/**
 * Living paper texture background using WebGL Paper Shaders.
 * Falls back to CSS gradients if WebGL is unavailable.
 *
 * Skipped entirely on mobile (where the WebGL shader paints a
 * full-viewport GPU layer every frame — too expensive for mid-tier
 * phones) and when the user prefers reduced motion. The page falls back
 * to the static CSS paper gradient in `globals.css` body styles in
 * those cases — visually nearly identical, zero runtime cost.
 */
export function PaperBackground() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [PaperTexture, setPaperTexture] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [hasWebGL, setHasWebGL] = useState(false);

  useEffect(() => {
    // Skip the shader entirely on mobile or reduced-motion.
    if (isMobile || reducedMotion) return;
    // Check for WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (gl) {
        setHasWebGL(true);
        // Dynamically import to avoid SSR issues
        import("@paper-design/shaders-react").then((mod) => {
          setPaperTexture(() => mod.PaperTexture);
        });
      }
    } catch {
      // No WebGL — CSS fallback will be used
    }
  }, [isMobile, reducedMotion]);

  if (isMobile || reducedMotion || !hasWebGL || !PaperTexture) {
    // CSS fallback — the existing paper texture from globals.css handles this
    return null;
  }

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      <PaperTexture
        colorFront="#e8ddd4"
        colorBack="#fbf6f0"
        roughness={0.35}
        fiber={0.5}
        fiberSize={0.45}
        crumples={0.2}
        crumpleSize={0.5}
        folds={0.15}
        foldCount={3}
        fade={0.4}
        drops={0.1}
        seed={42}
        speed={reducedMotion ? 0 : 0.05}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
