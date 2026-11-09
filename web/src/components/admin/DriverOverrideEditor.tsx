"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  resetDriverOverrideAction,
  saveDriverOverrideAction,
  type AdminActionResult,
} from "@/lib/cms/admin-actions";

type Props = {
  driverId: string;
  // Що зараз каже API — показуємо як підказку в порожніх полях
  apiTeam: string | null;
  apiNumber: string | null;
  // Поточні виправлення (null — виправлень немає)
  override: {
    id: number;
    team_name: string | null;
    permanent_number: string | null;
    bio: string | null;
  } | null;
};

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://localhost:8055";

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50";

// Панель адміна на сторінці пілота: виправити дані з API або доповнити їх
export default function DriverOverrideEditor({ driverId, apiTeam, apiNumber, override }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [teamName, setTeamName] = useState(override?.team_name ?? "");
  const [number, setNumber] = useState(override?.permanent_number ?? "");
  const [bio, setBio] = useState(override?.bio ?? "");

  function run(action: () => Promise<AdminActionResult>, successText: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMessage({ ok: true, text: successText });
        router.refresh(); // перемалювати сторінку з новими даними
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  function handleReset() {
    setTeamName("");
    setNumber("");
    setBio("");
    run(() => resetDriverOverrideAction(driverId), "Виправлення скинуто, показуються дані з API");
  }

  // Фото завантажується в Directus: там уже є зручне завантаження й обрізання картинок
  const directusLink = override
    ? `${DIRECTUS_URL}/admin/content/driver_overrides/${override.id}`
    : `${DIRECTUS_URL}/admin/content/driver_overrides/+`;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-sm text-muted hover:bg-subtle hover:text-foreground"
      >
        ✎ Виправити дані {override && "· є виправлення"}
      </button>
    );
  }

  return (
    <div className="max-w-xl space-y-3 rounded-xl border border-dashed border-line-strong bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Виправлення даних (адмін)</h2>
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Закрити"
          className="rounded px-1.5 text-muted hover:bg-subtle hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-muted">
        Порожнє поле — береться значення з API. Заповнене — замінює його на всьому сайті і для
        AI-помічника.
      </p>

      <label className="block">
        <span className="mb-1 block text-sm text-muted">Команда</span>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={apiTeam ? `З API: ${apiTeam}` : "—"}
          maxLength={60}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-muted">Номер</span>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={apiNumber ? `З API: ${apiNumber}` : "—"}
          inputMode="numeric"
          maxLength={2}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-muted">Біографія (Markdown)</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Коротко про пілота…"
          className={inputClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={isPending}
          onClick={() =>
            run(
              () =>
                saveDriverOverrideAction(driverId, {
                  team_name: teamName,
                  permanent_number: number,
                  bio,
                }),
              "Збережено",
            )
          }
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-50"
        >
          {isPending ? "Збереження…" : "Зберегти"}
        </button>

        {override && (
          <button
            disabled={isPending}
            onClick={handleReset}
            className="rounded-lg border border-line-strong px-4 py-2 text-sm hover:bg-subtle disabled:opacity-50"
          >
            Скинути до даних API
          </button>
        )}

        <a
          href={directusLink}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm text-accent hover:underline"
        >
          Фото — у Directus ↗
        </a>
      </div>

      {message && (
        <p className={`text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
