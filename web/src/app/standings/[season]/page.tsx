import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import StandingsView from "@/components/StandingsView";
import { getCurrentUser } from "@/lib/auth/session";
import { fmt } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";

type Props = PageProps<"/standings/[season]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ season }, t] = await Promise.all([params, getDictionary()]);
  return { title: fmt(t.meta.standingsSeason, { season }) };
}

export default async function SeasonStandingsPage({ params, searchParams }: Props) {
  const [{ season }, { driver }, user, t] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
    getDictionary(),
  ]);

  if (!/^\d{4}$/.test(season) || Number(season) < 1950) notFound();

  // ?driver=hamilton → підсвітити рядок цього пілота
  const highlightDriverId = typeof driver === "string" ? driver : undefined;

  return (
    <>
      <Link href="/standings" className="text-sm text-muted hover:text-foreground">
        {t.standings.backToCurrent}
      </Link>

      <div className="mt-4">
        <PageHeader
          title={fmt(t.standings.seasonTitle, { season })}
          description={t.standings.seasonDescription}
        />
      </div>

      <StandingsView
        season={season}
        highlightDriverId={highlightDriverId}
        favoriteDriverId={user?.favoriteDriver}
        favoriteTeamId={user?.favoriteTeam}
      />
    </>
  );
}
