"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/config";

const LABELS: Record<Locale, string> = { uk: "UA", en: "EN" };

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border border-line text-xs" role="group" aria-label="Мова / Language">
      {LOCALES.map((l) => (
        <button
          key={l}
          disabled={isPending || l === locale}
          aria-pressed={l === locale}
          onClick={() => startTransition(() => setLocaleAction(l))}
          className={`px-2 py-1.5 ${
            l === locale ? "bg-subtle-strong font-semibold text-foreground" : "text-muted hover:bg-subtle"
          } disabled:cursor-default`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
