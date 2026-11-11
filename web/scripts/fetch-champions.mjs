// Завантажує чемпіонів світу з Jolpica і зберігає у src/data/:
// champions.json — пілоти, constructor-champions.json — команди (Кубок конструкторів з 1958)
// Запуск: npm run data:champions (раз на рік, після завершення сезону)

import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";
const FIRST_SEASON = 1950;
const FIRST_CONSTRUCTORS_SEASON = 1958;
// Останній сезон можна вказати вручну, якщо чемпіон визначився достроково:
// npm run data:champions -- 2026
const LAST_SEASON = Number(process.argv[2]) || new Date().getFullYear() - 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// type: "driver" або "constructor"
async function fetchChampion(season, type, attempt = 1) {
  const res = await fetch(`${BASE_URL}/${season}/${type}Standings/1.json`);

  if (res.status === 429 && attempt < 5) {
    await sleep(2000 * attempt);
    return fetchChampion(season, type, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${type} ${season}`);
  }

  const json = await res.json();
  const list = json.MRData.StandingsTable.StandingsLists[0];
  return type === "driver"
    ? (list?.DriverStandings[0]?.Driver.driverId ?? null)
    : (list?.ConstructorStandings[0]?.Constructor.constructorId ?? null);
}

const champions = {};
const constructorChampions = {};

for (let season = FIRST_SEASON; season <= LAST_SEASON; season++) {
  const driverId = await fetchChampion(season, "driver");
  if (driverId) champions[season] = driverId;
  await sleep(400); // не більше ~2.5 запиту на секунду, щоб не впертись у ліміт

  let constructorId = null;
  if (season >= FIRST_CONSTRUCTORS_SEASON) {
    constructorId = await fetchChampion(season, "constructor");
    if (constructorId) constructorChampions[season] = constructorId;
    await sleep(400);
  }

  console.log(`${season}: ${driverId ?? "—"} / ${constructorId ?? "—"}`);
}

const dataDir = new URL("../src/data/", import.meta.url);
await mkdir(dataDir, { recursive: true });
await writeFile(
  new URL("champions.json", dataDir),
  JSON.stringify(champions, null, 2) + "\n",
);

await writeFile(
  new URL("constructor-champions.json", dataDir),
  JSON.stringify(constructorChampions, null, 2) + "\n",
);

console.log(
  `Збережено: пілоти — ${Object.keys(champions).length} сезонів, ` +
    `команди — ${Object.keys(constructorChampions).length}`,
);