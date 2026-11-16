"use client";

import { motion } from "framer-motion";
import { PolaroidFrame, Lightbox } from "@/components/ui";
import { staggerContainer, staggerItem, viewportOnce } from "@/lib/motion";

interface Photo {
  src: string;
  alt: string;
  category: string;
}

export function GalleryGrid({ photos }: { photos: Photo[] }) {
  return (
    <Lightbox photos={photos}>
      {(openAt) => (
        <motion.div
          className="columns-2 gap-4 md:columns-3"
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {photos.map((photo, i) => (
            <motion.div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={photo.alt ? `הגדלת תמונה: ${photo.alt}` : "הגדלת תמונה"}
              className="mb-4 break-inside-avoid cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-400"
              variants={staggerItem}
              onClick={() => openAt(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openAt(i);
                }
              }}
            >
              <PolaroidFrame
                src={photo.src}
                alt={photo.alt}
                width={600}
                height={800}
                className="w-full"
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </Lightbox>
  );
}
