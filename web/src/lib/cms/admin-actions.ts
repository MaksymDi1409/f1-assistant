"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { ACCESS_COOKIE, getCurrentUser } from "@/lib/auth/session";
import { getDriver } from "@/lib/f1/jolpica";
import { fmt } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { LIVE_SETTINGS_KEYS, parseLiveSettings, type LiveSettings } from "@/lib/live-settings";
import {
  directusDeleteDriverOverride,
  directusSaveDriverOverride,
  directusUpdateSettings,
} from "./directus";
import { DRIVER_OVERRIDES_TAG } from "./driver-overrides";
import { getSiteSettings, SETTINGS_CACHE_TAG } from "./settings";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

// Перевірка ролі на сервері. Сховати кнопки в інтерфейсі недостатньо:
// Server Action — це звичайний HTTP-запит, його може надіслати будь-хто
async function requireAdminToken(): Promise<string | AdminActionResult> {
  const t = await getDictionary();

  const user = await getCurrentUser();
  if (user?.role !== "admin") return { ok: false, error: t.admin.errors.forbidden };

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) return { ok: false, error: t.common.sessionExpired };

  return accessToken;
}

// ---------- Живі налаштування сайту ----------

export async function updateLiveSettingsAction(
  patch: Partial<LiveSettings>,
): Promise<AdminActionResult> {
  const token = await requireAdminToken();
  if (typeof token !== "string") return token;

  const errors = (await getDictionary()).admin.errors;

  if (typeof patch !== "object" || patch === null) {
    return { ok: false, error: errors.invalidData };
  }

  // Лише дозволені поля і лише перевірені значення.
  // Неправильне значення замінюється поточним, тобто просто ігнорується
  const current = await getSiteSettings();
  const checked = parseLiveSettings({ ...current, ...patch }, current);

  const update: Record<string, unknown> = {};
  for (const key of LIVE_SETTINGS_KEYS) {
    if (key in patch) update[key] = checked[key];
  }
  if (Object.keys(update).length === 0) return { ok: false, error: errors.noChanges };

  // Запис у Directus токеном самого адміна — другий рівень перевірки прав
  const saved = await directusUpdateSettings(token, update).catch(() => false);
  if (!saved) return { ok: false, error: errors.directusRejected };

  // Скидаємо кеш налаштувань: нові значення одразу бачать і сервер, і нові відвідувачі.
  // Уже відкриті сторінки отримають зміни через WebSocket від Directus
  updateTag(SETTINGS_CACHE_TAG);

  return { ok: true };
}

// ---------- Виправлення даних пілотів ----------

export type DriverOverrideInput = {
  team_name: string;
  permanent_number: string;
  bio: string;
  bio_en: string;
};

const DRIVER_ID_PATTERN = /^[a-z0-9_]+$/;
const MAX_TEAM_LENGTH = 60;
const MAX_BIO_LENGTH = 5000;

// Порожній рядок означає «не виправляти, брати з API»
function emptyToNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function saveDriverOverrideAction(
  driverId: string,
  input: DriverOverrideInput,
): Promise<AdminActionResult> {
  const token = await requireAdminToken();
  if (typeof token !== "string") return token;

  const errors = (await getDictionary()).admin.errors;

  // Виправляти можна лише справжнього пілота з Jolpica
  if (typeof driverId !== "string" || !DRIVER_ID_PATTERN.test(driverId)) {
    return { ok: false, error: errors.invalidDriver };
  }
  if (!(await getDriver(driverId).catch(() => null))) {
    return { ok: false, error: errors.driverNotFound };
  }

  const teamName = emptyToNull(input?.team_name);
  const number = emptyToNull(input?.permanent_number);
  const bio = emptyToNull(input?.bio);
  const bioEn = emptyToNull(input?.bio_en);

  if (teamName && teamName.length > MAX_TEAM_LENGTH) {
    return { ok: false, error: fmt(errors.teamTooLong, { max: MAX_TEAM_LENGTH }) };
  }
  if (number && !/^\d{1,2}$/.test(number)) {
    return { ok: false, error: errors.numberInvalid };
  }
  if ((bio && bio.length > MAX_BIO_LENGTH) || (bioEn && bioEn.length > MAX_BIO_LENGTH)) {
    return { ok: false, error: fmt(errors.bioTooLong, { max: MAX_BIO_LENGTH }) };
  }

  const saved = await directusSaveDriverOverride(token, driverId, {
    team_name: teamName,
    permanent_number: number,
    bio,
    bio_en: bioEn,
  }).catch(() => false);
  if (!saved) return { ok: false, error: errors.directusRejected };

  updateTag(DRIVER_OVERRIDES_TAG);
  return { ok: true };
}

export async function resetDriverOverrideAction(driverId: string): Promise<AdminActionResult> {
  const token = await requireAdminToken();
  if (typeof token !== "string") return token;

  const errors = (await getDictionary()).admin.errors;

  if (typeof driverId !== "string" || !DRIVER_ID_PATTERN.test(driverId)) {
    return { ok: false, error: errors.invalidDriver };
  }

  const deleted = await directusDeleteDriverOverride(token, driverId).catch(() => false);
  if (!deleted) return { ok: false, error: errors.directusRejected };

  updateTag(DRIVER_OVERRIDES_TAG);
  return { ok: true };
}
