// Мови сайту. Файл без серверного коду: його можна імпортувати і в браузер
export const LOCALES = ["uk", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uk";
export const LOCALE_COOKIE = "f1_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
