import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getSchedule } from "@/lib/f1/jolpica";
import { formatDayMonth, toDate } from "@/lib/f1/format";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Календар" };

export default async function CalendarPage() {
  const [races, dict] = await Promise.all([getSchedule(), getDictionary()]);
  const now = Date.now();
  const nextRace = races.find((r) => toDate(r.date, r.time).getTime() > now);

  return (
    <>
      <PageHeader
        title={dict.pages.calendarTitle}
        description={dict.pages.calendarDescription(races[0]?.season ?? "", races.length)}
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
                  <span>Етап {race.round}</span>
                  {isNext && (
                    <span className="font-semibold text-accent">Наступна</span>
                  )}
                  {isPast && <span>Завершено</span>}
                </div>

                <h2 className="mt-1 font-semibold">{race.raceName}</h2>
                <p className="text-sm text-muted">
                  {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span>{formatDayMonth(raceDate)}</span>
                  {race.Sprint && (
                    <span className="rounded bg-subtle-strong px-1.5 py-0.5 text-xs">
                      Спринт
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