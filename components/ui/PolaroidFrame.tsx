"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heart, Star } from "@/components/decorative";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useIsTouchDevice } from "@/lib/use-is-mobile";
import { viewportOnce } from "@/lib/motion";
import { audioManager } from "@/lib/audio";

interface PolaroidFrameProps {
  src: string;
  alt: string;
  caption?: string;
  rotation?: number;
  decorate?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  className?: string;
  width?: number;
  height?: number;
  /** Responsive sizes hint for Next/Image. Defaults to a reasonable
   *  half-viewport assumption so the optimizer doesn't fall back to
   *  100vw (which causes oversized fetches + layout shift). */
  sizes?: string;
  /** Set false to disable hover animations (e.g. in static contexts) */
  animated?: boolean;
  /** Enable Polaroid developing effect — image fades from white to full */
  developing?: boolean;
  /** Enable postcard flip — click to flip and see a note on the back */
  flipNote?: string;
}

function deterministicRotation(src: string): number {
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = (hash << 5) - hash + src.charCodeAt(i);
    hash |= 0;
  }
  const options = [-3, -2, -1, 1, 2, 3];
  return options[Math.abs(hash) % options.length];
}

export function PolaroidFrame({
  src,
  alt,
  caption,
  rotation,
  decorate = false,
  priority = false,
  unoptimized = false,
  className,
  width = 400,
  height = 400,
  sizes = "(min-width: 768px) 400px, 80vw",
  animated = true,
  developing = false,
  flipNote,
}: PolaroidFrameProps) {
  const rot = rotation ?? deterministicRotation(src);
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const [isFlipped, setIsFlipped] = useState(false);

  const hasFlip = !!flipNote && animated;

  // --- Developing effect variants ---
  const developingVariants = developing && !reducedMotion
    ? {
        hidden: {
          filter: "brightness(2.5) saturate(0) contrast(0.8)",
          opacity: 0.4,
        },
        visible: {
          filter: "brightness(1) saturate(1) contrast(1)",
          opacity: 1,
          transition: { duration: 1.4, ease: "easeOut" as const },
        },
      }
    : developing && reducedMotion
      ? {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.4 } },
        }
      : undefined;

  // --- Front face ---
  // Bottom padding has to make room for the absolutely-positioned caption
  // / flip-prompt text when either is present. When neither is — like
  // when the diary card uses the frame purely decoratively — we collapse
  // to a small accent border so the polaroid doesn't have a giant empty
  // white slab at the bottom.
  const needsCaptionSpace = !!caption || hasFlip;
  const front = (
    <div
      className={cn(
        "rounded-sm bg-white p-3 shadow-md",
        needsCaptionSpace ? "pb-14" : "pb-6"
      )}
    >
      <div className="relative overflow-hidden">
        {developingVariants ? (
          <motion.div
            variants={developingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              priority={priority}
              sizes={sizes}
              className="block h-auto w-full object-cover"
            />
          </motion.div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes={sizes}
            className="block h-auto w-full object-cover"
          />
        )}
      </div>
      {caption && !hasFlip && (
        <p className="absolute bottom-3 start-0 end-0 text-center font-display text-xl text-ink-soft">
          {caption}
        </p>
      )}
      {hasFlip && (
        <p className="absolute bottom-3 start-0 end-0 text-center text-xs font-medium text-blush-500">
          לחצו להפוך
        </p>
      )}
    </div>
  );

  // --- Back face (postcard) ---
  const back = hasFlip ? (
    <div
      className="absolute inset-0 rounded-sm bg-paper-warm p-4 shadow-md"
      style={{
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 27px, rgba(229, 160, 160, 0.15) 27px, rgba(229, 160, 160, 0.15) 28px)",
      }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <Star className="h-5 w-5 opacity-60" variant="filled" />
        <p className="text-center text-base font-medium leading-relaxed text-ink md:text-lg">
          {flipNote}
        </p>
        <Heart className="h-5 w-5 opacity-50" />
      </div>
    </div>
  ) : null;

  // --- Non-animated render ---
  if (!animated) {
    return (
      <div
        className={cn("relative inline-block", className)}
        style={{ transform: `rotate(${rot}deg)` }}
      >
        {front}
        {decorate && (
          <>
            <Heart className="absolute -top-2 -end-2 h-4 w-4 rotate-12" />
            <Heart className="absolute -bottom-1 -start-2 h-3 w-3 -rotate-12" />
          </>
        )}
      </div>
    );
  }

  // --- Flippable render ---
  if (hasFlip) {
    return (
      <div
        className={cn("relative inline-block", className)}
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            rotate: rot,
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 180 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          onHoverStart={() => audioManager.playThrottled("paper-rustle")}
          whileHover={
            !isFlipped
              ? {
                  scale: 1.02,
                  rotate: 0,
                  transition: { type: "spring", damping: 20, stiffness: 200 },
                }
              : undefined
          }
        >
          <div style={{ backfaceVisibility: "hidden" }}>{front}</div>
          {back}
        </motion.div>
        {decorate && (
          <>
            <Heart className="absolute -top-2 -end-2 h-4 w-4 rotate-12" />
            <Heart className="absolute -bottom-1 -start-2 h-3 w-3 -rotate-12" />
          </>
        )}
      </div>
    );
  }

  // --- Standard animated render ---
  // On touch devices: render a plain div with the rotation transform —
  // skip the `motion.div`, hover springs, and the audio-rustle callback.
  // Why: iOS synthesizes pointer events from taps, which used to fire
  // `audioManager.playThrottled("paper-rustle")` on EVERY tap (causing a
  // perceptible stutter); plus the `whileHover` springs are dead UX on
  // touch (no hover state ever lingers). The static div keeps the
  // visual rotation + decorative hearts intact.
  if (isTouch) {
    return (
      <div
        className={cn("relative inline-block", className)}
        style={{ transform: `rotate(${rot}deg)` }}
      >
        {front}
        {decorate && (
          <>
            <Heart className="absolute -top-2 -end-2 h-4 w-4 rotate-12" />
            <Heart className="absolute -bottom-1 -start-2 h-3 w-3 -rotate-12" />
          </>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative inline-block", className)}
      style={{ rotate: rot }}
      onHoverStart={() => audioManager.playThrottled("paper-rustle")}
      whileHover={{
        scale: 1.04,
        rotate: 0,
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
        transition: { type: "spring", damping: 20, stiffness: 200 },
      }}
      whileTap={{ scale: 0.97 }}
    >
      {front}
      {decorate && (
        <>
          <Heart className="absolute -top-2 -end-2 h-4 w-4 rotate-12" />
          <Heart className="absolute -bottom-1 -start-2 h-3 w-3 -rotate-12" />
        </>
      )}
    </motion.div>
  );
}
