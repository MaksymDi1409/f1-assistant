import { directusFetch } from "./directus";

export type SiteSettings = {
  hero_title: string;
  hero_subtitle: string;
  replay_enabled: boolean;
  replay_lap: number;
  replay_speed: number;
  replay_show_labels: boolean;
  chat_quick_questions: string[];
  ai_models: string[]; // порожній список = моделі з .env.local
  chat_instructions: string | null;
  chat_limit_guest: number; // питань на добу для гостя
  chat_limit_user: number; // для користувача і редактора (адмін — без обмежень)
};

// Значення за замовчуванням: сайт працює, навіть якщо CMS недоступна
// або адмін залишив поле порожнім
export const DEFAULT_SETTINGS: SiteSettings = {
  hero_title: "F1 Assistant",
  hero_subtitle: "Календар, таблиці, пілоти та AI-помічник для фанатів Формули 1",
  replay_enabled: true,
  replay_lap: 5,
  replay_speed: 2,
  replay_show_labels: true,
  chat_quick_questions: [
    "Хто виграв останню гонку?",
    "Яка зараз таблиця чемпіонату?",
    "Коли наступна гонка?",
    "Скільки титулів у Хемілтона?",
  ],
  ai_models: [],
  chat_instructions: null,
  chat_limit_guest: 5,
  chat_limit_user: 30,
};

// Налаштування оновлюються частіше за статті, щоб зміни адміна було видно швидко
const SETTINGS_REVALIDATE_SECONDS = 10;

// ---------- Перевірка значень від адміна ----------
// Навіть адмін може помилитися (наприклад, коло 500), тож перевіряємо все

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function int(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

function list(value: unknown, fallback: string[], pattern?: RegExp): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v && (!pattern || pattern.test(v)));
  return items.length > 0 ? items : fallback;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  let data: Record<string, unknown> | null = null;

  try {
    data = await directusFetch<Record<string, unknown>>(
      "/items/site_settings",
      {},
      SETTINGS_REVALIDATE_SECONDS,
    );
  } catch (error) {
    console.warn("Site settings unavailable, using defaults:", error);
  }

  const s = data ?? {};
  const d = DEFAULT_SETTINGS;

  return {
    hero_title: text(s.hero_title, d.hero_title),
    hero_subtitle: text(s.hero_subtitle, d.hero_subtitle),
    replay_enabled: bool(s.replay_enabled, d.replay_enabled),
    replay_lap: int(s.replay_lap, 1, 80, d.replay_lap),
    replay_speed: int(s.replay_speed, 1, 20, d.replay_speed),
    replay_show_labels: bool(s.replay_show_labels, d.replay_show_labels),
    chat_quick_questions: list(s.chat_quick_questions, d.chat_quick_questions),
    // Назва моделі: лише малі літери, цифри, крапки й дефіси
    ai_models: list(s.ai_models, d.ai_models, /^[a-z0-9.-]+$/),
    chat_instructions:
      typeof s.chat_instructions === "string" && s.chat_instructions.trim()
        ? s.chat_instructions.trim()
        : null,
    chat_limit_guest: int(s.chat_limit_guest, 0, 1000, d.chat_limit_guest),
    chat_limit_user: int(s.chat_limit_user, 0, 1000, d.chat_limit_user),
  };
}