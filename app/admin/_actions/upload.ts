"use server";

import { auth } from "@/auth";
import {
  uploadImage,
  UploadValidationError,
} from "@/lib/admin-upload";

/**
 * Shape returned to the client `FileUpload` component. `ok` is always present;
 * on success `url` is the public path to use as an image src, on failure
 * `error` is a human-readable message safe to render in the UI.
 */
export interface UploadActionResult {
  ok: boolean;
  url?: string;
  pathname?: string;
  error?: string;
}

/**
 * Server action invoked by `<FileUpload />` when the user picks a file.
 *
 * Requires an authenticated admin session — without one the action returns
 * `{ ok: false, error: "Unauthorized" }` so a leaked endpoint can't write
 * arbitrary files.
 *
 * Validation lives in `lib/admin-upload` so the same rules apply to any other
 * caller. We only translate `UploadValidationError` into a structured error
 * response; everything else is logged and returned as a generic failure.
 */
export async function uploadImageAction(
  formData: FormData
): Promise<UploadActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided" };
  }

  try {
    const result = await uploadImage(file);
    return { ok: true, url: result.url, pathname: result.pathname };
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("[admin] image upload failed:", err);
    return { ok: false, error: "Upload failed — please try again" };
  }
}
