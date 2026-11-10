const DIRECTUS_URL = process.env.DIRECTUS_URL ?? "http://localhost:8055";

// Нова стаття з'являється на сайті не пізніше ніж за хвилину
const REVALIDATE_SECONDS = 60;

export type Category = {
  id: number;
  name: string;
  slug: string;
  color: string | null; // "#e10600"
};

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
};

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
  "category.slug",
  "category.color",
  "user_created.first_name",
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

  return directusFetch<Article[]>("/items/articles", {
    fields: LIST_FIELDS.join(","),
    filter: JSON.stringify(filter),
    sort: "-published_at,-date_created", // «-» означає «від нових до старих»
    limit: "50",
  });
}

export function getCategories(): Promise<Category[]> {
  return directusFetch<Category[]>("/items/categories", {
    fields: "id,name,slug,color",
    sort: "name",
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await directusFetch<Article[]>("/items/articles", {
    fields: [...LIST_FIELDS, "content"].join(","),
    filter: JSON.stringify({ _and: [PUBLISHED, { slug: { _eq: slug } }] }),
    limit: "1",
  });
  return articles[0] ?? null;
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
