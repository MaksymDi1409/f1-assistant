import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser, type UserRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Кабінет" };

const ROLE_LABELS: Record<UserRole, string> = {
  user: "Користувач",
  editor: "Редактор",
  admin: "Адміністратор",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="max-w-xl">
      <PageHeader title={`Привіт, ${user.firstName ?? "друже"}!`} />

      <dl className="space-y-3 rounded-xl border border-white/10 bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Рівень доступу</dt>
          <dd>{ROLE_LABELS[user.role]}</dd>
        </div>
      </dl>

      <p className="mt-6 text-sm text-muted">
        Скоро тут з&apos;являться улюблений пілот, команда і вибір теми.
      </p>

      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
        >
          Вийти
        </button>
      </form>
    </div>
  );
}