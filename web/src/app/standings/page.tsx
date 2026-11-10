import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import StandingsView from "@/components/StandingsView";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Таблиця" };

export default async function StandingsPage() {
  const [user, dict] = await Promise.all([getCurrentUser(), getDictionary()]);

  return (
    <>
      <PageHeader
        title={dict.pages.standingsTitle}
        description={dict.pages.standingsDescription}
      />
      <StandingsView
        season="current"
        favoriteDriverId={user?.favoriteDriver}
        favoriteTeamId={user?.favoriteTeam}
      />
    </>
  );
}