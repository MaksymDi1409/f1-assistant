import Link from "next/link";
import { getDriverOverrides } from "@/lib/cms/driver-overrides";
import {
  getConstructorStandings,
  getDriverStandings,
} from "@/lib/f1/jolpica";

type StandingsViewProps = {
  season: string; // "current" або рік
  highlightDriverId?: string;
  favoriteDriverId?: string | null;
  favoriteTeamId?: string | null;
};

export default async function StandingsView({
  season,
  highlightDriverId,
  favoriteDriverId,
  favoriteTeamId,
}: StandingsViewProps) {
  // Два запити паралельно, а не один за одним
  const [drivers, constructors, overrides] = await Promise.all([
    getDriverStandings(season),
    getConstructorStandings(season),
    getDriverOverrides(),
  ]);

  // Виправлення команди стосується лише поточного сезону, а не історичних таблиць
  const isCurrentSeason = season === "current";

  if (drivers.length === 0) {
    return <p className="text-muted">Даних за цей сезон немає.</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="mb-3 text-xl font-semibold">Пілоти</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="w-10 py-2">#</th>
              <th>Пілот</th>
              <th className="hidden sm:table-cell">Команда</th>
              <th className="text-right">Очки</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((s) => {
              const teamId = s.Constructors.at(-1)?.constructorId;

              return (
                <tr
                  key={s.Driver.driverId}
                  className={`border-t border-line ${
                    s.Driver.driverId === highlightDriverId ? "bg-accent/15" : ""
                  }`}
                >
                  <td className="py-2 pl-1 text-muted">{s.positionText}</td>
                  <td>
                    <Link
                      href={`/drivers/${s.Driver.driverId}`}
                      className="hover:text-accent"
                    >
                      {s.Driver.givenName} {s.Driver.familyName}
                    </Link>
                    {s.Driver.driverId === favoriteDriverId && (
                      <span className="ml-1.5 text-accent" title="Улюблений пілот">
                        ★
                      </span>
                    )}
                  </td>
                  <td
                    className={`hidden sm:table-cell ${
                      teamId && teamId === favoriteTeamId
                        ? "font-medium text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {(isCurrentSeason && overrides.get(s.Driver.driverId)?.team_name) ||
                      s.Constructors.at(-1)?.name}
                  </td>
                  <td className="pr-1 text-right font-semibold tabular-nums">
                    {s.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Команди</h2>
        {constructors.length === 0 ? (
          <p className="text-sm text-muted">
            Кубок конструкторів розігрується з 1958 року.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="w-10 py-2">#</th>
                <th>Команда</th>
                <th className="text-right">Перемоги</th>
                <th className="text-right">Очки</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((s) => {
                const isFavorite = s.Constructor.constructorId === favoriteTeamId;

                return (
                  <tr
                    key={s.Constructor.constructorId}
                    className={`border-t border-line ${isFavorite ? "bg-subtle" : ""}`}
                  >
                    <td className="py-2 pl-1 text-muted">{s.positionText}</td>
                    <td>
                      {s.Constructor.name}
                      {isFavorite && (
                        <span className="ml-1.5 text-accent" title="Улюблена команда">
                          ★
                        </span>
                      )}
                    </td>
                    <td className="text-right tabular-nums text-muted">{s.wins}</td>
                    <td className="pr-1 text-right font-semibold tabular-nums">
                      {s.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}