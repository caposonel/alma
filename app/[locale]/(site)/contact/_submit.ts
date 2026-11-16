"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { addMessage } from "@/lib/admin-store";

/**
 * Public-facing server action for the contact form.
 *
 * - Validates input with zod.
 * - Silently swallows honeypot submissions (so bots don't retry).
 * - Light per-IP rate limit (in-memory; resets on cold start — fine for a
 *   low-volume site).
 * - Stores hashed IP only, never raw.
 *
 * Errors are returned as discriminated strings so the client form can map
 * them to localized messages.
 */

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(10).max(5000),
  // Honeypot field — bots will fill this in, humans won't see it.
  website: z.string().optional(), // honeypot: checked below, not rejected here
});

// Simple in-memory rate limit. Resets on cold start, fine for low-volume site.
const submissions = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 submissions per IP per hour

export type SubmitErrorCode = "validation" | "rate-limit" | "storage";

export interface SubmitResult {
  ok: boolean;
  error?: SubmitErrorCode;
}

export async function submitContactMessage(
  input: Record<string, unknown>
): Promise<SubmitResult> {
  // Parse + validate
  const result = schema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: "validation" };
  }

  // Honeypot — silently succeed so bots don't retry.
  if (result.data.website) {
    return { ok: true };
  }

  // Rate limit by hashed IP.
  const hdrs = await headers();
  const rawIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const recent = (submissions.get(rawIp) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    return { ok: false, error: "rate-limit" };
  }
  recent.push(now);
  submissions.set(rawIp, recent);

  // Store.
  try {
    await addMessage({
      name: result.data.name,
      email: result.data.email,
      subject: result.data.subject,
      body: result.data.message,
      ip: hashIp(rawIp),
    });
    return { ok: true };
  } catch (err) {
    console.error("Failed to store contact message:", err);
    return { ok: false, error: "storage" };
  }
}

function hashIp(ip: string): string {
  // Lightweight hash to avoid storing raw IPs. Not cryptographic, just
  // privacy-friendly so we can tell repeat senders apart without retaining PII.
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h |= 0;
  }
  return `ip_${Math.abs(h).toString(36)}`;
}
