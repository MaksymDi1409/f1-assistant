import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import StandingsView from "@/components/StandingsView";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Таблиця" };

export default async function StandingsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <PageHeader
        title="Таблиця"
        description="Особистий і командний залік поточного сезону"
      />
      <StandingsView
        season="current"
        favoriteDriverId={user?.favoriteDriver}
        favoriteTeamId={user?.favoriteTeam}
      />
    </>
  );
}