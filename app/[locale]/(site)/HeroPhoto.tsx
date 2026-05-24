"use client";

import Image from "next/image";
import { PolaroidFrame } from "@/components/ui";
import {
  Heart,
  Star,
  Butterfly,
  MusicNote,
} from "@/components/decorative";
import { FloatingDoodle } from "@/components/motion";
import { useIsMobile } from "@/lib/use-is-mobile";

/**
 * Hero polaroid photo — picks the desktop or mobile variant at runtime
 * based on viewport width via `useIsMobile`. Previously BOTH variants
 * were always rendered (desktop hidden md:block, mobile md:hidden) which
 * meant:
 *   - Both `<Image>` elements were hydrated and present in the DOM
 *   - The `priority` desktop preload triggered even on phones (waste)
 *   - The 8 `FloatingDoodle` instances around the desktop variant
 *     mounted on mobile too (since `useIsMobile` short-circuit didn't
 *     exist yet)
 * Now: server renders the desktop variant by default (SSR-safe default
 * value of `false` from useIsMobile); on mount the client swaps to
 * mobile if viewport is narrow. Only ONE image is in the DOM at a time.
 */
export function HeroPhoto({ title }: { title: string }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <PolaroidFrame
        src="/images/alma-portrait-casual.jpg"
        alt={title}
        rotation={-2.5}
        decorate
        priority
        width={720}
        height={405}
        className="w-80"
      />
    );
  }

  return (
    <div
      className="relative w-[44rem] lg:w-[60rem]"
      style={{ transform: "rotate(-2.5deg)" }}
    >
      <div className="overflow-hidden rounded-sm bg-white p-3 pb-6 shadow-lg">
        <Image
          src="/images/alma-portrait-casual.jpg"
          alt={title}
          width={1044}
          height={587}
          priority
          quality={92}
          sizes="(min-width: 1024px) 60rem, (min-width: 768px) 44rem, 90vw"
          className="h-auto w-full rounded-sm object-cover aspect-[16/9]"
        />
      </div>
      <FloatingDoodle className="absolute -top-6 -start-4" intensity={3} duration={7}>
        <Heart className="h-7 w-7 opacity-80 -rotate-12" />
      </FloatingDoodle>
      <FloatingDoodle className="absolute -top-3 end-12" intensity={4} duration={6}>
        <Heart className="h-3 w-3 opacity-60 rotate-12" />
      </FloatingDoodle>
      <FloatingDoodle className="absolute top-1/4 -end-5" intensity={3} duration={8}>
        <Heart className="h-4 w-4 opacity-55 rotate-45" />
      </FloatingDoodle>
      <FloatingDoodle className="absolute top-2/3 -start-5" intensity={4} duration={7}>
        <Star className="h-4 w-4 opacity-55 -rotate-12" />
      </FloatingDoodle>
      <FloatingDoodle className="absolute -bottom-4 -start-5" intensity={3} duration={8}>
        <Heart className="h-5 w-5 opacity-70 rotate-6" />
      </FloatingDoodle>
      <FloatingDoodle className="absolute -bottom-3 start-1/3" intensity={4} duration={6}>
        <Star className="h-3 w-3 opacity-50 rotate-12" variant="filled" />
      </FloatingDoodle>
      <FloatingDoodle className="absolute -bottom-2 end-8" intensity={3} duration={9}>
        <MusicNote className="h-4 w-3 opacity-50 -rotate-6" />
      </FloatingDoodle>
      <FloatingDoodle className="absolute bottom-12 -end-7" intensity={4} duration={7}>
        <Butterfly className="h-6 w-7 opacity-50 rotate-6" />
      </FloatingDoodle>
    </div>
  );
}
