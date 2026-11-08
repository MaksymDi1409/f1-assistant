import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import StandingsView from "@/components/StandingsView";
import { getCurrentUser } from "@/lib/auth/session";

type Props = PageProps<"/standings/[season]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  return { title: `Таблиця ${season}` };
}

export default async function SeasonStandingsPage({ params, searchParams }: Props) {
  const { season } = await params;
  const { driver } = await searchParams;
  const user = await getCurrentUser();

  if (!/^\d{4}$/.test(season) || Number(season) < 1950) notFound();

  // ?driver=hamilton → підсвітити рядок цього пілота
  const highlightDriverId = typeof driver === "string" ? driver : undefined;

  return (
    <>
      <Link href="/standings" className="text-sm text-muted hover:text-foreground">
        ← Поточний сезон
      </Link>

      <div className="mt-4">
        <PageHeader title={`Сезон ${season}`} description="Таблиця чемпіонату" />
      </div>

      <StandingsView season={season} highlightDriverId={highlightDriverId} 
      favoriteDriverId={user?.favoriteDriver}
      favoriteTeamId={user?.favoriteTeam} />
    </>
  );
}