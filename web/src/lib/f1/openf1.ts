const BASE_URL = "https://api.openf1.org/v1";
const MAX_ATTEMPTS = 3;

// ---------- Типи відповідей ----------

export type OpenF1Session = {
  session_key: number;
  meeting_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  country_name: string;
  circuit_short_name: string;
  location: string;
  year: number;
};

export type OpenF1Driver = {
  driver_number: number;
  name_acronym: string; // "RUS"
  full_name: string;
  team_name: string;
  team_colour: string | null; // "27F4D2" (без #)
};

export type OpenF1Lap = {
  driver_number: number;
  lap_number: number;
  date_start: string | null;
  lap_duration: number | null; // секунди
};

export type OpenF1Location = {
  date: string;
  driver_number: number;
  x: number;
  y: number;
  z: number;
};

// ---------- Запити ----------

// Історичні дані не змінюються, тож кешуємо їх на добу
const DAY = 86400;

async function openf1Fetch<T>(path: string, revalidate = DAY, attempt = 1): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate } });

  if (res.status === 429 && attempt < MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    return openf1Fetch<T>(path, revalidate, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`OpenF1 API error ${res.status} for ${path}`);
  }

  return (await res.json()) as T;
}

export async function getRaceSessions(year: number): Promise<OpenF1Session[]> {
  // Список гонок сезону оновлюється частіше, бо додаються нові етапи
  const sessions = await openf1Fetch<OpenF1Session[]>(
    `/sessions?year=${year}&session_name=Race`,
    3600,
  );
  return sessions.sort((a, b) => Date.parse(a.date_start) - Date.parse(b.date_start));
}

export function getSessionDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  return openf1Fetch<OpenF1Driver[]>(`/drivers?session_key=${sessionKey}`);
}

export function getLaps(sessionKey: number, lapNumber: number): Promise<OpenF1Lap[]> {
  return openf1Fetch<OpenF1Lap[]>(
    `/laps?session_key=${sessionKey}&lap_number=${lapNumber}`,
  );
}

// Координати ВСІХ болідів за проміжок часу, одним запитом
export function getLocations(
  sessionKey: number,
  from: string,
  to: string,
): Promise<OpenF1Location[]> {
  return openf1Fetch<OpenF1Location[]>(
    `/location?session_key=${sessionKey}&date>${encodeURIComponent(from)}&date<${encodeURIComponent(to)}`,
  );
}