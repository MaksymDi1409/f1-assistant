"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { translateArticleToEnglish } from "@/lib/ai/translate";
import { ACCESS_COOKIE, getCurrentUser } from "@/lib/auth/session";
import {
  ARTICLES_CACHE_TAG,
  directusGetArticleForTranslation,
  directusSaveArticleTranslation,
} from "./directus";
import { getSiteSettings } from "./settings";

export type TranslateResult = { ok: true } | { ok: false; error: string };

// Автопереклад статті через ШІ. Доступно редактору і адміну
export async function translateArticleAction(articleId: number): Promise<TranslateResult> {
  const user = await getCurrentUser();
  if (user?.role !== "editor" && user?.role !== "admin") {
    return { ok: false, error: "Перекладати можуть лише редактори й адміністратори" };
  }

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) return { ok: false, error: "Сесія закінчилась, увійди знову" };

  if (!Number.isInteger(articleId) || articleId <= 0) {
    return { ok: false, error: "Некоректна стаття" };
  }

  const original = await directusGetArticleForTranslation(accessToken, articleId);
  if (!original) return { ok: false, error: "Статтю не знайдено" };

  // Моделі — ті самі, що адмін вибрав для чату (або з .env.local)
  const settings = await getSiteSettings();
  const models = settings.ai_models.length
    ? settings.ai_models
    : (process.env.GEMINI_MODELS ?? "gemini-2.5-flash").split(",").map((m) => m.trim()).filter(Boolean);

  let translation;
  try {
    translation = await translateArticleToEnglish(original, models);
  } catch (error) {
    console.error("Translation error:", error);
    return { ok: false, error: "ШІ не зміг перекласти статтю, спробуй пізніше" };
  }

  // Зберігаємо токеном користувача: редактор може змінювати лише свої статті
  const saved = await directusSaveArticleTranslation(accessToken, articleId, {
    title_en: translation.title,
    summary_en: translation.summary,
    content_en: translation.content,
  });
  if (!saved) {
    return { ok: false, error: "Directus не дозволив зберегти переклад (можна лише свої статті)" };
  }

  updateTag(ARTICLES_CACHE_TAG);
  return { ok: true };
}
