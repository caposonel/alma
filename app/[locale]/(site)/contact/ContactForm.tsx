"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "@/components/decorative";
import { cn } from "@/lib/utils";
import { submitContactMessage } from "./_submit";
import { HONEYPOT_STYLE } from "@/lib/honeypot";

/**
 * Tailwind class string for a form input whose validation failed.
 * Overrides border + focus ring color to red, while preserving the base
 * `.form-input` styles in globals.css.
 */
const errorInputClasses =
  "border-red-400 focus:border-red-400 focus:ring-red-200 focus:shadow-[0_0_0_2px_rgba(248,113,113,0.18)]";

export function ContactForm() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Build the schema with translated error messages
  const schema = useMemo(
    () =>
      // Same rules as the server (_submit.ts), so anything the browser
      // accepts the server accepts too — and errors land on the right field
      // instead of a generic "check all fields".
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("formErrorName"))
          .max(100, t("formErrorTooLong")),
        email: z
          .string()
          .trim()
          .email(t("formErrorEmail"))
          .max(200, t("formErrorTooLong")),
        subject: z
          .string()
          .trim()
          .min(1, t("formErrorSubject"))
          .max(200, t("formErrorTooLong")),
        message: z
          .string()
          .trim()
          .min(10, t("formErrorMessage"))
          .max(5000, t("formErrorMessageTooLong")),
        // Honeypot. Not validated here: if autofill ever fills it, the
        // server quietly accepts and drops the submission.
        website: z.string().optional(),
      }),
    [t]
  );
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    try {
      const result = await submitContactMessage(data);
      if (result.ok) {
        setSubmitted(true);
        return;
      }
      switch (result.error) {
        case "validation":
          setError(t("formErrorValidation"));
          break;
        case "rate-limit":
          setError(t("formErrorRateLimit"));
          break;
        case "storage":
          setError(t("formErrorStorage"));
          break;
        default:
          setError(t("formErrorGeneric"));
      }
    } catch {
      setError(t("formErrorGeneric"));
    }
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <Heart className="mx-auto mb-4 h-6 w-6" />
        <p className="font-display text-xl text-blush-500">{t("formThanks")}</p>
        <p className="mt-2 text-sm text-ink-soft">
          {t("formThanksDetail")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Honeypot — visually hidden off-screen, accessible to bots that fill
          every field but invisible to humans. Not `display:none` so bots see
          it and DO fill it; submissions with this field set are silently
          ignored server-side. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        {...register("website")}
        style={HONEYPOT_STYLE}
      />

      <Field id="contact-name" label={t("formName")} error={errors.name?.message}>
        <input
          {...register("name")}
          id="contact-name"
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          aria-invalid={errors.name ? "true" : undefined}
          className={cn("form-input", errors.name && errorInputClasses)}
          placeholder={t("formNamePlaceholder")}
        />
      </Field>

      <Field id="contact-email" label={t("formEmail")} error={errors.email?.message}>
        <input
          {...register("email")}
          id="contact-email"
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          type="email"
          dir="ltr"
          aria-invalid={errors.email ? "true" : undefined}
          className={cn("form-input text-end", errors.email && errorInputClasses)}
          placeholder={t("formEmailPlaceholder")}
        />
      </Field>

      <Field id="contact-subject" label={t("formSubject")} error={errors.subject?.message}>
        <input
          {...register("subject")}
          id="contact-subject"
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          aria-invalid={errors.subject ? "true" : undefined}
          className={cn("form-input", errors.subject && errorInputClasses)}
          placeholder={t("formSubjectPlaceholder")}
        />
      </Field>

      <Field id="contact-message" label={t("formMessage")} error={errors.message?.message}>
        <textarea
          {...register("message")}
          id="contact-message"
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          rows={5}
          aria-invalid={errors.message ? "true" : undefined}
          className={cn("form-input resize-none", errors.message && errorInputClasses)}
          placeholder={t("formMessagePlaceholder")}
        />
      </Field>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-blush-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blush-700 disabled:opacity-50"
      >
        {isSubmitting ? t("formSubmitting") : t("formSubmit")}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
