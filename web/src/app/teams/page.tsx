import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  getConstructorStandings,
  getDriverStandings,
} from "@/lib/f1/jolpica";
import type { DriverStanding } from "@/lib/f1/types";
import { getCurrentUser } from "@/lib/auth/session";
import { fmt } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.teams };
}

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
        <p className="text-muted">{dict.pages.seasonNotStarted}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {constructors.map((c) => (
            <li
              key={c.Constructor.constructorId}
              // relative + розтягнуте посилання (after:inset-0) — клікабельна вся картка.
              // Вкладати <a> в <a> заборонено, тому чипи пілотів лежать шаром вище (z-10)
              className={`group relative rounded-xl border bg-surface p-4 transition-colors hover:border-accent/60 ${
                c.Constructor.constructorId === user?.favoriteTeam
                  ? "border-accent"
                  : "border-line"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted">P{c.positionText}</p>
                  <h2 className="text-xl font-bold">
                    <Link
                      href={`/teams/${c.Constructor.constructorId}`}
                      className="after:absolute after:inset-0 after:rounded-xl group-hover:text-accent"
                    >
                      {c.Constructor.name}
                    </Link>
                  </h2>
                  {c.Constructor.constructorId === user?.favoriteTeam && (
                    <p className="text-xs text-accent">{dict.teams.favorite}</p>
                  )}
                  <p className="text-sm text-muted">{c.Constructor.nationality}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">{c.points}</p>
                  <p className="text-xs text-muted">
                    {fmt(dict.teams.pointsWins, { wins: c.wins })}
                  </p>
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2">
                {(driversByTeam.get(c.Constructor.constructorId) ?? []).map((d) => (
                  <li key={d.Driver.driverId} className="relative z-10">
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