import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { getSchedule } from "@/lib/f1/jolpica";
import { formatDayMonth, toDate } from "@/lib/f1/format";

export const metadata: Metadata = { title: "Календар" };

export default async function CalendarPage() {
  const races = await getSchedule();
  const now = Date.now();
  const nextRace = races.find((r) => toDate(r.date, r.time).getTime() > now);

  return (
    <>
      <PageHeader
        title="Календар"
        description={`Сезон ${races[0]?.season ?? ""} · ${races.length} етапів`}
      />

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {races.map((race) => {
          const raceDate = toDate(race.date, race.time);
          const isPast = raceDate.getTime() < now;
          const isNext = race === nextRace;

          return (
            <li
              key={race.round}
              className={`rounded-xl border p-4 ${
                isNext
                  ? "border-accent bg-accent/10"
                  : "border-white/10 bg-surface"
              } ${isPast ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Етап {race.round}</span>
                {isNext && <span className="font-semibold text-accent">Наступна</span>}
                {isPast && <span>Завершено</span>}
              </div>

              <h2 className="mt-1 font-semibold">{race.raceName}</h2>
              <p className="text-sm text-muted">
                {race.Circuit.Location.locality}, {race.Circuit.Location.country}
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm">
                <span>{formatDayMonth(raceDate)}</span>
                {race.Sprint && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                    Спринт
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}