"use client";

import { useTranslations } from "next-intl";

export default function SiteError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      {/* decorative heart */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6 text-blush-400"
        aria-hidden="true"
      >
        <path
          d="M24 42s-18-10.2-18-22.8C6 12.36 11.16 6 18 6c3.78 0 6.84 2.04 6 2.04S30.24 6 30 6c6.84 0 12 6.36 12 13.2C42 31.8 24 42 24 42z"
          fill="currentColor"
        />
      </svg>

      <h1 className="font-display text-3xl text-ink">{t("title")}</h1>

      <p className="mt-3 max-w-md text-ink-soft">{t("subtitle")}</p>

      <button
        onClick={() => reset()}
        className="mt-8 rounded-full bg-blush-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blush-700"
      >
        {t("retry")}
      </button>
    </div>
  );
}
