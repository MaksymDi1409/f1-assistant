import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Вхід" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/account");

  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Вхід</h1>
      <LoginForm next={typeof next === "string" ? next : "/account"} />
    </div>
  );
}