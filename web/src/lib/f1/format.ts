import type { Session } from "./types";

type Locale = "uk" | "en";

// Формати дат для кожної мови. Створюються один раз: Intl.DateTimeFormat — відносно «дорогий» об'єкт
const LOCALE_TAGS: Record<Locale, string> = { uk: "uk-UA", en: "en-GB" };
const TIME_ZONE = "Europe/Kyiv";

function makeFormatters(tag: string) {
  return {
    dayMonth: new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", timeZone: TIME_ZONE }),
    dateTime: new Intl.DateTimeFormat(tag, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIME_ZONE,
    }),
    full: new Intl.DateTimeFormat(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    }),
  };
}

const formatters = {
  uk: makeFormatters(LOCALE_TAGS.uk),
  en: makeFormatters(LOCALE_TAGS.en),
};

// Jolpica віддає дату і час окремо в UTC: "2026-03-08" + "05:00:00Z"
export function toDate(date: string, time?: string): Date {
  return new Date(`${date}T${time ?? "00:00:00Z"}`);
}

// "8 березня" / "8 March"
export function formatDayMonth(date: Date, locale: Locale = "uk"): string {
  return formatters[locale].dayMonth.format(date);
}

// Для старих сезонів Jolpica не має часу, тоді показуємо тільки дату
export function formatSession(session: Session, locale: Locale = "uk"): string {
  const date = toDate(session.date, session.time);
  return session.time
    ? formatters[locale].dateTime.format(date)
    : formatDayMonth(date, locale);
}

export function getAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();

  const hadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());

  return hadBirthdayThisYear ? age : age - 1;
}

// "7 листопада 2026 р." / "7 November 2026"
export function formatDate(iso: string, locale: Locale = "uk"): string {
  return formatters[locale].full.format(new Date(iso));
}