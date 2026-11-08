import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Реєстрація" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Реєстрація</h1>
      <RegisterForm />
    </div>
  );
}