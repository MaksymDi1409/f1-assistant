import type {
  Constructor,
  ConstructorStanding,
  Driver,
  DriverStanding,
  Race,
  RaceResult,
} from "./types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

// Дані оновлюються не частіше ніж раз на годину:
// швидше для користувача і не перевищуємо ліміти API
const REVALIDATE_SECONDS = 3600;
const MAX_ATTEMPTS = 3;

async function jolpicaFetch<T>(path: string, attempt = 1): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

  // 429 = забагато запитів: чекаємо (1 с, потім 2 с) і пробуємо ще раз
  if (res.status === 429 && attempt < MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    return jolpicaFetch<T>(path, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Jolpica API error ${res.status} for ${url}`);
  }

  const json = await res.json();
  return json.MRData as T;
}

// Jolpica повертає загальну кількість записів у полі total.
// Запит з limit=1 дозволяє порахувати, наприклад, перемоги, не завантажуючи їх усі
async function getTotal(path: string): Promise<number> {
  const data = await jolpicaFetch<{ total: string }>(`${path}?limit=1`);
  return Number(data.total);
}

// ---------- Календар і гонки ----------

export async function getSchedule(season = "current"): Promise<Race[]> {
  const data = await jolpicaFetch<{ RaceTable: { Races: Race[] } }>(
    `/${season}.json?limit=100`,
  );
  return data.RaceTable.Races;
}

export async function getRace(season: string, round: string): Promise<Race | null> {
  const data = await jolpicaFetch<{ RaceTable: { Races: Race[] } }>(
    `/${season}/${round}.json`,
  );
  return data.RaceTable.Races[0] ?? null;
}

export async function getRaceResults(
  season: string,
  round: string,
): Promise<RaceResult[]> {
  const data = await jolpicaFetch<{
    RaceTable: { Races: { Results: RaceResult[] }[] };
  }>(`/${season}/${round}/results.json?limit=100`);
  return data.RaceTable.Races[0]?.Results ?? [];
}

// ---------- Таблиці ----------

export async function getDriverStandings(
  season = "current",
): Promise<DriverStanding[]> {
  const data = await jolpicaFetch<{
    StandingsTable: { StandingsLists: { DriverStandings: DriverStanding[] }[] };
  }>(`/${season}/driverStandings.json?limit=100`);
  return data.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(
  season = "current",
): Promise<ConstructorStanding[]> {
  const data = await jolpicaFetch<{
    StandingsTable: {
      StandingsLists: { ConstructorStandings: ConstructorStanding[] }[];
    };
  }>(`/${season}/constructorStandings.json?limit=100`);
  return data.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

// ---------- Пілоти ----------

export async function getDriver(driverId: string): Promise<Driver | null> {
  const data = await jolpicaFetch<{ DriverTable: { Drivers: Driver[] } }>(
    `/drivers/${driverId}.json`,
  );
  return data.DriverTable.Drivers[0] ?? null;
}

export async function getDriverSeasonResults(
  driverId: string,
  season = "current",
): Promise<{ race: Race; result: RaceResult }[]> {
  const data = await jolpicaFetch<{
    RaceTable: { Races: (Race & { Results: RaceResult[] })[] };
  }>(`/${season}/drivers/${driverId}/results.json?limit=100`);

  return data.RaceTable.Races.map((race) => ({
    race,
    result: race.Results[0],
  }));
}

export async function getDriverCareerStats(driverId: string) {
  const [starts, wins, seconds, thirds] = await Promise.all([
    getTotal(`/drivers/${driverId}/results.json`),
    getTotal(`/drivers/${driverId}/results/1.json`), // фініш на 1 місці
    getTotal(`/drivers/${driverId}/results/2.json`),
    getTotal(`/drivers/${driverId}/results/3.json`),
  ]);

  return { starts, wins, podiums: wins + seconds + thirds };
}

export async function getRaceWithResults(
  season: string,
  round: string,
): Promise<{ race: Race; results: RaceResult[] } | null> {
  const data = await jolpicaFetch<{
    RaceTable: { Races: (Race & { Results: RaceResult[] })[] };
  }>(`/${season}/${round}/results.json?limit=100`);

  const race = data.RaceTable.Races[0];
  return race ? { race, results: race.Results } : null;
}

// ---------- Команди ----------

export async function getConstructor(constructorId: string): Promise<Constructor | null> {
  const data = await jolpicaFetch<{ ConstructorTable: { Constructors: Constructor[] } }>(
    `/constructors/${constructorId}.json`,
  );
  return data.ConstructorTable.Constructors[0] ?? null;
}

// Результати обох пілотів команди в кожній гонці сезону
export async function getConstructorSeasonResults(
  constructorId: string,
  season = "current",
): Promise<{ race: Race; results: RaceResult[] }[]> {
  const data = await jolpicaFetch<{
    RaceTable: { Races: (Race & { Results: RaceResult[] })[] };
  }>(`/${season}/constructors/${constructorId}/results.json?limit=100`);

  return data.RaceTable.Races.map(({ Results, ...race }) => ({ race, results: Results }));
}

export async function getConstructorCareerStats(constructorId: string) {
  const [seasons, wins, seconds, thirds] = await Promise.all([
    getTotal(`/constructors/${constructorId}/seasons.json`),
    getTotal(`/constructors/${constructorId}/results/1.json`),
    getTotal(`/constructors/${constructorId}/results/2.json`),
    getTotal(`/constructors/${constructorId}/results/3.json`),
  ]);

  // Подіуми рахуються по фінішах: два пілоти команди на подіумі = 2
  return { seasons, wins, podiums: wins + seconds + thirds };
}
