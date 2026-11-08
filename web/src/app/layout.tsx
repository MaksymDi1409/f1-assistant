import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";
import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { hasTeamTheme, resolveTheme, THEME_COOKIE } from "@/lib/theme";

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
  const user = await getCurrentUser();
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;

  // Пріоритет: вибір у цьому браузері → збережене в профілі → темна
  const { theme, accent, onAccent } = resolveTheme(
    cookieTheme ?? user?.theme,
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
        <SiteHeader
          user={user ? { firstName: user.firstName, role: user.role } : null}
          theme={theme}
          teamThemeAvailable={hasTeamTheme(user?.favoriteTeam ?? null)}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}