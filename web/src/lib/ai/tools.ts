import {
  getConstructorStandings,
  getDriver,
  getDriverCareerStats,
  getDriverStandings,
  getRaceWithResults,
  getSchedule,
} from "@/lib/f1/jolpica";
import { getTitleSeasons } from "@/lib/f1/champions";
import type { ToolDefinition } from "./types";

// ---------- Перевірка аргументів ----------
// ШІ формує аргументи сам, тому перевіряємо їх так само суворо,
// як дані від користувача: в адресу запиту не має потрапити нічого зайвого

function parseSeason(value: unknown): string {
  if (value === undefined || value === null || value === "" || value === "current") {
    return "current";
  }
  const season = String(value);
  if (!/^\d{4}$/.test(season)) throw new Error(`Invalid season: ${season}`);
  return season;
}

function parseRound(value: unknown): string {
  const round = String(value ?? "last");
  if (!/^(\d{1,2}|last)$/.test(round)) throw new Error(`Invalid round: ${round}`);
  return round;
}

function parseDriverId(value: unknown): string {
  const driverId = String(value ?? "");
  if (!/^[a-z0-9_]+$/.test(driverId)) throw new Error(`Invalid driverId: ${driverId}`);
  return driverId;
}

const seasonParam = {
  type: "string",
  description: 'Рік сезону, наприклад "2024". Якщо не вказано — поточний сезон.',
};

// ---------- Інструменти ----------

export const f1Tools: ToolDefinition[] = [
  {
    name: "get_season_schedule",
    description: "Календар сезону Формули 1: етапи, траси, країни, дати гонок.",
    parameters: { type: "object", properties: { season: seasonParam } },
    async execute(args) {
      const races = await getSchedule(parseSeason(args.season));
      return races.map((r) => ({
        round: r.round,
        name: r.raceName,
        circuit: r.Circuit.circuitName,
        country: r.Circuit.Location.country,
        date: r.date,
        time: r.time,
        sprint: Boolean(r.Sprint),
        link: `/calendar/${r.season}/${r.round}`,
      }));
    },
  },
  {
    name: "get_race_results",
    description:
      'Результати гонки: позиції, пілоти, команди, час, очки. round — номер етапу або "last" для останньої завершеної гонки.',
    parameters: {
      type: "object",
      properties: {
        season: seasonParam,
        round: { type: "string", description: 'Номер етапу або "last"' },
      },
    },
    async execute(args) {
      const data = await getRaceWithResults(
        parseSeason(args.season),
        parseRound(args.round),
      );
      if (!data) return { error: "Гонку не знайдено або результатів ще немає" };

      const { race, results } = data;
      return {
        race: race.raceName,
        season: race.season,
        round: race.round,
        date: race.date,
        link: `/calendar/${race.season}/${race.round}`,
        results: results.map((r) => ({
          position: r.positionText,
          driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
          driverId: r.Driver.driverId,
          team: r.Constructor.name,
          timeOrStatus: r.Time?.time ?? r.status,
          points: r.points,
        })),
      };
    },
  },
  {
    name: "get_driver_standings",
    description: "Особистий залік пілотів (таблиця чемпіонату) за сезон.",
    parameters: { type: "object", properties: { season: seasonParam } },
    async execute(args) {
      const season = parseSeason(args.season);
      const standings = await getDriverStandings(season);
      return {
        link: season === "current" ? "/standings" : `/standings/${season}`,
        standings: standings.map((s) => ({
          position: s.positionText,
          driver: `${s.Driver.givenName} ${s.Driver.familyName}`,
          driverId: s.Driver.driverId,
          team: s.Constructors.at(-1)?.name,
          points: s.points,
          wins: s.wins,
        })),
      };
    },
  },
  {
    name: "get_constructor_standings",
    description: "Командний залік (кубок конструкторів) за сезон.",
    parameters: { type: "object", properties: { season: seasonParam } },
    async execute(args) {
      const standings = await getConstructorStandings(parseSeason(args.season));
      return standings.map((s) => ({
        position: s.positionText,
        team: s.Constructor.name,
        points: s.points,
        wins: s.wins,
      }));
    },
  },
  {
    name: "get_driver_info",
    description:
      "Інформація про пілота і статистика кар'єри: старти, перемоги, подіуми, титули. driverId — ідентифікатор з таблиць (наприклад max_verstappen, hamilton, russell).",
    parameters: {
      type: "object",
      properties: {
        driverId: { type: "string", description: "Ідентифікатор пілота" },
      },
      required: ["driverId"],
    },
    async execute(args) {
      const driverId = parseDriverId(args.driverId);
      const driver = await getDriver(driverId);
      if (!driver) {
        return {
          error:
            "Пілота не знайдено. Візьми правильний driverId з get_driver_standings.",
        };
      }

      const career = await getDriverCareerStats(driverId);
      return {
        name: `${driver.givenName} ${driver.familyName}`,
        number: driver.permanentNumber,
        code: driver.code,
        nationality: driver.nationality,
        dateOfBirth: driver.dateOfBirth,
        ...career,
        titles: getTitleSeasons(driverId),
        link: `/drivers/${driverId}`,
      };
    },
  },
];