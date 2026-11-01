import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  getConstructorStandings,
  getDriverStandings,
} from "@/lib/f1/jolpica";

export const metadata: Metadata = { title: "Таблиця" };

export default async function StandingsPage() {
  // Два запити паралельно, а не один за одним
  const [drivers, constructors] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
  ]);

  return (
    <>
      <PageHeader title="Таблиця" description="Особистий і командний залік" />

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
                <tr key={s.Driver.driverId} className="border-t border-white/10">
                  <td className="py-2 text-muted">{s.positionText}</td>
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
                  <td className="text-right font-semibold tabular-nums">
                    {s.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Команди</h2>
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
        </section>
      </div>
    </>
  );
}