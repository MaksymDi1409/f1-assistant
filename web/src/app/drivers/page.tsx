import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth/session";
import { getDriverOverrides } from "@/lib/cms/driver-overrides";
import { getDriverStandings } from "@/lib/f1/jolpica";
import { fmt } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.drivers };
}

export default async function DriversPage() {
  // Беремо пілотів із таблиці: там одразу є команда, позиція й очки
  const [standings, user, overrides, dict] = await Promise.all([
    getDriverStandings(),
    getCurrentUser(),
    getDriverOverrides(),
    getDictionary(),
  ]);

  return (
    <>
      <PageHeader title={dict.pages.driversTitle} description={dict.pages.driversDescription} />

      {standings.length === 0 ? (
        <p className="text-muted">{dict.pages.seasonNotStarted}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {standings.map((s) => {
            // Виправлення адміна мають пріоритет над даними API
            const override = overrides.get(s.Driver.driverId);
            const number = override?.permanent_number ?? s.Driver.permanentNumber ?? "—";
            const team = override?.team_name ?? s.Constructors.at(-1)?.name;
            const isFavorite = s.Driver.driverId === user?.favoriteDriver;

            return (
              <li key={s.Driver.driverId}>
                <Link
                  href={`/drivers/${s.Driver.driverId}`}
                  className={`block rounded-xl border bg-surface p-4 transition-colors hover:border-accent/60 ${
                    isFavorite ? "border-accent" : "border-line"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl font-bold tabular-nums text-muted">{number}</span>
                    <span className="text-xs text-muted">
                      P{s.positionText} · {fmt(dict.drivers.pointsShort, { points: s.points })}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {s.Driver.givenName}
                    {isFavorite && <span className="ml-1.5 text-accent">{dict.drivers.favorite}</span>}
                  </p>
                  <p className="text-xl font-bold">{s.Driver.familyName}</p>
                  <p className="mt-1 text-sm text-muted">{team}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
