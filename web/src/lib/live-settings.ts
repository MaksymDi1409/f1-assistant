// Налаштування, які адмін змінює «наживо»: вони приходять у браузер через WebSocket
// і застосовуються на відкритих сторінках без перезавантаження.
// Файл без серверного коду, тож його можна імпортувати і в клієнтські компоненти.

export type AnnouncementLevel = "info" | "warning";

export type LiveSettings = {
  announcement_active: boolean;
  announcement_text: string;
  announcement_level: AnnouncementLevel;
  replay_paused: boolean;
  replay_speed: number;
  replay_lap: number;
  chat_guest_enabled: boolean;
  maintenance_mode: boolean;
};

export const LIVE_SETTINGS_KEYS = [
  "announcement_active",
  "announcement_text",
  "announcement_level",
  "replay_paused",
  "replay_speed",
  "replay_lap",
  "chat_guest_enabled",
  "maintenance_mode",
] as const satisfies readonly (keyof LiveSettings)[];

export const DEFAULT_LIVE_SETTINGS: LiveSettings = {
  announcement_active: false,
  announcement_text: "",
  announcement_level: "info",
  replay_paused: false,
  replay_speed: 2,
  replay_lap: 5,
  chat_guest_enabled: true,
  maintenance_mode: false,
};

export const ANNOUNCEMENT_MAX_LENGTH = 300;

// Перевірка значень. Використовується двічі:
// на сервері (дані з Directus і зміни від адміна) та в браузері (повідомлення з WebSocket)
export function parseLiveSettings(
  raw: Record<string, unknown>,
  fallback: LiveSettings = DEFAULT_LIVE_SETTINGS,
): LiveSettings {
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  const int = (v: unknown, min: number, max: number, d: number) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : d;
  };

  return {
    announcement_active: bool(raw.announcement_active, fallback.announcement_active),
    announcement_text:
      typeof raw.announcement_text === "string"
        ? raw.announcement_text.slice(0, ANNOUNCEMENT_MAX_LENGTH)
        : fallback.announcement_text,
    announcement_level:
      raw.announcement_level === "info" || raw.announcement_level === "warning"
        ? raw.announcement_level
        : fallback.announcement_level,
    replay_paused: bool(raw.replay_paused, fallback.replay_paused),
    replay_speed: int(raw.replay_speed, 1, 20, fallback.replay_speed),
    replay_lap: int(raw.replay_lap, 1, 80, fallback.replay_lap),
    chat_guest_enabled: bool(raw.chat_guest_enabled, fallback.chat_guest_enabled),
    maintenance_mode: bool(raw.maintenance_mode, fallback.maintenance_mode),
  };
}

export function pickLiveSettings(settings: LiveSettings): LiveSettings {
  return {
    announcement_active: settings.announcement_active,
    announcement_text: settings.announcement_text,
    announcement_level: settings.announcement_level,
    replay_paused: settings.replay_paused,
    replay_speed: settings.replay_speed,
    replay_lap: settings.replay_lap,
    chat_guest_enabled: settings.chat_guest_enabled,
    maintenance_mode: settings.maintenance_mode,
  };
}
