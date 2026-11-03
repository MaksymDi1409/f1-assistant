// Завантажує чемпіонів світу з Jolpica і зберігає у src/data/champions.json
// Запуск: npm run data:champions (раз на рік, після завершення сезону)

import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";
const FIRST_SEASON = 1950;
// Останній сезон можна вказати вручну, якщо чемпіон визначився достроково:
// npm run data:champions -- 2026
const LAST_SEASON = Number(process.argv[2]) || new Date().getFullYear() - 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchChampion(season, attempt = 1) {
  const res = await fetch(`${BASE_URL}/${season}/driverStandings/1.json`);

  if (res.status === 429 && attempt < 5) {
    await sleep(2000 * attempt);
    return fetchChampion(season, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for season ${season}`);
  }

  const json = await res.json();
  const standing = json.MRData.StandingsTable.StandingsLists[0]?.DriverStandings[0];
  return standing?.Driver.driverId ?? null;
}

const champions = {};

for (let season = FIRST_SEASON; season <= LAST_SEASON; season++) {
  const driverId = await fetchChampion(season);
  if (driverId) champions[season] = driverId;
  console.log(`${season}: ${driverId ?? "—"}`);

  await sleep(400); // не більше ~2.5 запиту на секунду, щоб не впертись у ліміт
}

const dataDir = new URL("../src/data/", import.meta.url);
await mkdir(dataDir, { recursive: true });
await writeFile(
  new URL("champions.json", dataDir),
  JSON.stringify(champions, null, 2) + "\n",
);

console.log(`Збережено ${Object.keys(champions).length} сезонів`);