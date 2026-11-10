const DIRECTUS_URL = process.env.DIRECTUS_URL ?? "http://localhost:8055";

// Нова стаття з'являється на сайті не пізніше ніж за хвилину
const REVALIDATE_SECONDS = 60;

export type Category = {
  id: number;
  name: string; // назва українською
  name_en: string | null; // назва англійською
  slug: string;
  color: string | null; // "#e10600"
};

export type ArticleLanguage = "uk" | "en";

export type Article = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  cover: string | null; // ID файлу в Directus
  published_at: string | null;
  date_created: string;
  category: Category | null; // зв'язок «багато статей → одна категорія» (Many-to-One)
  user_created: { first_name: string | null } | null; // автор — зв'язок з користувачем
  // Мова, якою статтю написано. Переклад на іншу мову робить ШІ,
  // і редактор може виправити його в CMS
  language: ArticleLanguage | null;
  title_uk: string | null;
  summary_uk: string | null;
  content_uk: string | null;
  title_en: string | null;
  summary_en: string | null;
  content_en: string | null;
};

// Мітка кешу статей: після перекладу скидаємо її, і переклад видно одразу
export const ARTICLES_CACHE_TAG = "articles";

const LIST_FIELDS = [
  "id",
  "title",
  "slug",
  "summary",
  "cover",
  "published_at",
  "date_created",
  // Поля пов'язаних записів Directus віддає в тому ж запиті, через крапку
  "category.id",
  "category.name",
  "category.name_en",
  "category.slug",
  "category.color",
  "user_created.first_name",
  "language",
  "title_uk",
  "summary_uk",
  "title_en",
  "summary_en",
];

// Лише опубліковані. Public-доступ у Directus і так це гарантує,
// але явний фільтр — другий рівень захисту (defense in depth)
const PUBLISHED = { status: { _eq: "published" } };

type CacheOptions = {
  revalidate?: number; // через скільки секунд оновлювати кеш
  tags?: string[]; // мітки, за якими кеш можна скинути вручну
};

export async function directusFetch<T>(
  path: string,
  params: Record<string, string> = {},
  { revalidate = REVALIDATE_SECONDS, tags }: CacheOptions = {},
): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const url = `${DIRECTUS_URL}${path}${query ? `?${query}` : ""}`;
  const res = await fetch(url, { next: { revalidate, tags } });

  if (!res.ok) {
    throw new Error(`Directus error ${res.status} for ${path}`);
  }

  const json = await res.json();
  return json.data as T;
}

// categorySlug — показати лише статті однієї категорії
export function getArticles(categorySlug?: string): Promise<Article[]> {
  const filter = categorySlug
    ? { _and: [PUBLISHED, { category: { slug: { _eq: categorySlug } } }] }
    : PUBLISHED;

  return directusFetch<Article[]>(
    "/items/articles",
    {
      fields: LIST_FIELDS.join(","),
      filter: JSON.stringify(filter),
      sort: "-published_at,-date_created", // «-» означає «від нових до старих»
      limit: "50",
    },
    { tags: [ARTICLES_CACHE_TAG] },
  );
}

export function getCategories(): Promise<Category[]> {
  return directusFetch<Category[]>("/items/categories", {
    fields: "id,name,name_en,slug,color",
    sort: "name",
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await directusFetch<Article[]>(
    "/items/articles",
    {
      fields: [...LIST_FIELDS, "content", "content_uk", "content_en"].join(","),
      filter: JSON.stringify({ _and: [PUBLISHED, { slug: { _eq: slug } }] }),
      limit: "1",
    },
    { tags: [ARTICLES_CACHE_TAG] },
  );
  return articles[0] ?? null;
}

// Категорія потрібною мовою: якщо англійської назви немає — українська
export function localizeCategory(category: Category, locale: ArticleLanguage): Category {
  return locale === "en" && category.name_en ? { ...category, name: category.name_en } : category;
}

// original — показуємо мову оригіналу, translated — переклад ШІ, missing — перекладу ще немає
export type TranslationStatus = "original" | "translated" | "missing";

export type LocalizedArticle = Article & {
  originalLanguage: ArticleLanguage;
  translationStatus: TranslationStatus;
};

// Стаття мовою сайту: оригінал, якщо мови збігаються; інакше переклад, якщо він є
export function localizeArticle(article: Article, locale: ArticleLanguage): LocalizedArticle {
  const originalLanguage: ArticleLanguage = article.language === "en" ? "en" : "uk";
  const category = article.category ? localizeCategory(article.category, locale) : null;
  const base = { ...article, category, originalLanguage };

  if (locale === originalLanguage) return { ...base, translationStatus: "original" };

  const translated =
    locale === "en"
      ? { title: article.title_en, summary: article.summary_en, content: article.content_en }
      : { title: article.title_uk, summary: article.summary_uk, content: article.content_uk };

  if (!translated.title) return { ...base, translationStatus: "missing" };

  return {
    ...base,
    title: translated.title,
    summary: translated.summary ?? article.summary,
    content: translated.content ?? article.content,
    translationStatus: "translated",
  };
}

// Стаття з токеном користувача — для перекладу (редактор бачить і чернетки)
export async function directusGetArticleForTranslation(
  accessToken: string,
  id: number,
): Promise<{
  title: string;
  summary: string | null;
  content: string | null;
  language: ArticleLanguage | null;
} | null> {
  const res = await fetch(
    `${DIRECTUS_URL}/items/articles/${id}?fields=title,summary,content,language`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return (await res.json()).data;
}

// Зберегти переклад токеном користувача: Directus сам перевірить,
// чи має редактор право змінювати цю статтю (лише свої)
export async function directusSaveArticleTranslation(
  accessToken: string,
  id: number,
  data: Record<string, string | null>,
): Promise<boolean> {
  const res = await fetch(`${DIRECTUS_URL}/items/articles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  return res.ok;
}

// Directus сам зменшує картинку і перетворює її на WebP
export function assetUrl(fileId: string, width: number): string {
  return `${DIRECTUS_URL}/assets/${fileId}?width=${width}&format=webp&quality=80`;
}
// Зміна налаштувань сайту від імені адміна. Directus сам перевіряє,
// що власник токена має право редагувати site_settings
export async function directusUpdateSettings(
  accessToken: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch(`${DIRECTUS_URL}/items/site_settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  return res.ok;
}

// ---------- Виправлення даних пілотів (лише з токеном адміна) ----------

function adminHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function findDriverOverrideId(
  accessToken: string,
  driverId: string,
): Promise<number | null> {
  const query = new URLSearchParams({
    filter: JSON.stringify({ driver_id: { _eq: driverId } }),
    fields: "id",
    limit: "1",
  });
  const res = await fetch(`${DIRECTUS_URL}/items/driver_overrides?${query}`, {
    headers: adminHeaders(accessToken),
    cache: "no-store", // тут потрібні актуальні дані, а не кеш
  });
  if (!res.ok) throw new Error(`Directus error ${res.status}`);
  const rows = (await res.json()).data as { id: number }[];
  return rows[0]?.id ?? null;
}

// Створити запис, якщо його ще немає, або оновити наявний (upsert)
export async function directusSaveDriverOverride(
  accessToken: string,
  driverId: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const id = await findDriverOverrideId(accessToken, driverId);

  const res = id
    ? await fetch(`${DIRECTUS_URL}/items/driver_overrides/${id}`, {
        method: "PATCH",
        headers: adminHeaders(accessToken),
        body: JSON.stringify(data),
        cache: "no-store",
      })
    : await fetch(`${DIRECTUS_URL}/items/driver_overrides`, {
        method: "POST",
        headers: adminHeaders(accessToken),
        body: JSON.stringify({ driver_id: driverId, ...data }),
        cache: "no-store",
      });

  return res.ok;
}

export async function directusDeleteDriverOverride(
  accessToken: string,
  driverId: string,
): Promise<boolean> {
  const id = await findDriverOverrideId(accessToken, driverId);
  if (!id) return true; // видаляти нічого

  const res = await fetch(`${DIRECTUS_URL}/items/driver_overrides/${id}`, {
    method: "DELETE",
    headers: adminHeaders(accessToken),
    cache: "no-store",
  });
  return res.ok;
}
