const DIRECTUS_URL = process.env.DIRECTUS_URL ?? "http://localhost:8055";

// Нова стаття з'являється на сайті не пізніше ніж за хвилину
const REVALIDATE_SECONDS = 60;

export type Article = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  cover: string | null; // ID файлу в Directus
  published_at: string | null;
  date_created: string;
};

const LIST_FIELDS = ["id", "title", "slug", "summary", "cover", "published_at", "date_created"];

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

export function getArticles(): Promise<Article[]> {
  return directusFetch<Article[]>("/items/articles", {
    fields: LIST_FIELDS.join(","),
    filter: JSON.stringify(PUBLISHED),
    sort: "-published_at,-date_created", // «-» означає «від нових до старих»
    limit: "50",
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
