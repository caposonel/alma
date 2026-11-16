import { Metadata } from "next";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HandwrittenUnderline } from "@/components/ui";
import { Heart, Daisy } from "@/components/decorative";
import {
  EditableText,
  EditableLongText,
  EditableImage,
} from "@/components/admin/Editable";
import { patchDiaryFieldInline } from "@/app/admin/diary/actions";
import { getDiaryEntryBySlug, urlFor } from "@/lib/content";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

// Empty list = no pages built ahead of time; each one renders on its first
// visit and is then cached (ISR) like the rest of the site.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getDiaryEntryBySlug(slug);
  if (!entry) return { title: { absolute: "לא נמצא — עלמה גוב" } };

  const title = `${entry.title} — עלמה גוב`;
  const description = entry.excerpt || "מהיומן של עלמה גוב";
  const url = `${SITE_URL}/diary/${slug}`;

  // Prefer the admin-managed coverImage; fall back to staticImage; finally diary placeholder.
  const ogImage = entry.coverImage
    ? urlFor(entry.coverImage).width(1200).height(630).url()
    : entry.staticImage?.src ?? "/images/gallery-notebook.jpg";
  const ogAlt =
    entry.coverImage?.alt ?? entry.staticImage?.alt ?? entry.title;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "עלמה גוב",
      locale: "he_IL",
      type: "article",
      publishedTime: entry.date,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function DiaryEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = await getDiaryEntryBySlug(slug);
  if (!entry) notFound();

  const t = await getTranslations("diary");

  const coverUrl = entry.coverImage
    ? urlFor(entry.coverImage).width(800).height(500).url()
    : null;

  return (
    <main className="px-6 py-12">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/diary"
          className="mb-8 inline-block text-sm text-blush-500 transition-colors hover:text-blush-600"
        >
          {t("backToDiary")}
        </Link>

        <header className="mb-8">
          <EditableText
            id={`diary.${entry._id}.date`}
            label={`Date · ${entry.title}`}
            value={entry.date}
            save={patchDiaryFieldInline.bind(null, entry._id, "date")}
            hint="YYYY-MM-DD"
            as="div"
          >
            <p className="text-sm text-ink-soft">
              {new Date(entry.date).toLocaleDateString("he-IL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </EditableText>
          <EditableText
            id={`diary.${entry._id}.title`}
            label={`Diary title · ${entry.title}`}
            value={entry.title}
            save={patchDiaryFieldInline.bind(null, entry._id, "title")}
            as="div"
          >
            <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
              <HandwrittenUnderline>{entry.title}</HandwrittenUnderline>
              <Heart className="ms-2 inline-block h-4 w-4" />
            </h1>
          </EditableText>
        </header>

        {coverUrl ? (
          <EditableImage
            id={`diary.${entry._id}.coverImage`}
            label={`Cover image · ${entry.title}`}
            value={coverUrl}
            save={patchDiaryFieldInline.bind(null, entry._id, "coverImage")}
            as="div"
            className="mb-8"
          >
            <div className="overflow-hidden rounded-sm">
              <Image
                src={coverUrl}
                alt={entry.coverImage?.alt || entry.title}
                width={800}
                height={500}
                className="h-auto w-full object-cover"
              />
            </div>
          </EditableImage>
        ) : null}

        {/* Body wrapper renders even when empty so admins have a target to
            click in edit mode and fill it in. Public visitors see nothing
            extra (the wrapper renders children naked when edit mode is off,
            and an empty body shows no text). */}
        <EditableLongText
          id={`diary.${entry._id}.body`}
          label={`Diary body · ${entry.title}`}
          value={entry.body ?? ""}
          save={patchDiaryFieldInline.bind(null, entry._id, "body")}
          hint="Markdown: **bold**, *italic*, [link](https://…), > quote, lists."
          as="div"
        >
          {entry.body ? (
            <div className="prose-diary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {entry.body}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm text-ink-soft/40 italic">
              {/* Invisible to non-admins because the Editable wrapper only
                  renders the outline in edit mode. Acts as a "click here to
                  start writing" affordance in the preview iframe. */}
              (empty body)
            </div>
          )}
        </EditableLongText>

        <Daisy className="mx-auto mt-12 h-6 w-6 opacity-40" />
      </article>
    </main>
  );
}
