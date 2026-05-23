"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "@/components/decorative";
import { cn } from "@/lib/utils";
import { submitContactMessage } from "./_submit";

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
      z.object({
        name: z.string().min(1, t("formErrorName")),
        email: z.string().email(t("formErrorEmail")),
        subject: z.string().min(1, t("formErrorSubject")),
        message: z.string().min(10, t("formErrorMessage")),
        // Honeypot — must be empty. Real users never see this field.
        website: z.string().max(0).optional(),
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
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
        }}
      />

      <Field label={t("formName")} error={errors.name?.message}>
        <input
          {...register("name")}
          aria-invalid={errors.name ? "true" : undefined}
          className={cn("form-input", errors.name && errorInputClasses)}
          placeholder={t("formNamePlaceholder")}
        />
      </Field>

      <Field label={t("formEmail")} error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          dir="ltr"
          aria-invalid={errors.email ? "true" : undefined}
          className={cn("form-input text-end", errors.email && errorInputClasses)}
          placeholder={t("formEmailPlaceholder")}
        />
      </Field>

      <Field label={t("formSubject")} error={errors.subject?.message}>
        <input
          {...register("subject")}
          aria-invalid={errors.subject ? "true" : undefined}
          className={cn("form-input", errors.subject && errorInputClasses)}
          placeholder={t("formSubjectPlaceholder")}
        />
      </Field>

      <Field label={t("formMessage")} error={errors.message?.message}>
        <textarea
          {...register("message")}
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
        className="w-full rounded-full bg-blush-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blush-600 disabled:opacity-50"
      >
        {isSubmitting ? t("formSubmitting") : t("formSubmit")}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
