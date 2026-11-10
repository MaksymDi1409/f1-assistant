"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Theme } from "@/lib/theme";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

type HeaderUser = { firstName: string | null; role: UserRole } | null;

type SiteHeaderProps = {
  user: HeaderUser;
  theme: Theme;
  teamThemeAvailable: boolean;
  locale: Locale;
  labels: Dictionary["nav"]; // тексти меню потрібною мовою
};

export default function SiteHeader({
  user,
  theme,
  teamThemeAvailable,
  locale,
  labels,
}: SiteHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: labels.home },
    { href: "/chat", label: labels.chat },
    { href: "/calendar", label: labels.calendar },
    { href: "/standings", label: labels.standings },
    { href: "/drivers", label: labels.drivers },
    { href: "/teams", label: labels.teams },
    { href: "/news", label: labels.news },
  ];

  // Пункт «Адмін» бачить лише адміністратор. Це лише зручність:
  // доступ до самої сторінки /admin перевіряє сервер
  const items =
    user?.role === "admin" ? [...navItems, { href: "/admin", label: labels.admin }] : navItems;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          F1 <span className="text-accent">Assistant</span>
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <nav className="flex gap-1 overflow-x-auto">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-subtle hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <LanguageSwitcher locale={locale} />
          <ThemeSwitcher theme={theme} teamAvailable={teamThemeAvailable} />

          <Link
            href={user ? "/account" : "/login"}
            className="shrink-0 whitespace-nowrap rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-subtle"
          >
            {user ? (user.firstName ?? labels.account) : labels.login}
          </Link>
        </div>
      </div>
    </header>
  );
}
