"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { loginAction } from "@/lib/auth/actions";
import FormField from "./FormField";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const { t } = useI18n();

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormField label={t.auth.email} name="email" type="email" autoComplete="email" />
      <FormField
        label={t.auth.password}
        name="password"
        type="password"
        autoComplete="current-password"
      />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-on-accent disabled:opacity-50"
      >
        {isPending ? t.auth.loggingIn : t.auth.login}
      </button>

      <p className="text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="text-accent hover:underline">
          {t.auth.register}
        </Link>
      </p>
    </form>
  );
}
