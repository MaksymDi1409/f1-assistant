import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDictionaryFor, type Dictionary } from "./dictionaries";

// Мова відвідувача:
// 1) вибрана вручну (cookie);
// 2) інакше — з заголовка Accept-Language, який браузер надсилає з кожним запитом
//    (це HTTP content negotiation: «я розумію en-US, en, uk...»);
// 3) інакше — українська
export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  // "en-US,en;q=0.9,uk;q=0.8" → ["en", "en", "uk"]
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());

  for (const language of preferred) {
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
});

export async function getDictionary(): Promise<Dictionary> {
  return getDictionaryFor(await getLocale());
}
