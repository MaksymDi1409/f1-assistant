import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import CategoryBadge from "@/components/news/CategoryBadge";
import { assetUrl, getArticleBySlug, type Article } from "@/lib/cms/directus";
import { formatDate } from "@/lib/f1/format";

type Props = PageProps<"/news/[slug]">;

async function loadArticle(params: Props["params"]): Promise<Article> {
  const { slug } = await params;

  // Slug у Directus: малі латинські літери, цифри та дефіси
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return article;
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
  const article = await loadArticle(params);

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/news" className="text-sm text-muted hover:text-foreground">
        ← Новини
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        {article.category && <CategoryBadge category={article.category} asLink />}
        <span>{formatDate(article.published_at ?? article.date_created)}</span>
        {article.user_created?.first_name && <span>· Автор: {article.user_created.first_name}</span>}
      </div>
      <h1 className="mt-1 text-4xl font-bold tracking-tight">{article.title}</h1>
      {article.summary && (
        <p className="mt-3 text-lg text-muted">{article.summary}</p>
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