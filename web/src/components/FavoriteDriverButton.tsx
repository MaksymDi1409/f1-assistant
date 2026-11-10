"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { updateFavoritesAction } from "@/lib/auth/actions";

type Props = {
  driverId: string;
  isFavorite: boolean;
};

export default function FavoriteDriverButton({ driverId, isFavorite }: Props) {
  const [state, formAction, isPending] = useActionState(updateFavoritesAction, undefined);
  const { t } = useI18n();

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      {/* Порожнє значення = прибрати з улюблених */}
      <input type="hidden" name="favoriteDriver" value={isFavorite ? "" : driverId} />
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
          isFavorite
            ? "bg-accent text-on-accent"
            : "border border-line-strong hover:bg-subtle"
        }`}
      >
        {isFavorite ? t.driver.favoriteOn : t.driver.favoriteOff}
      </button>
      {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
    </form>
  );
}