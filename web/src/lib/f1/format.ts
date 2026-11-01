// Jolpica віддає дату і час окремо в UTC: "2026-03-08" + "05:00:00Z"
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