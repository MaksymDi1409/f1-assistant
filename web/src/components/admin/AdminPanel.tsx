"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useLiveSettings, type ConnectionStatus } from "@/components/live/LiveSettingsProvider";
import { updateLiveSettingsAction } from "@/lib/cms/admin-actions";
import {
  ANNOUNCEMENT_MAX_LENGTH,
  type AnnouncementLevel,
  type LiveSettings,
} from "@/lib/live-settings";
import { fmt } from "@/lib/i18n/format";

const SPEEDS = [1, 2, 5, 10];

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  online: "bg-green-500",
  connecting: "bg-amber-500",
  offline: "bg-red-500",
};

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-accent" : "bg-subtle-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminPanel() {
  const { settings, status, apply } = useLiveSettings();
  const { t: dict } = useI18n();
  const t = dict.admin;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Чернетки полів, які адмін редагує перед тим, як застосувати
  const [text, setText] = useState(settings.announcement_text);
  const [level, setLevel] = useState<AnnouncementLevel>(settings.announcement_level);
  const [lap, setLap] = useState(String(settings.replay_lap));

  function save(patch: Partial<LiveSettings>) {
    setError(null);
    startTransition(async () => {
      const result = await updateLiveSettingsAction(patch);
      if (result.ok) {
        // Одразу показуємо зміну в панелі; іншим відвідувачам її доставить WebSocket
        apply(patch);
      } else {
        setError(result.error);
      }
    });
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <p className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`} aria-hidden="true" />
          {fmt(t.channel, { status: t.status[status] })}
        </p>
        {isPending && <p className="text-muted">{t.saving}</p>}
        {error && <p className="text-red-400">{error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t.announcementCard}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={ANNOUNCEMENT_MAX_LENGTH}
            rows={3}
            placeholder={t.announcementPlaceholder}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as AnnouncementLevel)}
              className="rounded-lg border border-line bg-background px-3 py-2 text-sm"
            >
              <option value="info">{t.levelInfo}</option>
              <option value="warning">{t.levelWarning}</option>
            </select>
            <button
              disabled={isPending || !text.trim()}
              onClick={() =>
                save({ announcement_text: text.trim(), announcement_level: level, announcement_active: true })
              }
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-50"
            >
              {settings.announcement_active ? t.update : t.show}
            </button>
            {settings.announcement_active && (
              <button
                disabled={isPending}
                onClick={() => save({ announcement_active: false })}
                className="rounded-lg border border-line-strong px-4 py-2 text-sm hover:bg-subtle disabled:opacity-50"
              >
                {t.hide}
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            {settings.announcement_active ? t.announcementShown : t.announcementHidden}
          </p>
        </Card>

        <Card title={t.replayCard}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={isPending}
              onClick={() => save({ replay_paused: !settings.replay_paused })}
              className="w-32 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-50"
            >
              {settings.replay_paused ? t.resume : t.pause}
            </button>
            <div className="flex gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  disabled={isPending}
                  onClick={() => save({ replay_speed: s })}
                  className={`rounded-md px-2.5 py-2 text-sm disabled:opacity-50 ${
                    s === settings.replay_speed
                      ? "bg-subtle-strong text-foreground"
                      : "text-muted hover:bg-subtle"
                  }`}
                >
                  ×{s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <label htmlFor="replay-lap" className="text-muted">
              {t.lap}
            </label>
            <input
              id="replay-lap"
              type="number"
              min={1}
              max={80}
              value={lap}
              onChange={(e) => setLap(e.target.value)}
              className="w-20 rounded-lg border border-line bg-background px-3 py-1.5"
            />
            <button
              disabled={isPending || Number(lap) === settings.replay_lap}
              onClick={() => save({ replay_lap: Number(lap) })}
              className="rounded-lg border border-line-strong px-3 py-1.5 hover:bg-subtle disabled:opacity-50"
            >
              {t.apply}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">
            {fmt(t.replayState, {
              lap: settings.replay_lap,
              speed: settings.replay_speed,
              state: settings.replay_paused ? t.replayPaused : t.replayPlaying,
            })}
          </p>
        </Card>

        <Card title={t.accessCard}>
          <Toggle
            label={t.guestChat}
            description={t.guestChatDescription}
            checked={settings.chat_guest_enabled}
            disabled={isPending}
            onChange={(value) => save({ chat_guest_enabled: value })}
          />
          <Toggle
            label={t.maintenance}
            description={t.maintenanceDescription}
            checked={settings.maintenance_mode}
            disabled={isPending}
            onChange={(value) => save({ maintenance_mode: value })}
          />
        </Card>

        <Card title={t.otherCard}>
          <p className="text-sm text-muted">
            {t.otherText}
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://localhost:8055"}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-accent hover:underline"
          >
            {t.openDirectus}
          </a>
        </Card>
      </div>
    </div>
  );
}
