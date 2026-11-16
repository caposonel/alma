import { notFound } from "next/navigation";

/**
 * Catch-all for unknown URLs so they render the branded 404
 * (`../not-found.tsx`) inside the site layout, instead of Next's bare
 * default page with no header, styling or `<html lang>`.
 */
export default function CatchAll() {
  notFound();
}
