import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDriver,
  getDriverCareerStats,
  getDriverSeasonResults,
  getDriverStandings,
} from "@/lib/f1/jolpica";
import { getAge } from "@/lib/f1/format";
import type { Driver } from "@/lib/f1/types";

type Props = PageProps<"/drivers/[driverId]">;

async function loadDriver(params: Props["params"]): Promise<Driver> {
  const { driverId } = await params;

  // driverId у Jolpica: малі латинські літери, цифри та "_" (max_verstappen)
  if (!/^[a-z0-9_]+$/.test(driverId)) notFound();

  const driver = await getDriver(driverId);
  if (!driver) notFound();

  return driver;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const driver = await loadDriver(params);
  return { title: `${driver.givenName} ${driver.familyName}` };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default async function DriverPage({ params }: Props) {
  const driver = await loadDriver(params);

  // Усі запити паралельно
  const [seasonResults, career, standings] = await Promise.all([
    getDriverSeasonResults(driver.driverId),
    getDriverCareerStats(driver.driverId),
    getDriverStandings(),
  ]);

  // Згодом тут буде злиття з CMS: біографія, фото, виправлення

  const standing = standings.find((s) => s.Driver.driverId === driver.driverId);
  const team = seasonResults.at(-1)?.result.Constructor.name;
  const seasonWins = seasonResults.filter((r) => r.result.position === "1").length;
  const seasonPodiums = seasonResults.filter(
    (r) => Number(r.result.position) <= 3,
  ).length;

  return (
    <>
      <Link href="/drivers" className="text-sm text-muted hover:text-foreground">
        ← Пілоти
      </Link>

      <div className="mb-8 mt-4 flex items-end gap-4">
        {driver.permanentNumber && (
          <span className="text-6xl font-bold tabular-nums text-accent">
            {driver.permanentNumber}
          </span>
        )}
        <div>
          <p className="text-muted">{driver.givenName}</p>
          <h1 className="text-4xl font-bold tracking-tight">{driver.familyName}</h1>
          <p className="mt-1 text-sm text-muted">
            {[team, driver.nationality, `${getAge(driver.dateOfBirth)} років`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-xl font-semibold">Поточний сезон</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Позиція" value={standing ? `P${standing.positionText}` : "—"} />
        <StatCard label="Очки" value={standing?.points ?? 0} />
        <StatCard label="Перемоги" value={seasonWins} />
        <StatCard label="Подіуми" value={seasonPodiums} />
      </div>

      <h2 className="mb-3 text-xl font-semibold">Кар&apos;єра</h2>
      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatCard label="Старти" value={career.starts} />
        <StatCard label="Перемоги" value={career.wins} />
        <StatCard label="Титули" value={career.titles} />
      </div>

      {seasonResults.length > 0 && (
        <>
          <h2 className="mb-3 text-xl font-semibold">Результати сезону</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="w-12 py-2">Етап</th>
                <th>Гонка</th>
                <th className="text-right">Старт</th>
                <th className="text-right">Фініш</th>
                <th className="w-14 text-right">Очки</th>
              </tr>
            </thead>
            <tbody>
              {seasonResults.map(({ race, result }) => (
                <tr key={race.round} className="border-t border-white/10">
                  <td className="py-2 text-muted">{race.round}</td>
                  <td>
                    <Link
                      href={`/calendar/${race.season}/${race.round}`}
                      className="hover:text-accent"
                    >
                      {race.raceName}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums text-muted">
                    {result.grid === "0" ? "Піт-лейн" : result.grid}
                  </td>
                  <td className="text-right tabular-nums">{result.positionText}</td>
                  <td className="text-right font-semibold tabular-nums">
                    {result.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <a
        href={driver.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block text-sm text-accent hover:underline"
      >
        Детальніше у Вікіпедії ↗
      </a>
    </>
  );
}