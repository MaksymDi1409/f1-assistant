import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import AnnouncementBanner from "@/components/live/AnnouncementBanner";
import { LiveSettingsProvider } from "@/components/live/LiveSettingsProvider";
import MaintenanceGate from "@/components/live/MaintenanceGate";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/cms/settings";
import { pickLiveSettings } from "@/lib/live-settings";
import { hasTeamTheme, resolveTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "F1 Assistant",
    template: "%s · F1 Assistant",
  },
  description: "Помічник фаната Формули 1: календар, таблиці, пілоти та AI-чат",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, settings, cookieStore] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    cookies(),
  ]);

  // Пріоритет: вибір у цьому браузері → збережене в профілі → темна
  const { theme, accent, onAccent } = resolveTheme(
    cookieStore.get(THEME_COOKIE)?.value ?? user?.theme,
    user?.favoriteTeam ?? null,
  );

  // Командна тема: підставляємо колір команди замість червоного
  const style = accent
    ? ({ "--accent": accent, "--on-accent": onAccent } as CSSProperties)
    : undefined;

  return (
    <html
      lang="uk"
      data-theme={theme}
      style={style}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* Налаштування з сервера стають початковими, далі їх оновлює WebSocket */}
        <LiveSettingsProvider initial={pickLiveSettings(settings)}>
          <SiteHeader
            user={user ? { firstName: user.firstName, role: user.role } : null}
            theme={theme}
            teamThemeAvailable={hasTeamTheme(user?.favoriteTeam ?? null)}
          />
          <AnnouncementBanner />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            <MaintenanceGate isAdmin={user?.role === "admin"}>{children}</MaintenanceGate>
          </main>
        </LiveSettingsProvider>
      </body>
    </html>
  );
}
