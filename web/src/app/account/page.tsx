import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FavoritesForm from "@/components/account/FavoritesForm";
import PageHeader from "@/components/PageHeader";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getConstructorStandings, getDriverStandings } from "@/lib/f1/jolpica";
import { fmt } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.account };
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const [drivers, teams, dict] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
    getDictionary(),
  ]);
  const t = dict.account;

  return (
    <div className="max-w-xl">
      <PageHeader title={fmt(t.greeting, { name: user.firstName ?? t.friend })} />

      <dl className="space-y-3 rounded-xl border border-line bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.email}</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.accessLevel}</dt>
          <dd>{t.roles[user.role]}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <FavoritesForm
          drivers={drivers.map((s) => ({
            id: s.Driver.driverId,
            label: `${s.Driver.givenName} ${s.Driver.familyName} (${s.Constructors.at(-1)?.name ?? "—"})`,
          }))}
          teams={teams.map((s) => ({
            id: s.Constructor.constructorId,
            label: s.Constructor.name,
          }))}
          favoriteDriver={user.favoriteDriver}
          favoriteTeam={user.favoriteTeam}
        />
      </div>

      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-lg border border-line-strong px-4 py-2 text-sm hover:bg-subtle"
        >
          {t.logout}
        </button>
      </form>
    </div>
  );
}
