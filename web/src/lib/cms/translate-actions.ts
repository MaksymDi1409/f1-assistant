"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { translateArticle } from "@/lib/ai/translate";
import { ACCESS_COOKIE, getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import {
  ARTICLES_CACHE_TAG,
  directusGetArticleForTranslation,
  directusSaveArticleTranslation,
} from "./directus";
import { getSiteSettings } from "./settings";

export type TranslateResult = { ok: true } | { ok: false; error: string };

// Автопереклад статті через ШІ на іншу мову: українська ↔ англійська.
// Доступно редактору і адміну
export async function translateArticleAction(articleId: number): Promise<TranslateResult> {
  const dict = await getDictionary();
  const errors = dict.admin.errors;

  const user = await getCurrentUser();
  if (user?.role !== "editor" && user?.role !== "admin") {
    return { ok: false, error: errors.translateForbidden };
  }

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) return { ok: false, error: dict.common.sessionExpired };

  if (!Number.isInteger(articleId) || articleId <= 0) {
    return { ok: false, error: errors.invalidArticle };
  }

  const original = await directusGetArticleForTranslation(accessToken, articleId);
  if (!original) return { ok: false, error: errors.articleNotFound };

  // Напрямок перекладу залежить від мови оригіналу
  const from = original.language === "en" ? "en" : "uk";
  const to = from === "en" ? "uk" : "en";

  // Моделі — ті самі, що адмін вибрав для чату (або з .env.local)
  const settings = await getSiteSettings();
  const models = settings.ai_models.length
    ? settings.ai_models
    : (process.env.GEMINI_MODELS ?? "gemini-2.5-flash")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

  let translation;
  try {
    translation = await translateArticle(original, from, to, models);
  } catch (error) {
    console.error("Translation error:", error);
    return { ok: false, error: errors.translateFailed };
  }

  // Зберігаємо в поля цільової мови (title_en або title_uk) токеном користувача:
  // редактор може змінювати лише свої статті
  const saved = await directusSaveArticleTranslation(accessToken, articleId, {
    [`title_${to}`]: translation.title,
    [`summary_${to}`]: translation.summary,
    [`content_${to}`]: translation.content,
  });
  if (!saved) return { ok: false, error: errors.translateSaveFailed };

  updateTag(ARTICLES_CACHE_TAG);
  return { ok: true };
}
