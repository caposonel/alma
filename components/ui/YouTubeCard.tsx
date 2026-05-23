"use client";

import { useState } from "react";

interface YouTubeCardProps {
  youtubeId: string;
  title: string;
  /**
   * Aspect ratio class. Default `aspect-video` (16:9). Override for vertical
   * shorts (`aspect-[9/16]`) if needed.
   */
  aspectClassName?: string;
  className?: string;
}

/**
 * "Lite YouTube" card — click-to-play pattern.
 *
 * Initial state: high-res thumbnail + play button (zero network requests
 * to YouTube on page load).
 *
 * After click: swaps in the actual YouTube iframe with `autoplay=1`, so
 * the video starts immediately in-place. Uses youtube-nocookie.com for
 * privacy (no tracking cookies until playback starts).
 *
 * Caveat — Error 153:
 *   If you see a "Watch this video on YouTube — Error 153" overlay after
 *   clicking, the video owner has DISABLED embedding for that specific
 *   video. The only fix is to enable embedding in YouTube Studio:
 *   Content → click the video → Show more → Embedding → Allow embedding.
 *   This is enforced server-side by YouTube; nothing we can do on our end
 *   bypasses it. The "Watch on YouTube" link in the error is still clickable
 *   as a fallback.
 */
export function YouTubeCard({
  youtubeId,
  title,
  aspectClassName = "aspect-video",
  className = "",
}: YouTubeCardProps) {
  const [playing, setPlaying] = useState(false);
  // Try maxresdefault first (1280×720), fall back to hqdefault (480×360, always
  // exists). Some older / less-popular videos don't have maxres available.
  const [imgSrc, setImgSrc] = useState(
    `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  );

  if (playing) {
    return (
      <div className={`relative ${aspectClassName} bg-black ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`${title} — נגן וידאו`}
      className={`group relative block w-full ${aspectClassName} overflow-hidden bg-ink/10 cursor-pointer ${className}`}
    >
      {/* Thumbnail (uses plain <img> rather than next/image so we don't need
          remote-pattern config for img.youtube.com). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt=""
        loading="lazy"
        onError={() => {
          if (imgSrc.includes("maxresdefault")) {
            setImgSrc(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);
          }
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />

      {/* Soft darken on hover for play-button contrast */}
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />

      {/* Play button — YouTube's red rounded rectangle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-[#ff0000]/85 shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-16 md:w-24">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="h-7 w-7 md:h-8 md:w-8"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
