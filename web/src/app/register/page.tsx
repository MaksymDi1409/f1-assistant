import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.register };
}

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");

  const t = await getDictionary();

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{t.auth.registerTitle}</h1>
      <RegisterForm />
    </div>
  );
}
