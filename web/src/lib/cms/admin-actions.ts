"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { ACCESS_COOKIE, getCurrentUser } from "@/lib/auth/session";
import { LIVE_SETTINGS_KEYS, parseLiveSettings, type LiveSettings } from "@/lib/live-settings";
import { directusUpdateSettings } from "./directus";
import { getSiteSettings, SETTINGS_CACHE_TAG } from "./settings";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function updateLiveSettingsAction(
  patch: Partial<LiveSettings>,
): Promise<AdminActionResult> {
  // 1. Перевірка ролі на сервері. Сховати кнопки в інтерфейсі недостатньо:
  //    Server Action — це звичайний HTTP-запит, його може надіслати будь-хто
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { ok: false, error: "Недостатньо прав" };

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) return { ok: false, error: "Сесія закінчилась, увійди знову" };

  if (typeof patch !== "object" || patch === null) {
    return { ok: false, error: "Некоректні дані" };
  }

  // 2. Лише дозволені поля і лише перевірені значення.
  //    Неправильне значення замінюється поточним, тобто просто ігнорується
  const current = await getSiteSettings();
  const checked = parseLiveSettings({ ...current, ...patch }, current);

  const update: Record<string, unknown> = {};
  for (const key of LIVE_SETTINGS_KEYS) {
    if (key in patch) update[key] = checked[key];
  }
  if (Object.keys(update).length === 0) return { ok: false, error: "Немає змін" };

  // 3. Запис у Directus токеном самого адміна — другий рівень перевірки прав
  const saved = await directusUpdateSettings(accessToken, update).catch(() => false);
  if (!saved) return { ok: false, error: "Directus не прийняв зміни" };

  // 4. Скидаємо кеш налаштувань: нові значення одразу бачать і сервер, і нові відвідувачі.
  //    Уже відкриті сторінки отримають зміни через WebSocket від Directus
  updateTag(SETTINGS_CACHE_TAG);

  return { ok: true };
}
