import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser, type UserRole } from "@/lib/auth/session";
import FavoritesForm from "@/components/account/FavoritesForm";
import { getConstructorStandings, getDriverStandings } from "@/lib/f1/jolpica";

export const metadata: Metadata = { title: "Кабінет" };

const ROLE_LABELS: Record<UserRole, string> = {
  user: "Користувач",
  editor: "Редактор",
  admin: "Адміністратор",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
    const [drivers, teams] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
  ]);

  return (
    <div className="max-w-xl">
      <PageHeader title={`Привіт, ${user.firstName ?? "друже"}!`} />

      <dl className="space-y-3 rounded-xl border border-line bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Рівень доступу</dt>
          <dd>{ROLE_LABELS[user.role]}</dd>
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
          Вийти
        </button>
      </form>
    </div>
  );
}