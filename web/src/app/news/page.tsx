import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import CategoryBadge from "@/components/news/CategoryBadge";
import {
  assetUrl,
  getArticles,
  getCategories,
  type Article,
  type Category,
} from "@/lib/cms/directus";
import { formatDate } from "@/lib/f1/format";

export const metadata: Metadata = { title: "Новини" };

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const { category } = await searchParams;

  // ?category=races — лише статті цієї категорії (slug перевіряємо, як і завжди)
  const categorySlug =
    typeof category === "string" && /^[a-z0-9-]+$/.test(category) ? category : undefined;

  let articles: Article[] | null = null;
  let categories: Category[] = [];
  try {
    [articles, categories] = await Promise.all([
      getArticles(categorySlug),
      getCategories().catch(() => []), // без категорій список статей однаково показуємо
    ]);
  } catch (error) {
    // CMS не працює: сторінка відкривається з повідомленням, а не падає
    console.warn("CMS unavailable:", error);
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <>
      <PageHeader
        title={activeCategory ? `Новини: ${activeCategory.name}` : "Новини"}
        description="Статті та новини"
      />

      {categories.length > 0 && (
        <nav aria-label="Категорії" className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/news"
            className={`rounded-full px-3 py-1 text-sm ${
              !categorySlug ? "bg-accent text-on-accent" : "border border-line hover:bg-subtle"
            }`}
          >
            Усі
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/news?category=${c.slug}`}
              className={`rounded-full px-3 py-1 text-sm ${
                c.slug === categorySlug
                  ? "bg-accent text-on-accent"
                  : "border border-line hover:bg-subtle"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {articles === null && <p className="text-muted">Новини тимчасово недоступні.</p>}

      {articles?.length === 0 && (
        <p className="text-muted">
          {categorySlug ? "У цій категорії поки немає статей." : "Поки що немає жодної статті."}
        </p>
      )}

      {articles && articles.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/news/${a.slug}`}
                className="group block h-full overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-accent/60"
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
                  <div className="aspect-video w-full bg-subtle" />
                )}

                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    {/* Тут бейдж без посилання: посилання всередині посилання заборонене в HTML */}
                    {a.category && <CategoryBadge category={a.category} />}
                    <span>{formatDate(a.published_at ?? a.date_created)}</span>
                  </div>
                  <h2 className="mt-2 font-semibold group-hover:text-accent">{a.title}</h2>
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
