import type { Metadata } from "next";
import { Heebo, Amatic_SC } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { StructuredData } from "@/components/seo";
import { SITE_URL } from "@/lib/config";
import { routing } from "@/i18n/routing";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heebo",
  display: "swap",
});

const amaticSC = Amatic_SC({
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  variable: "--font-handwritten",
  display: "swap",
});

const SITE_NAME = "עלמה גוב";
const SITE_DESCRIPTION =
  "האתר הרשמי של עלמה גוב — שירים, מכתבים, הופעות ותמונות";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: "%s — עלמה גוב" },
    description: SITE_DESCRIPTION,
    openGraph: {
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: "he_IL",
      type: "website",
      images: [
        {
          url: "/images/alma-singing-purple.jpg",
          width: 1200,
          height: 630,
          alt: "עלמה גוב — הופעה חיה",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: ["/images/alma-singing-purple.jpg"],
    },
  };
}

const MUSIC_GROUP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  name: "Alma Gov",
  alternateName: "עלמה גוב",
  url: SITE_URL,
  sameAs: [
    "https://open.spotify.com/artist/5BwDD7OLlEuoLxt0cTHaYv",
    "https://www.instagram.com/alma.gov/",
    "https://www.youtube.com/@almagov1399",
    "https://almagov.bandcamp.com",
  ],
  genre: ["Indie Folk", "Indie Pop"],
  foundingLocation: {
    "@type": "Place",
    name: "Moshav Arugot, Israel",
  },
  member: {
    "@type": "Person",
    name: "Alma Gov",
    birthDate: "2002",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering with the requested locale
  setRequestLocale(locale);

  // dir is unconditionally "rtl" — Hebrew is the only supported locale.
  // (The `[locale]` URL segment is preserved purely for app-directory
  // shape stability; it never resolves to anything other than "he".)
  return (
    <html
      lang={locale}
      dir="rtl"
      className={`${heebo.variable} ${amaticSC.variable}`}
    >
      <body className="font-body antialiased">
        <StructuredData data={MUSIC_GROUP_SCHEMA} />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
