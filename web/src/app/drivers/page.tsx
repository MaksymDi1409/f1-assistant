import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getDriverStandings } from "@/lib/f1/jolpica";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Пілоти" };

export default async function DriversPage() {
  // Беремо пілотів із таблиці: там одразу є команда, позиція й очки
    const [standings, user] = await Promise.all([getDriverStandings(), getCurrentUser()]);

  return (
    <>
      <PageHeader title="Пілоти" description="Усі пілоти поточного сезону" />

      {standings.length === 0 ? (
        <p className="text-muted">Сезон ще не розпочався.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {standings.map((s) => (
            <li key={s.Driver.driverId}>
              <Link
                href={`/drivers/${s.Driver.driverId}`}
                className={`block rounded-xl border bg-surface p-4 transition-colors hover:border-accent/60 ${
                  s.Driver.driverId === user?.favoriteDriver
                    ? "border-accent"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl font-bold tabular-nums text-muted">
                    {s.Driver.permanentNumber ?? "—"}
                  </span>
                  <span className="text-xs text-muted">
                    P{s.positionText} · {s.points} оч.
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {s.Driver.givenName}
                  {s.Driver.driverId === user?.favoriteDriver && (
                    <span className="ml-1.5 text-accent">★ Улюблений</span>
                  )}
                </p>
                <p className="text-xl font-bold">{s.Driver.familyName}</p>
                <p className="mt-1 text-sm text-muted">
                  {s.Constructors.at(-1)?.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}