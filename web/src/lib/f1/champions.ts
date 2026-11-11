import champions from "@/data/champions.json";
import constructorChampions from "@/data/constructor-champions.json";

// { "1950": "farina", "1951": "fangio", ... }
const championsBySeason: Record<string, string> = champions;

export function getTitleSeasons(driverId: string): string[] {
  return Object.entries(championsBySeason)
    .filter(([, id]) => id === driverId)
    .map(([season]) => season);
}

// { "1958": "vanwall", ..., "2025": "mclaren" }.
// Порожній файл = скрипт ще не запускали (npm run data:champions)
const constructorChampionsBySeason: Record<string, string> = constructorChampions;

export const hasConstructorChampionsData = Object.keys(constructorChampionsBySeason).length > 0;

export function getConstructorTitleSeasons(constructorId: string): string[] {
  return Object.entries(constructorChampionsBySeason)
    .filter(([, id]) => id === constructorId)
    .map(([season]) => season);
}
