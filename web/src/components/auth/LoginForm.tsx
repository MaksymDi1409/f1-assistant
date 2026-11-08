"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import FormField from "./FormField";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormField label="Email" name="email" type="email" autoComplete="email" />
      <FormField label="Пароль" name="password" type="password" autoComplete="current-password" />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Вхід…" : "Увійти"}
      </button>

      <p className="text-center text-sm text-muted">
        Немає акаунта?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Зареєструватися
        </Link>
      </p>
    </form>
  );
}