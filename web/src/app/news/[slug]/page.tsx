import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import CategoryBadge from "@/components/news/CategoryBadge";
import TranslateArticleButton from "@/components/news/TranslateArticleButton";
import { getCurrentUser } from "@/lib/auth/session";
import {
  assetUrl,
  getArticleBySlug,
  localizeArticle,
  type LocalizedArticle,
} from "@/lib/cms/directus";
import { formatDate } from "@/lib/f1/format";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

type Props = PageProps<"/news/[slug]">;

async function loadArticle(params: Props["params"]): Promise<LocalizedArticle> {
  const { slug } = await params;

  // Slug у Directus: малі латинські літери, цифри та дефіси
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();

  const [article, { locale }] = await Promise.all([getArticleBySlug(slug), getI18n()]);
  if (!article) notFound();

  return localizeArticle(article, locale);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await loadArticle(params);
  const description = article.summary ?? undefined;

  return {
    title: article.title,
    description,
    // Як стаття виглядатиме, коли нею поділяться в Telegram, Facebook тощо
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: article.cover ? [assetUrl(article.cover, 1200)] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const [article, { locale, t: dict }, user] = await Promise.all([
    loadArticle(params),
    getI18n(),
    getCurrentUser(),
  ]);
  const t = dict.news;

  // Автопереклад доступний редактору й адміну; переклад іде на мову, протилежну оригіналу
  const canTranslate = user?.role === "editor" || user?.role === "admin";
  const targetLanguage = article.originalLanguage === "en" ? "uk" : "en";
  const hasTranslation = Boolean(
    targetLanguage === "en" ? article.title_en : article.title_uk,
  );
  const target = t.targetLanguage[targetLanguage];

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/news" className="text-sm text-muted hover:text-foreground">
        {t.back}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        {article.category && <CategoryBadge category={article.category} asLink />}
        <span>{formatDate(article.published_at ?? article.date_created, locale)}</span>
        {article.user_created?.first_name && (
          <span>
            · {t.author}: {article.user_created.first_name}
          </span>
        )}
      </div>

      <h1 className="mt-2 text-4xl font-bold tracking-tight">{article.title}</h1>
      {article.summary && <p className="mt-3 text-lg text-muted">{article.summary}</p>}

      {/* Чесно позначаємо машинний переклад або те, що перекладу ще немає */}
      {article.translationStatus !== "original" && (
        <p className="mt-4 rounded-lg border border-line bg-subtle px-3 py-2 text-xs text-muted">
          {article.translationStatus === "translated" ? `🌐 ${t.machineTranslated}` : t.notTranslated}
        </p>
      )}

      {canTranslate && (
        <div className="mt-4">
          <TranslateArticleButton
            articleId={article.id}
            hasTranslation={hasTranslation}
            labels={{
              translate: fmt(t.translate, { target }),
              retranslate: fmt(t.retranslate, { target }),
              translating: t.translating,
              translated: t.translated,
            }}
          />
        </div>
      )}

      {article.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(article.cover, 1200)}
          alt=""
          className="mt-6 aspect-video w-full rounded-xl object-cover"
        />
      )}

      {article.content && (
        <div className="article-content mt-8">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      )}
    </article>
  );
}
