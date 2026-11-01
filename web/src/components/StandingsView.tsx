import Link from "next/link";
import {
  getConstructorStandings,
  getDriverStandings,
} from "@/lib/f1/jolpica";

type StandingsViewProps = {
  season: string; // "current" або рік
  highlightDriverId?: string;
};

export default async function StandingsView({
  season,
  highlightDriverId,
}: StandingsViewProps) {
  // Два запити паралельно, а не один за одним
  const [drivers, constructors] = await Promise.all([
    getDriverStandings(season),
    getConstructorStandings(season),
  ]);

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
            {drivers.map((s) => (
              <tr
                key={s.Driver.driverId}
                className={`border-t border-white/10 ${
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
                </td>
                <td className="hidden text-muted sm:table-cell">
                  {s.Constructors.at(-1)?.name}
                </td>
                <td className="pr-1 text-right font-semibold tabular-nums">
                  {s.points}
                </td>
              </tr>
            ))}
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
              {constructors.map((s) => (
                <tr
                  key={s.Constructor.constructorId}
                  className="border-t border-white/10"
                >
                  <td className="py-2 text-muted">{s.positionText}</td>
                  <td>{s.Constructor.name}</td>
                  <td className="text-right tabular-nums text-muted">{s.wins}</td>
                  <td className="text-right font-semibold tabular-nums">
                    {s.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}