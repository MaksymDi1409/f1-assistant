import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin/AdminPanel";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Адмін-панель" };

export default async function AdminPage() {
  // Доступ перевіряється на сервері: інші ролі не отримають навіть HTML панелі
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  if (user.role !== "admin") {
    return (
      <PageHeader
        title="Немає доступу"
        description="Ця сторінка доступна лише адміністраторам."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Адмін-панель"
        description="Зміни миттєво з'являються на всіх відкритих сторінках сайту"
      />
      <AdminPanel />
    </>
  );
}
