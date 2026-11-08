import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRace, getRaceResults } from "@/lib/f1/jolpica";
import { formatSession, toDate } from "@/lib/f1/format";
import type { Race, Session } from "@/lib/f1/types";

type Props = PageProps<"/calendar/[season]/[round]">;

// Перевіряємо адресу і завантажуємо гонку (або показуємо 404)
async function loadRace(params: Props["params"]): Promise<Race> {
  const { season, round } = await params;

  if (!/^\d{4}$/.test(season) || !/^\d{1,2}$/.test(round)) {
    notFound();
  }

  const race = await getRace(season, round);
  if (!race) notFound();

  return race;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const race = await loadRace(params);
  return { title: `${race.raceName} ${race.season}` };
}

function getSessions(race: Race) {
  const sessions: { name: string; session?: Session }[] = [
    { name: "Тренування 1", session: race.FirstPractice },
    { name: "Тренування 2", session: race.SecondPractice },
    { name: "Тренування 3", session: race.ThirdPractice },
    { name: "Спринт-кваліфікація", session: race.SprintQualifying },
    { name: "Спринт", session: race.Sprint },
    { name: "Кваліфікація", session: race.Qualifying },
    { name: "Гонка", session: { date: race.date, time: race.time } },
  ];

  return sessions
    .filter((s): s is { name: string; session: Session } => !!s.session)
    .sort(
      (a, b) =>
        toDate(a.session.date, a.session.time).getTime() -
        toDate(b.session.date, b.session.time).getTime(),
    );
}

export default async function RacePage({ params }: Props) {
  const race = await loadRace(params);
  const sessions = getSessions(race);

  const isFinished = toDate(race.date, race.time).getTime() < Date.now();
  const results = isFinished
    ? await getRaceResults(race.season, race.round)
    : [];
  const fastest = results.find((r) => r.FastestLap?.rank === "1");

  const { lat, long, locality, country } = race.Circuit.Location;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${long}#map=14/${lat}/${long}`;

  return (
    <>
      <Link href="/calendar" className="text-sm text-muted hover:text-foreground">
        ← Календар
      </Link>

      <div className="mb-8 mt-4">
        <p className="text-sm text-muted">
          Сезон {race.season} · Етап {race.round}
          {race.Sprint && " · Спринт-уїкенд"}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{race.raceName}</h1>
        <p className="mt-2 text-muted">
          {race.Circuit.circuitName} · {locality}, {country}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <aside className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-3 font-semibold">Розклад</h2>
            <ul className="space-y-2 text-sm">
              {sessions.map(({ name, session }) => (
                <li key={name} className="flex justify-between gap-4">
                  <span>{name}</span>
                  <span className="text-right text-muted">
                    {formatSession(session)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Час київський</p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-3 font-semibold">Траса</h2>
            <p>{race.Circuit.circuitName}</p>
            <p className="text-sm text-muted">
              {locality}, {country}
            </p>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-accent hover:underline"
            >
              Відкрити на мапі ↗
            </a>
          </section>
        </aside>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Результати</h2>

          {!isFinished && <p className="text-muted">Гонка ще не відбулася.</p>}

          {isFinished && results.length === 0 && (
            <p className="text-muted">Результати ще не опубліковані.</p>
          )}

          {results.length > 0 && (
            <>
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="w-10 py-2">#</th>
                    <th>Пілот</th>
                    <th className="hidden sm:table-cell">Команда</th>
                    <th className="text-right">Час / статус</th>
                    <th className="w-14 text-right">Очки</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.Driver.driverId} className="border-t border-line">
                      <td className="py-2 text-muted">{r.positionText}</td>
                      <td>
                        <Link
                          href={`/drivers/${r.Driver.driverId}`}
                          className="hover:text-accent"
                        >
                          {r.Driver.givenName} {r.Driver.familyName}
                        </Link>
                      </td>
                      <td className="hidden text-muted sm:table-cell">
                        {r.Constructor.name}
                      </td>
                      <td className="text-right tabular-nums text-muted">
                        {r.Time?.time ?? r.status}
                      </td>
                      <td className="text-right font-semibold tabular-nums">
                        {r.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {fastest?.FastestLap && (
                <p className="mt-4 text-sm text-muted">
                  Найшвидше коло:{" "}
                  <span className="text-foreground">
                    {fastest.Driver.givenName} {fastest.Driver.familyName}
                  </span>{" "}
                  — {fastest.FastestLap.Time.time} (коло {fastest.FastestLap.lap})
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}