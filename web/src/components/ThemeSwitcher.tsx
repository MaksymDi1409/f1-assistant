"use client";

import { useTransition } from "react";
import { setThemeAction } from "@/lib/theme-actions";
import type { Theme } from "@/lib/theme";

const LABELS: Record<Theme, string> = {
  dark: "☾ Темна",
  light: "☀ Світла",
  team: "★ Команда",
};

type Props = {
  theme: Theme;
  teamAvailable: boolean;
};

export default function ThemeSwitcher({ theme, teamAvailable }: Props) {
  const [isPending, startTransition] = useTransition();

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
      title={`Тема: ${LABELS[theme]}. Натисни, щоб увімкнути: ${LABELS[next]}`}
      className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-subtle hover:text-foreground disabled:opacity-50"
    >
      {LABELS[theme]}
    </button>
  );
}