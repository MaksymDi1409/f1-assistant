import champions from "@/data/champions.json";

// { "1950": "farina", "1951": "fangio", ... }
const championsBySeason: Record<string, string> = champions;

export function getTitleSeasons(driverId: string): string[] {
  return Object.entries(championsBySeason)
    .filter(([, id]) => id === driverId)
    .map(([season]) => season);
}