"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useLiveSettings } from "./LiveSettingsProvider";

type Props = {
  isAdmin: boolean;
  children: ReactNode;
};

// Режим техробіт: відвідувачі бачать заглушку, адмін — сайт із попередженням.
// Сторінка входу лишається доступною, щоб адмін міг увійти
export default function MaintenanceGate({ isAdmin, children }: Props) {
  const { settings } = useLiveSettings();
  const pathname = usePathname();
  const { t } = useI18n();

  const isMaintenance = settings.maintenance_mode;

  if (isMaintenance && !isAdmin && !pathname.startsWith("/login")) {
    return (
      <div className="py-24 text-center">
        <p className="text-5xl" aria-hidden="true">
          🛠
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{t.live.maintenanceTitle}</h1>
        <p className="mt-2 text-muted">
          {t.live.maintenanceText}
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-muted hover:text-foreground">
          {t.live.adminLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      {isMaintenance && isAdmin && (
        <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm">
          {t.live.maintenanceAdminNotice}
        </p>
      )}
      {children}
    </>
  );
}
