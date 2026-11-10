import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/cms/directus";
import { getDriverStandings, getSchedule } from "@/lib/f1/jolpica";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// /sitemap.xml: перелік усіх сторінок сайту для пошукових систем.
// Генерується автоматично з тих самих джерел, що й сторінки: Jolpica і Directus
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Якщо якесь джерело недоступне, карта сайту все одно генерується, просто без цих сторінок
  const [races, standings, articles] = await Promise.all([
    getSchedule().catch(() => []),
    getDriverStandings().catch(() => []),
    getArticles().catch(() => []),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/chat",
    "/calendar",
    "/standings",
    "/drivers",
    "/teams",
    "/news",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.8,
  }));

  const racePages: MetadataRoute.Sitemap = races.map((race) => ({
    url: `${SITE_URL}/calendar/${race.season}/${race.round}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const driverPages: MetadataRoute.Sitemap = standings.map((s) => ({
    url: `${SITE_URL}/drivers/${s.Driver.driverId}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/news/${article.slug}`,
    lastModified: article.published_at ?? article.date_created,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...racePages, ...driverPages, ...articlePages];
}