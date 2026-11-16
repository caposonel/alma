import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Branded 404 rendered inside the site layout (header, footer, fonts). */
export default async function SiteNotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        className="mb-6 text-blush-400"
        aria-hidden="true"
      >
        <path
          d="M24 42s-18-10.2-18-22.8C6 12.36 11.16 6 18 6c3.78 0 6.84 2.04 6 2.04S30.24 6 30 6c6.84 0 12 6.36 12 13.2C42 31.8 24 42 24 42z"
          fill="currentColor"
        />
      </svg>
      <h1 className="font-display text-4xl text-ink">{t("heading")}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{t("subtitle")}</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-blush-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blush-700"
      >
        {t("home")}
      </Link>
    </main>
  );
}
