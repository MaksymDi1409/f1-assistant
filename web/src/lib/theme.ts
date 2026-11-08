export const THEMES = ["dark", "light", "team"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "f1_theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

// Кольори команд за constructorId з Jolpica
export const TEAM_COLORS: Record<string, string> = {
  mercedes: "#27F4D2",
  ferrari: "#E8002D",
  red_bull: "#3671C6",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#0093CC",
  williams: "#64C4FF",
  rb: "#6692FF",
  haas: "#B6BABD",
  audi: "#F50537",
  cadillac: "#C8A85A",
};

// Чорний чи білий текст краще читається на цьому фоні
function readableTextColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Сприйняття яскравості оком: зелений найяскравіший, синій найтемніший
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0b0b0f" : "#ffffff";
}

export type ResolvedTheme = {
  theme: Theme;
  accent?: string;
  onAccent?: string;
};

export function resolveTheme(
  requested: string | null | undefined,
  favoriteTeam: string | null,
): ResolvedTheme {
  const theme: Theme = isTheme(requested) ? requested : "dark";

  if (theme === "team") {
    const color = favoriteTeam ? TEAM_COLORS[favoriteTeam] : undefined;
    // Немає улюбленої команди (наприклад, гість) — звичайна темна
    if (!color) return { theme: "dark" };
    return { theme, accent: color, onAccent: readableTextColor(color) };
  }

  return { theme };
}

export function hasTeamTheme(favoriteTeam: string | null): boolean {
  return Boolean(favoriteTeam && TEAM_COLORS[favoriteTeam]);
}