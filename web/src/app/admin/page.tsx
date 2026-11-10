import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin/AdminPanel";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.admin };
}

export default async function AdminPage() {
  // Доступ перевіряється на сервері: інші ролі не отримають навіть HTML панелі
  const [user, dict] = await Promise.all([getCurrentUser(), getDictionary()]);
  const t = dict.admin;
  if (!user) redirect("/login?next=/admin");

  if (user.role !== "admin") {
    return (
      <PageHeader
        title={t.noAccessTitle}
        description={t.noAccessDescription}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={t.title}
        description={t.description}
      />
      <AdminPanel />
    </>
  );
}
