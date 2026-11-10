"use client";

import { useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { fmt } from "@/lib/i18n/format";
import { setThemeAction } from "@/lib/theme-actions";
import type { Theme } from "@/lib/theme";

type Props = {
  theme: Theme;
  teamAvailable: boolean;
};

export default function ThemeSwitcher({ theme, teamAvailable }: Props) {
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const LABELS: Record<Theme, string> = {
    dark: t.switchers.themeDark,
    light: t.switchers.themeLight,
    team: t.switchers.themeTeam,
  };

  const order: Theme[] = teamAvailable ? ["dark", "light", "team"] : ["dark", "light"];
  const next = order[(order.indexOf(theme) + 1) % order.length];

  function handleClick() {
    // Темну і світлу вмикаємо миттєво, не чекаючи сервера.
    // Командній потрібен колір, тож вона з'явиться після відповіді сервера
    if (next !== "team") {
      const root = document.documentElement;
      root.dataset.theme = next;
      root.style.removeProperty("--accent");
      root.style.removeProperty("--on-accent");
    }

    startTransition(async () => {
      await setThemeAction(next);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={fmt(t.switchers.themeTitle, { current: LABELS[theme], next: LABELS[next] })}
      className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-subtle hover:text-foreground disabled:opacity-50"
    >
      {LABELS[theme]}
    </button>
  );
}