"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/auth/actions";
import FormField from "./FormField";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Ім'я" name="firstName" autoComplete="given-name" />
      <FormField label="Email" name="email" type="email" autoComplete="email" />
      <FormField label="Пароль (мінімум 8 символів)" name="password" type="password" autoComplete="new-password" />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Реєстрація…" : "Зареєструватися"}
      </button>

      <p className="text-center text-sm text-muted">
        Вже маєш акаунт?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Увійти
        </Link>
      </p>
    </form>
  );
}