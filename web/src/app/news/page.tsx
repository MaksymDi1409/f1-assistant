import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { assetUrl, getArticles, type Article } from "@/lib/cms/directus";
import { formatDate } from "@/lib/f1/format";

export const metadata: Metadata = { title: "Новини" };

export default async function NewsPage() {
  let articles: Article[] | null = null;
  try {
    articles = await getArticles();
  } catch (error) {
    // CMS не працює: сторінка відкривається з повідомленням, а не падає
    console.warn("CMS unavailable:", error);
  }

  return (
    <>
      <PageHeader title="Новини" description="Статті та новини" />

      {articles === null && (
        <p className="text-muted">Новини тимчасово недоступні.</p>
      )}

      {articles?.length === 0 && (
        <p className="text-muted">Поки що немає жодної статті.</p>
      )}

      {articles && articles.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/news/${a.slug}`}
                className="group block h-full overflow-hidden rounded-xl border border-white/10 bg-surface transition-colors hover:border-accent/60"
              >
                {a.cover ? (
                  // Картинку вже оптимізує Directus, тож звичайного <img> достатньо
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assetUrl(a.cover, 640)}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="aspect-video w-full bg-white/5" />
                )}

                <div className="p-4">
                  <p className="text-xs text-muted">
                    {formatDate(a.published_at ?? a.date_created)}
                  </p>
                  <h2 className="mt-1 font-semibold group-hover:text-accent">
                    {a.title}
                  </h2>
                  {a.summary && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{a.summary}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}