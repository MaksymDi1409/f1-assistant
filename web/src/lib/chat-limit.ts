import type { CurrentUser } from "@/lib/auth/session";
import type { SiteSettings } from "@/lib/cms/settings";

// Лічильник питань до ШІ: скільки разів за поточну добу кожен ключ звертався до чату.
// Зберігається в пам'яті сервера: простий варіант для одного сервера.
// На продакшені з кількома серверами лічильник тримали б у Redis або базі даних.
type Usage = { day: string; count: number };

// globalThis — щоб лічильник не обнулявся при кожному гарячому перезавантаженні в режимі розробки
const globalStore = globalThis as unknown as { __chatUsage?: Map<string, Usage> };
const usage = (globalStore.__chatUsage ??= new Map<string, Usage>());

export type ChatLimit = {
  limit: number | null; // null — без обмежень (адмін)
  remaining: number | null;
};

// Доба рахується за київським часом: ліміт оновлюється опівночі за Києвом
function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" }).format(new Date());
}

// Хто питає: залогінений користувач — за ID, гість — за IP-адресою
export function getClientKey(user: CurrentUser | null, headers: Headers): string {
  if (user) return `user:${user.id}`;

  // За проксі або хостингом справжній IP приходить у заголовку x-forwarded-for.
  // Увага: без довіреного проксі цей заголовок можна підробити
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

// Ліміт залежить від рівня доступу
export function getDailyLimit(user: CurrentUser | null, settings: SiteSettings): number | null {
  if (!user) return settings.chat_limit_guest;
  if (user.role === "admin") return null;
  return settings.chat_limit_user;
}

function usedToday(key: string): number {
  const entry = usage.get(key);
  return entry && entry.day === today() ? entry.count : 0;
}

// Подивитися, скільки лишилось, нічого не витрачаючи (для сторінки чату)
export function peekChatLimit(key: string, limit: number | null): ChatLimit {
  if (limit === null) return { limit: null, remaining: null };
  return { limit, remaining: Math.max(0, limit - usedToday(key)) };
}

// Спробувати витратити одне питання. allowed: false — ліміт вичерпано
export function consumeChatLimit(
  key: string,
  limit: number | null,
): ChatLimit & { allowed: boolean } {
  if (limit === null) return { allowed: true, limit: null, remaining: null };

  const used = usedToday(key);
  if (used >= limit) return { allowed: false, limit, remaining: 0 };

  usage.set(key, { day: today(), count: used + 1 });
  return { allowed: true, limit, remaining: limit - used - 1 };
}