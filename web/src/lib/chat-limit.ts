import type { CurrentUser } from "@/lib/auth/session";
import type { SiteSettings } from "@/lib/cms/settings";

// Лічильник питань до ШІ: скільки разів за поточну добу кожен ключ звертався до чату.
//
// На Vercel кожен запит може обробити інший екземпляр серверної функції,
// тож лічильник у пам'яті там не працює: у кожного екземпляра він свій і часто обнуляється.
// Тому на продакшені лічильник зберігається в Redis (Upstash) — спільному сховищі для всіх екземплярів.
// Локально, без налаштованого Redis, лишається простий лічильник у пам'яті.

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

  // Vercel сам записує справжній IP у x-forwarded-for і перезаписує підроблені значення.
  // Без такого довіреного проксі цей заголовок можна було б підробити
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

// ---------- Сховище: Redis (Upstash) ----------

// Інтеграція Upstash у Vercel створює змінні KV_REST_API_*, а консоль Upstash — UPSTASH_REDIS_REST_*
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const hasRedis = Boolean(REDIS_URL && REDIS_TOKEN);

// Запис живе 2 доби: після цього Redis сам його видалить, старі дні не накопичуються
const KEY_TTL_SECONDS = 2 * 86400;

function redisKey(clientKey: string): string {
  return `chat-limit:${today()}:${clientKey}`;
}

// Upstash має REST API: команди Redis надсилаються звичайним fetch, без окремої бібліотеки
async function redis<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${REDIS_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(body),
    cache: "no-store", // лічильник ніколи не кешується
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  return res.json() as Promise<T>;
}

async function redisGet(clientKey: string): Promise<number> {
  const { result } = await redis<{ result: string | null }>("", ["GET", redisKey(clientKey)]);
  return Number(result ?? 0);
}

// INCR атомарний: навіть якщо два запити прийдуть одночасно на різні сервери,
// кожен отримає своє значення лічильника і ліміт не буде перевищено
async function redisIncrement(clientKey: string): Promise<number> {
  const key = redisKey(clientKey);
  const [incr] = await redis<{ result: number }[]>("/pipeline", [
    ["INCR", key],
    ["EXPIRE", key, String(KEY_TTL_SECONDS)],
  ]);
  return incr.result;
}

// ---------- Сховище: пам'ять (локальна розробка або запасний варіант) ----------

type Usage = { day: string; count: number };

// globalThis — щоб лічильник не обнулявся при кожному гарячому перезавантаженні в режимі розробки
const globalStore = globalThis as unknown as { __chatUsage?: Map<string, Usage> };
const memory = (globalStore.__chatUsage ??= new Map<string, Usage>());

function memoryGet(clientKey: string): number {
  const entry = memory.get(clientKey);
  return entry && entry.day === today() ? entry.count : 0;
}

function memoryIncrement(clientKey: string): number {
  const count = memoryGet(clientKey) + 1;
  memory.set(clientKey, { day: today(), count });
  return count;
}

// ---------- Загальний інтерфейс ----------

// Якщо Redis тимчасово недоступний, чат не ламається: рахуємо в пам'яті і пишемо в лог
async function usedToday(clientKey: string): Promise<number> {
  if (!hasRedis) return memoryGet(clientKey);
  try {
    return await redisGet(clientKey);
  } catch (error) {
    console.error("Chat limit storage unavailable:", error);
    return memoryGet(clientKey);
  }
}

async function increment(clientKey: string): Promise<number> {
  if (!hasRedis) return memoryIncrement(clientKey);
  try {
    return await redisIncrement(clientKey);
  } catch (error) {
    console.error("Chat limit storage unavailable:", error);
    return memoryIncrement(clientKey);
  }
}

// Подивитися, скільки лишилось, нічого не витрачаючи (для сторінки чату)
export async function peekChatLimit(key: string, limit: number | null): Promise<ChatLimit> {
  if (limit === null) return { limit: null, remaining: null };
  return { limit, remaining: Math.max(0, limit - (await usedToday(key))) };
}

// Спробувати витратити одне питання. allowed: false — ліміт вичерпано.
// Спершу збільшуємо лічильник, потім порівнюємо: так немає проміжку між «перевірити» і «записати»
export async function consumeChatLimit(
  key: string,
  limit: number | null,
): Promise<ChatLimit & { allowed: boolean }> {
  if (limit === null) return { allowed: true, limit: null, remaining: null };

  const count = await increment(key);
  if (count > limit) return { allowed: false, limit, remaining: 0 };

  return { allowed: true, limit, remaining: limit - count };
}
