"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useLiveSettings } from "./LiveSettingsProvider";

// Оголошення від адміна: з'являється і зникає на всіх відкритих сторінках миттєво
export default function AnnouncementBanner() {
  const { settings } = useLiveSettings();
  const { t } = useI18n();
  // Закрите користувачем оголошення не показуємо, доки адмін не змінить текст
  const [dismissedText, setDismissedText] = useState<string | null>(null);

  const text = settings.announcement_text.trim();
  if (!settings.announcement_active || !text || dismissedText === text) return null;

  const isWarning = settings.announcement_level === "warning";

  return (
    <div
      role="status"
      className={`border-b ${
        isWarning ? "border-amber-500/30 bg-amber-500/15" : "border-accent/30 bg-accent/10"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm">
        <span aria-hidden="true">{isWarning ? "⚠" : "📢"}</span>
        <p className="flex-1">{text}</p>
        <button
          onClick={() => setDismissedText(text)}
          aria-label={t.live.closeAnnouncement}
          className="rounded px-1.5 text-muted hover:bg-subtle hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
