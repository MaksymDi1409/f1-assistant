import { getSchedule } from "./jolpica";
import {
  getDriverLocations,
  getLaps,
  getRaceSessions,
  type OpenF1Session,
} from "./openf1";
import type { Race } from "./types";

// Статична схема траси: траєкторія одного пілота за одне коло.
// Жодної анімації і лише 3 невеликі запити до OpenF1, які кешуються на місяць
export type TrackOutline = {
  path: string; // атрибут d для <path> у SVG
  width: number;
  height: number;
  start: [number, number]; // точка старту кола
  year: number; // рік гонки, з якої взята схема
};

const MONTH = 30 * 86400;
const DAY_MS = 86400 * 1000;
const HOUR_MS = 3600 * 1000;
const FIRST_OPENF1_SEASON = 2023; // раніше OpenF1 не має координат
const YEARS_BACK = 3;
const VIEW_SIZE = 1000;
const PADDING = 30;
const MAX_POINTS = 400; // більше для плавної лінії не потрібно

// Сесія OpenF1 для гонки Jolpica: шукаємо за датою (±2 дні),
// бо назви гонок і трас у двох API записані по-різному
async function findOpenF1Session(season: number, date: string): Promise<OpenF1Session | null> {
  const target = Date.parse(date);
  const sessions = await getRaceSessions(season);
  return (
    sessions.find(
      (s) =>
        Math.abs(Date.parse(s.date_start) - target) < 2 * DAY_MS &&
        // дані з'являються в OpenF1 не одразу після фінішу
        Date.parse(s.date_end) + 3 * HOUR_MS < Date.now(),
    ) ?? null
  );
}

async function buildOutline(session: OpenF1Session): Promise<Omit<TrackOutline, "year"> | null> {
  // 3-тє коло: на старті болід ще в щільній групі, а на 1-му колі починає з решітки
  const laps = await getLaps(session.session_key, 3, MONTH);
  const lap = laps
    .filter((l) => l.date_start && l.lap_duration)
    .sort((a, b) => Date.parse(a.date_start!) - Date.parse(b.date_start!))[0];
  if (!lap) return null;

  const startMs = Date.parse(lap.date_start!);
  const rows = await getDriverLocations(
    session.session_key,
    lap.driver_number,
    new Date(startMs).toISOString(),
    new Date(startMs + lap.lap_duration! * 1000).toISOString(),
    MONTH,
  );

  // (0, 0) — датчик не передав дані
  const points = rows
    .filter((r) => r.x !== 0 || r.y !== 0)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (points.length < 20) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = maxY - Math.min(...ys);
  const scale = (VIEW_SIZE - 2 * PADDING) / Math.max(spanX, spanY);

  // Проріджуємо точки і переводимо в координати SVG (вісь Y у SVG направлена вниз)
  const step = Math.ceil(points.length / MAX_POINTS);
  const view = points
    .filter((_, i) => i % step === 0)
    .map((p): [number, number] => [
      Math.round(PADDING + (p.x - minX) * scale),
      Math.round(PADDING + (maxY - p.y) * scale),
    ]);

  const path = `M${view.map(([x, y]) => `${x} ${y}`).join("L")}Z`;

  return {
    path,
    width: Math.round(spanX * scale + 2 * PADDING),
    height: Math.round(spanY * scale + 2 * PADDING),
    start: view[0],
  };
}

// Схема з конкретної гонки (сезон + дата), якщо OpenF1 має її дані
async function outlineFor(season: number, date: string): Promise<TrackOutline | null> {
  const session = await findOpenF1Session(season, date);
  if (!session) return null;
  const outline = await buildOutline(session);
  return outline ? { ...outline, year: season } : null;
}

// Спершу сама гонка (якщо вже відбулась), далі — та сама траса в попередні роки.
// Так схема є і для майбутніх етапів
export async function getCircuitOutline(race: Race): Promise<TrackOutline | null> {
  try {
    const season = Number(race.season);
    if (season >= FIRST_OPENF1_SEASON) {
      const outline = await outlineFor(season, race.date);
      if (outline) return outline;
    }

    const oldest = Math.max(FIRST_OPENF1_SEASON, season - YEARS_BACK);
    for (let year = season - 1; year >= oldest; year--) {
      const schedule = await getSchedule(String(year));
      const same = schedule.find((r) => r.Circuit.circuitId === race.Circuit.circuitId);
      if (!same) continue;

      const outline = await outlineFor(year, same.date);
      if (outline) return outline;
    }
  } catch (error) {
    // Схема — лише доповнення сторінки: якщо API недоступне, сторінка працює без неї
    console.warn("Track outline unavailable:", error);
  }
  return null;
}
