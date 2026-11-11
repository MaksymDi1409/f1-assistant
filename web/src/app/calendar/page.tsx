import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getSchedule } from "@/lib/f1/jolpica";
import { formatDateRange, getWeekendStart, toDate } from "@/lib/f1/format";
import { fmt } from "@/lib/i18n/format";
import { getDictionary, getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.calendar };
}

export default async function CalendarPage() {
  const [races, { locale, t: dict }] = await Promise.all([getSchedule(), getI18n()]);
  const now = Date.now();
  const nextRace = races.find((r) => toDate(r.date, r.time).getTime() > now);

  return (
    <>
      <PageHeader
        title={dict.pages.calendarTitle}
        description={fmt(dict.pages.calendarDescription, {
          season: races[0]?.season ?? "",
          count: races.length,
        })}
      />

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {races.map((race) => {
          const raceDate = toDate(race.date, race.time);
          const isPast = raceDate.getTime() < now;
          const isNext = race === nextRace;

          return (
            <li key={race.round}>
              <Link
                href={`/calendar/${race.season}/${race.round}`}
                className={`block h-full rounded-xl border p-4 transition-colors hover:border-accent/60 ${
                  isNext
                    ? "border-accent bg-accent/10"
                    : "border-line bg-surface"
                } ${isPast ? "opacity-50 hover:opacity-100" : ""}`}
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{fmt(dict.calendar.round, { round: race.round })}</span>
                  {isNext && (
                    <span className="font-semibold text-accent">{dict.calendar.next}</span>
                  )}
                  {isPast && <span>{dict.calendar.finished}</span>}
                </div>

                <h2 className="mt-1 font-semibold">{race.raceName}</h2>
                <p className="text-sm text-muted">
                  {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span>{formatDateRange(getWeekendStart(race), raceDate, locale)}</span>
                  {race.Sprint && (
                    <span className="rounded bg-subtle-strong px-1.5 py-0.5 text-xs">
                      {dict.calendar.sprint}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}