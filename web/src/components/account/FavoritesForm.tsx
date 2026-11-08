"use client";

import { useActionState } from "react";
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
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent/50"
      >
        <option value="">— не вибрано —</option>
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

  return (
    <form
      // Після збереження форма перестворюється з новими значеннями
      key={`${favoriteDriver}-${favoriteTeam}`}
      action={formAction}
      className="space-y-4 rounded-xl border border-white/10 bg-surface p-4"
    >
      <h2 className="font-semibold">Улюблені</h2>

      <SelectField
        label="Пілот"
        name="favoriteDriver"
        options={drivers}
        defaultValue={favoriteDriver ?? ""}
      />
      <SelectField
        label="Команда"
        name="favoriteTeam"
        options={teams}
        defaultValue={favoriteTeam ?? ""}
      />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-400">Збережено</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Збереження…" : "Зберегти"}
      </button>
    </form>
  );
}