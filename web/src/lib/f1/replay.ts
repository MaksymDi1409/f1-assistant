import {
  getLaps,
  getLocations,
  getRaceSessions,
  getSessionDrivers,
  type OpenF1Session,
} from "./openf1";

// [час від початку кола в мс, x, y]
export type ReplayPoint = [number, number, number];

export type ReplayDriver = {
  number: number;
  acronym: string;
  color: string;
  points: ReplayPoint[];
};

export type Replay = {
  title: string;
  lap: number;
  durationMs: number;
  width: number;
  height: number;
  track: [number, number][];
  drivers: ReplayDriver[];
};

const VIEW_SIZE = 1000; // розмір SVG по довшій стороні
const PADDING = 40;
const HOUR = 3600 * 1000;

// Остання завершена гонка: цього року, а якщо ще не було — минулого
export async function getLatestRaceSession(): Promise<OpenF1Session | null> {
  const year = new Date().getFullYear();

  for (const y of [year, year - 1]) {
    const sessions = await getRaceSessions(y);
    // +3 години запасу, щоб дані встигли з'явитися в OpenF1
    const finished = sessions.filter((s) => Date.parse(s.date_end) + 3 * HOUR < Date.now());
    if (finished.length > 0) return finished.at(-1)!;
  }

  return null;
}

export async function buildReplay(
  session: OpenF1Session,
  lapNumber: number,
): Promise<Replay | null> {
  // По черзі, а не паралельно: OpenF1 суворо обмежує кількість запитів на секунду
  const laps = await getLaps(session.session_key, lapNumber);
  const drivers = await getSessionDrivers(session.session_key);

  // Лідер — той, хто почав це коло першим
  const leaderLap = laps
    .filter((l) => l.date_start && l.lap_duration)
    .sort((a, b) => Date.parse(a.date_start!) - Date.parse(b.date_start!))[0];
  if (!leaderLap) return null;

  const startMs = Date.parse(leaderLap.date_start!);
  const durationMs = Math.round(leaderLap.lap_duration! * 1000);

  const rows = await getLocations(
    session.session_key,
    new Date(startMs).toISOString(),
    new Date(startMs + durationMs).toISOString(),
  );

  // (0, 0) — болід у боксах або датчик не передав дані
  const valid = rows.filter((r) => r.x !== 0 || r.y !== 0);
  if (valid.length === 0) return null;

  // Масштабуємо координати OpenF1 у систему SVG
  const xs = valid.map((r) => r.x);
  const ys = valid.map((r) => r.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = (VIEW_SIZE - 2 * PADDING) / Math.max(maxX - minX, maxY - minY);

  // У SVG вісь Y спрямована вниз, тому перевертаємо її
  const toView = (x: number, y: number): [number, number] => [
    Math.round(PADDING + (x - minX) * scale),
    Math.round(PADDING + (maxY - y) * scale),
  ];

  // Групуємо точки по пілотах
  const byDriver = new Map<number, ReplayPoint[]>();
  for (const r of valid) {
    const [x, y] = toView(r.x, r.y);
    const points = byDriver.get(r.driver_number) ?? [];
    points.push([Date.parse(r.date) - startMs, x, y]);
    byDriver.set(r.driver_number, points);
  }
  for (const points of byDriver.values()) {
    points.sort((a, b) => a[0] - b[0]);
  }

  // Схема траси = траєкторія лідера за коло, замкнута в петлю
  const track = (byDriver.get(leaderLap.driver_number) ?? []).map(
    ([, x, y]) => [x, y] as [number, number],
  );
  if (track.length > 0) track.push(track[0]);

  return {
    title: `${session.country_name} · ${session.circuit_short_name} ${session.year}`,
    lap: lapNumber,
    durationMs,
    width: Math.round((maxX - minX) * scale + 2 * PADDING),
    height: Math.round((maxY - minY) * scale + 2 * PADDING),
    track,
    drivers: drivers
      .filter((d) => byDriver.has(d.driver_number))
      .map((d) => ({
        number: d.driver_number,
        acronym: d.name_acronym,
        color: d.team_colour ? `#${d.team_colour}` : "#888888",
        points: byDriver.get(d.driver_number)!,
      })),
  };
}