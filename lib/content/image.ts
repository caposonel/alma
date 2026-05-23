import type { ImageRef } from "./types";

const PLACEHOLDER = "/images/placeholder.jpg";

/**
 * Resolve any of the supported "image" shapes used across the site to a plain
 * URL string. The shapes are:
 *
 *  - string                  — already a public path / URL
 *  - { asset: { url } }      — KV-stored references that bundle a URL
 *  - null / undefined        — falls back to a placeholder
 *
 * Returns the placeholder image path when no usable URL can be derived.
 */
function resolveUrl(source: string | ImageRef | null | undefined): string {
  if (!source) return PLACEHOLDER;
  if (typeof source === "string") return source.length > 0 ? source : PLACEHOLDER;
  const url = source.asset?.url;
  return url && url.length > 0 ? url : PLACEHOLDER;
}

/**
 * Chainable image-URL builder used across the site.
 *
 * Designed as a drop-in replacement for the old Sanity `urlFor()` helper.
 * Call sites look like `urlFor(img).width(400).height(300).url()` —
 * with KV-backed content there is nothing to transform (the stored URL is
 * already a public path) so the chain just returns the underlying URL.
 *
 * Width / height are accepted (and ignored) purely to preserve the existing
 * call-site shape.
 */
export interface ImageUrlBuilder {
  width(_width: number): ImageUrlBuilder;
  height(_height: number): ImageUrlBuilder;
  url(): string;
}

export function urlFor(
  source: string | ImageRef | null | undefined
): ImageUrlBuilder {
  const url = resolveUrl(source);
  const builder: ImageUrlBuilder = {
    width: () => builder,
    height: () => builder,
    url: () => url,
  };
  return builder;
}
