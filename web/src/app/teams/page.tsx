import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  getConstructorStandings,
  getDriverStandings,
} from "@/lib/f1/jolpica";
import type { DriverStanding } from "@/lib/f1/types";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Команди" };

export default async function TeamsPage() {
  const [constructors, drivers, user, dict] = await Promise.all([
    getConstructorStandings(),
    getDriverStandings(),
    getCurrentUser(),
    getDictionary(),
  ]);

  // Групуємо пілотів за їхньою поточною командою
  const driversByTeam = new Map<string, DriverStanding[]>();
  for (const s of drivers) {
    const teamId = s.Constructors.at(-1)?.constructorId;
    if (!teamId) continue;
    driversByTeam.set(teamId, [...(driversByTeam.get(teamId) ?? []), s]);
  }

  return (
    <>
      <PageHeader title={dict.pages.teamsTitle} description={dict.pages.teamsDescription} />

      {constructors.length === 0 ? (
        <p className="text-muted">Сезон ще не розпочався.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {constructors.map((c) => (
            <li
              key={c.Constructor.constructorId}
                            className={`rounded-xl border bg-surface p-4 ${
                c.Constructor.constructorId === user?.favoriteTeam
                  ? "border-accent"
                  : "border-line"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted">P{c.positionText}</p>
                  <h2 className="text-xl font-bold">{c.Constructor.name}</h2>
                                    {c.Constructor.constructorId === user?.favoriteTeam && (
                    <p className="text-xs text-accent">★ Улюблена команда</p>
                  )}
                  <p className="text-sm text-muted">{c.Constructor.nationality}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">{c.points}</p>
                  <p className="text-xs text-muted">
                    очок · {c.wins} перемог
                  </p>
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2">
                {(driversByTeam.get(c.Constructor.constructorId) ?? []).map((d) => (
                  <li key={d.Driver.driverId}>
                    <Link
                      href={`/drivers/${d.Driver.driverId}`}
                      className="inline-block rounded-md bg-subtle px-2.5 py-1 text-sm hover:bg-subtle-strong"
                    >
                      {d.Driver.code ?? d.Driver.familyName} · {d.points}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}