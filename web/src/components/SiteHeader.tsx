"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth/session";

type HeaderUser = { firstName: string | null; role: UserRole } | null;

const navItems = [
  { href: "/", label: "Головна" },
  { href: "/chat", label: "AI-помічник" },
  { href: "/calendar", label: "Календар" },
  { href: "/standings", label: "Таблиця" },
  { href: "/drivers", label: "Пілоти" },
  { href: "/teams", label: "Команди" },
  { href: "/news", label: "Новини" },
];

export default function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          F1 <span className="text-accent">Assistant</span>
        </Link>

                <div className="flex min-w-0 items-center gap-2">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href={user ? "/account" : "/login"}
            className="shrink-0 whitespace-nowrap rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            {user ? (user.firstName ?? "Кабінет") : "Увійти"}
          </Link>
        </div>
      </div>
    </header>
  );
}
