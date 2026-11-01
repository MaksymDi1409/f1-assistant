import type {
  ConstructorStanding,
  DriverStanding,
  Race,
} from "./types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

// Дані оновлюються не частіше ніж раз на годину:
// швидше для користувача і не перевищуємо ліміти API
const REVALIDATE_SECONDS = 3600;

type Season = "current" | `${number}`;

async function jolpicaFetch<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

  if (!res.ok) {
    throw new Error(`Jolpica API error ${res.status} for ${url}`);
  }

  const json = await res.json();
  return json.MRData as T;
}

export async function getSchedule(season: Season = "current"): Promise<Race[]> {
  const data = await jolpicaFetch<{ RaceTable: { Races: Race[] } }>(
    `/${season}.json?limit=100`,
  );
  return data.RaceTable.Races;
}

export async function getDriverStandings(
  season: Season = "current",
): Promise<DriverStanding[]> {
  const data = await jolpicaFetch<{
    StandingsTable: { StandingsLists: { DriverStandings: DriverStanding[] }[] };
  }>(`/${season}/driverStandings.json?limit=100`);
  return data.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(
  season: Season = "current",
): Promise<ConstructorStanding[]> {
  const data = await jolpicaFetch<{
    StandingsTable: {
      StandingsLists: { ConstructorStandings: ConstructorStanding[] }[];
    };
  }>(`/${season}/constructorStandings.json?limit=100`);
  return data.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}