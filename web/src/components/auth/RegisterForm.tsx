"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { registerAction } from "@/lib/auth/actions";
import FormField from "./FormField";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, undefined);
  const { t } = useI18n();

  return (
    <form action={formAction} className="space-y-4">
      <FormField label={t.auth.firstName} name="firstName" autoComplete="given-name" />
      <FormField label={t.auth.email} name="email" type="email" autoComplete="email" />
      <FormField
        label={t.auth.passwordNew}
        name="password"
        type="password"
        autoComplete="new-password"
      />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-on-accent disabled:opacity-50"
      >
        {isPending ? t.auth.registering : t.auth.register}
      </button>

      <p className="text-center text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="text-accent hover:underline">
          {t.auth.login}
        </Link>
      </p>
    </form>
  );
}
