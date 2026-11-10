"use client";

import { useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/config";

const LABELS: Record<Locale, string> = { uk: "UA", en: "EN" };

export default function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t.switchers.language}
      className="flex shrink-0 overflow-hidden rounded-md border border-line text-xs"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          disabled={isPending || l === locale}
          aria-pressed={l === locale}
          onClick={() => startTransition(() => setLocaleAction(l))}
          className={`px-2 py-1.5 disabled:cursor-default ${
            l === locale
              ? "bg-subtle-strong font-semibold text-foreground"
              : "text-muted hover:bg-subtle"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
