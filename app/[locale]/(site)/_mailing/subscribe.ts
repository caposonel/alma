"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { addSubscriber } from "@/lib/admin-store";

/**
 * Public-facing server action for the mailing-list signup bar.
 *
 * Mirrors the contact form pattern (`_submit.ts`):
 *  - Zod-validated, with a honeypot field that silently succeeds.
 *  - Light in-memory per-IP rate limit (resets on cold start).
 *  - Only the hashed IP is stored, never the raw value.
 *  - addSubscriber() is idempotent — re-submitting an already-subscribed
 *    email returns `ok: true` without throwing.
 */

const schema = z.object({
  email: z.string().trim().email().max(200),
  country: z.string().trim().max(100).optional(),
  // Honeypot — bots fill every field, humans don't see this one.
  website: z.string().optional(), // honeypot: checked below, not rejected here
});

// In-memory rate limit. Resets on cold start; fine for a low-volume site.
const submissions = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_HOUR = 3;

export type SubscribeErrorCode = "validation" | "rate-limit" | "storage";

export interface SubscribeResult {
  ok: boolean;
  error?: SubscribeErrorCode;
}

function hashIp(ip: string): string {
  // Lightweight non-cryptographic hash, same approach as the contact form.
  // Privacy-friendly: lets us tell repeat senders apart without retaining PII.
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h |= 0;
  }
  return `ip_${Math.abs(h).toString(36)}`;
}

export async function subscribeAction(
  input: Record<string, unknown>
): Promise<SubscribeResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation" };
  }

  // Honeypot — silently succeed so bots don't retry.
  if (parsed.data.website) {
    return { ok: true };
  }

  const hdrs = await headers();
  const rawIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const recent = (submissions.get(rawIp) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );
  if (recent.length >= MAX_PER_HOUR) {
    return { ok: false, error: "rate-limit" };
  }
  recent.push(now);
  submissions.set(rawIp, recent);

  try {
    await addSubscriber({
      email: parsed.data.email,
      country: parsed.data.country,
      ip: hashIp(rawIp),
    });
    return { ok: true };
  } catch (err) {
    console.error("Failed to add subscriber:", err);
    return { ok: false, error: "storage" };
  }
}
