import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.login };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/account");

  const [{ next }, t] = await Promise.all([searchParams, getDictionary()]);

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{t.auth.loginTitle}</h1>
      <LoginForm next={typeof next === "string" ? next : "/account"} />
    </div>
  );
}
