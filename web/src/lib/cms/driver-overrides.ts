import { directusFetch } from "./directus";

// Виправлення й доповнення даних пілотів від адміна.
// Основні дані приходять з Jolpica, а тут лише те, чого в API немає або що в ньому застаріло
export type DriverOverride = {
  id: number;
  driver_id: string; // driverId з Jolpica: "russell", "max_verstappen"
  team_name: string | null; // поточна команда, якщо API ще не оновився
  permanent_number: string | null;
  bio: string | null; // біографія українською (Markdown)
  photo: string | null; // ID файлу в Directus
};

export const DRIVER_OVERRIDES_TAG = "driver-overrides";

// Усі виправлення одним запитом: їх небагато, а потрібні на кількох сторінках
export async function getDriverOverrides(): Promise<Map<string, DriverOverride>> {
  try {
    const rows = await directusFetch<DriverOverride[]>(
      "/items/driver_overrides",
      { fields: "id,driver_id,team_name,permanent_number,bio,photo", limit: "-1" },
      { revalidate: 60, tags: [DRIVER_OVERRIDES_TAG] },
    );
    return new Map(rows.map((row) => [row.driver_id, row]));
  } catch (error) {
    // CMS недоступна — показуємо дані з API як є
    console.warn("Driver overrides unavailable:", error);
    return new Map();
  }
}

export async function getDriverOverride(driverId: string): Promise<DriverOverride | null> {
  return (await getDriverOverrides()).get(driverId) ?? null;
}
