"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { updateFavoritesAction } from "@/lib/auth/actions";

type Option = { id: string; label: string };

type Props = {
  drivers: Option[];
  teams: Option[];
  favoriteDriver: string | null;
  favoriteTeam: string | null;
};

function SelectField({
  label,
  name,
  options,
  defaultValue,
  notSelected,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue: string;
  notSelected: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-line bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent/50"
      >
        <option value="">{notSelected}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FavoritesForm({ drivers, teams, favoriteDriver, favoriteTeam }: Props) {
  const [state, formAction, isPending] = useActionState(updateFavoritesAction, undefined);
  const { t: dict } = useI18n();
  const t = dict.account;

  return (
    <form
      // Після збереження форма перестворюється з новими значеннями
      key={`${favoriteDriver}-${favoriteTeam}`}
      action={formAction}
      className="space-y-4 rounded-xl border border-line bg-surface p-4"
    >
      <h2 className="font-semibold">{t.favorites}</h2>

      <SelectField
        label={t.driver}
        name="favoriteDriver"
        options={drivers}
        defaultValue={favoriteDriver ?? ""}
        notSelected={t.notSelected}
      />
      <SelectField
        label={t.team}
        name="favoriteTeam"
        options={teams}
        defaultValue={favoriteTeam ?? ""}
        notSelected={t.notSelected}
      />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-400">{t.saved}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-50"
      >
        {isPending ? t.saving : t.save}
      </button>
    </form>
  );
}