import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getCurrentUser } from "@/lib/auth/session";
import { getTeamDetails } from "@/lib/cms/team-details";
import { getConstructorTitleSeasons, hasConstructorChampionsData } from "@/lib/f1/champions";
import {
  getConstructor,
  getConstructorCareerStats,
  getConstructorSeasonResults,
  getConstructorStandings,
  getDriverStandings,
} from "@/lib/f1/jolpica";
import type { Constructor } from "@/lib/f1/types";
import { getI18n } from "@/lib/i18n/server";

type Props = PageProps<"/teams/[constructorId]">;

const DIRECTUS_PUBLIC_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://localhost:8055";

async function loadTeam(params: Props["params"]): Promise<Constructor> {
  const { constructorId } = await params;

  // constructorId у Jolpica: малі латинські літери, цифри та "_" (red_bull)
  if (!/^[a-z0-9_]+$/.test(constructorId)) notFound();

  const team = await getConstructor(constructorId);
  if (!team) notFound();

  return team;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await loadTeam(params);
  return { title: team.name };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default async function TeamPage({ params }: Props) {
  const team = await loadTeam(params);
  const id = team.constructorId;

  const [seasonResults, career, constructors, drivers, user, details, { locale, t: dict }] =
    await Promise.all([
      getConstructorSeasonResults(id).catch(() => []),
      getConstructorCareerStats(id).catch(() => null),
      getConstructorStandings(),
      getDriverStandings(),
      getCurrentUser(),
      getTeamDetails(id),
      getI18n(),
    ]);
  const t = dict.team;

  const standing = constructors.find((c) => c.Constructor.constructorId === id);
  const teamDrivers = drivers.filter((d) => d.Constructors.at(-1)?.constructorId === id);
  const titleSeasons = getConstructorTitleSeasons(id);
  const isFavorite = user?.favoriteTeam === id;
  const canEdit = user?.role === "admin" || user?.role === "editor";
  const description =
    (locale === "en" ? details?.description_en : null) ?? details?.description ?? null;

  const facts = [
    { label: t.principal, value: details?.team_principal },
    { label: t.technicalDirector, value: details?.technical_director },
    { label: t.base, value: details?.base },
    { label: t.chassis, value: details?.chassis },
    { label: t.powerUnit, value: details?.power_unit },
    { label: t.firstEntry, value: details?.first_entry },
  ].filter((f) => f.value);

  return (
    <>
      <Link href="/teams" className="text-sm text-muted hover:text-foreground">
        {t.back}
      </Link>

      <div className="mb-8 mt-4">
        <p className="text-sm text-muted">
          {standing ? `P${standing.positionText} · ` : ""}
          {team.nationality}
          {isFavorite && <span className="ml-1.5 text-accent">{dict.teams.favorite}</span>}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{team.name}</h1>
        {details?.full_name && <p className="mt-1 text-muted">{details.full_name}</p>}
      </div>

      <div className="mb-8 max-w-xl">
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="mb-3 font-semibold">{t.facts}</h2>
          {facts.length > 0 ? (
            <dl className="space-y-2 text-sm">
              {facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-4">
                  <dt className="text-muted">{f.label}</dt>
                  <dd className="text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted">{t.noFacts}</p>
          )}

          {teamDrivers.length > 0 && (
            <>
              <h3 className="mb-2 mt-4 text-sm text-muted">{t.drivers}</h3>
              <ul className="flex flex-wrap gap-2">
                {teamDrivers.map((d) => (
                  <li key={d.Driver.driverId}>
                    <Link
                      href={`/drivers/${d.Driver.driverId}`}
                      className="inline-block rounded-md bg-subtle px-2.5 py-1 text-sm hover:bg-subtle-strong"
                    >
                      {d.Driver.givenName} {d.Driver.familyName}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Редагування — у Directus: там уже є зручна форма й перевірка прав */}
          {canEdit && (
            <a
              href={`${DIRECTUS_PUBLIC_URL}/admin/content/team_details/${details ? details.id : "+"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-sm text-muted hover:bg-subtle hover:text-foreground"
            >
              {details ? t.editInCms : t.createInCms}
            </a>
          )}
        </section>
      </div>

      {description && (
        <section className="mb-8 max-w-3xl">
          <h2 className="mb-3 text-xl font-semibold">{t.about}</h2>
          <div className="article-content text-sm">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        </section>
      )}

      <h2 className="mb-3 text-xl font-semibold">{t.currentSeason}</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t.position} value={standing ? `P${standing.positionText}` : "—"} />
        <StatCard label={t.points} value={standing?.points ?? 0} />
        <StatCard label={t.wins} value={standing?.wins ?? 0} />
      </div>

      <h2 className="mb-3 text-xl font-semibold">{t.history}</h2>
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t.seasons} value={career?.seasons ?? "—"} />
        <StatCard label={t.wins} value={career?.wins ?? "—"} />
        <StatCard label={t.podiums} value={career?.podiums ?? "—"} />
        <StatCard
          label={t.titles}
          value={hasConstructorChampionsData ? titleSeasons.length : "—"}
        />
      </div>

      {titleSeasons.length > 0 ? (
        <p className="mb-8 text-sm text-muted">
          {t.champion}{" "}
          {titleSeasons.map((season, i) => (
            <span key={season}>
              {i > 0 && ", "}
              <Link
                href={`/standings/${season}`}
                className="text-foreground underline decoration-line-strong underline-offset-4 hover:text-accent hover:decoration-accent"
              >
                {season}
              </Link>
            </span>
          ))}
        </p>
      ) : (
        <div className="mb-8" />
      )}

      {seasonResults.length > 0 && (
        <>
          <h2 className="mb-3 text-xl font-semibold">{t.seasonResults}</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="w-12 py-2">{t.round}</th>
                <th>{t.race}</th>
                <th className="text-right">{t.finishes}</th>
                <th className="w-14 text-right">{t.points}</th>
              </tr>
            </thead>
            <tbody>
              {seasonResults.map(({ race, results }) => (
                <tr key={race.round} className="border-t border-line">
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
                    {results
                      .map((r) => `${r.Driver.code ?? r.Driver.familyName} ${r.positionText}`)
                      .join(" · ")}
                  </td>
                  <td className="text-right font-semibold tabular-nums">
                    {results.reduce((sum, r) => sum + Number(r.points), 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <a
        href={team.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block text-sm text-accent hover:underline"
      >
        {t.wikipedia}
      </a>
    </>
  );
}
