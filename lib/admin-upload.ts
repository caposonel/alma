import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Upload abstraction for admin-panel image uploads.
 *
 * - In production (`BLOB_READ_WRITE_TOKEN` set) → Vercel Blob, returns a
 *   permanent CDN URL.
 * - In local dev (no token) → writes to `public/uploads/` (gitignored). The
 *   returned URL is a same-origin path like `/uploads/abc-foo.jpg`.
 *
 * Both branches return the same `UploadResult` shape so callers don't care
 * which backend ran.
 */

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const LOCAL_UPLOAD_PUBLIC_BASE = "/uploads";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface UploadResult {
  /** Public URL — use as `src` in `<Image />` / `<img>`. */
  url: string;
  /** Filename or blob key. Stored so future delete operations can target it. */
  pathname: string;
}

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/**
 * Sniff the first few bytes of a buffer to determine its real image type.
 * The browser-reported `file.type` is trusted by callers, but a malicious
 * client can lie — this checks the actual file signature so a renamed
 * `.exe` claiming to be `image/jpeg` is rejected.
 *
 * Returns null if the bytes don't match any allowed image format.
 */
function sniffImageType(buf: Buffer): AllowedMimeType | null {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  // GIF: "GIF87a" or "GIF89a"
  if (
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return "image/gif";
  }
  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Validate a file before uploading. Throws `UploadValidationError` on failure.
 * Caller is expected to surface the error message to the user.
 *
 * Performs the cheap size + browser-reported-MIME checks. The magic-byte
 * sniff happens inside `uploadImage` once the bytes are in memory, since
 * a `File` doesn't expose its content synchronously.
 */
export function validateUpload(file: File): void {
  if (file.size === 0) {
    throw new UploadValidationError("File is empty");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError(
      `File too large (max ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB)`
    );
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new UploadValidationError(
      `Unsupported file type "${file.type || "unknown"}" — allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }
}

/**
 * Upload a file. Validates first, sniffs the actual magic bytes (so a
 * client lying about `file.type` can't slip a non-image through), then
 * dispatches to Blob or the local fallback based on env. Returns the
 * public URL of the stored asset.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  validateUpload(file);

  // Magic-byte sniff — defence against a client that sets `file.type =
  // "image/jpeg"` on a non-image. The serving side will use whatever
  // MIME we hand to the Blob, so this guards both storage AND egress.
  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffedType = sniffImageType(buffer);
  if (!sniffedType) {
    throw new UploadValidationError(
      "File content doesn't match an allowed image format (jpeg/png/webp/gif)"
    );
  }
  if (sniffedType !== file.type) {
    throw new UploadValidationError(
      `File extension/MIME mismatch — claimed "${file.type}", actual "${sniffedType}"`
    );
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const filename = `${randomUUID()}-${sanitizeFilename(file.name)}`;
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: sniffedType,
    });
    return { url: blob.url, pathname: blob.pathname };
  }

  // Local fallback — write into public/uploads/ (gitignored).
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}-${sanitizeFilename(file.name)}`;
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return {
    url: `${LOCAL_UPLOAD_PUBLIC_BASE}/${filename}`,
    pathname: filename,
  };
}

function sanitizeFilename(name: string): string {
  // Lowercase, collapse non-[a-z0-9.-] runs into a single hyphen, trim
  // leading/trailing hyphens, and cap length so absurdly long names don't
  // explode the blob key.
  const cleaned =
    name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120) || "image";
  return cleaned;
}
