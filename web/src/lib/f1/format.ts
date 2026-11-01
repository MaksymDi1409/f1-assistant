// Jolpica віддає дату і час окремо в UTC: "2026-03-08" + "05:00:00Z"
import type { Session } from "./types";
export function toDate(date: string, time?: string): Date {
  return new Date(`${date}T${time ?? "00:00:00Z"}`);
}

const dayMonthFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Kyiv",
});

export function formatDayMonth(date: Date): string {
  return dayMonthFormatter.format(date); // "8 березня"
}

const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Kyiv",
});

// Для старих сезонів Jolpica не має часу, тоді показуємо тільки дату
export function formatSession(session: Session): string {
  const date = toDate(session.date, session.time);
  return session.time ? dateTimeFormatter.format(date) : formatDayMonth(date);
}