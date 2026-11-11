import { directusFetch } from "./directus";

// Довідкові дані команд, яких немає в Jolpica: керівники, база, шасі, двигун, опис.
// Заповнює редактор або адмін у Directus (колекція team_details)
export type TeamDetails = {
  id: number;
  constructor_id: string; // constructorId з Jolpica: "mercedes", "red_bull"
  full_name: string | null; // "Mercedes-AMG PETRONAS F1 Team"
  base: string | null; // "Брекворт, Велика Британія"
  team_principal: string | null;
  technical_director: string | null;
  chassis: string | null; // "W17"
  power_unit: string | null; // "Mercedes"
  first_entry: number | null; // рік дебюту
  description: string | null; // опис українською (Markdown)
  description_en: string | null;
};

export const TEAM_DETAILS_TAG = "team-details";

const FIELDS = [
  "id",
  "constructor_id",
  "full_name",
  "base",
  "team_principal",
  "technical_director",
  "chassis",
  "power_unit",
  "first_entry",
  "description",
  "description_en",
].join(",");

export async function getTeamDetails(constructorId: string): Promise<TeamDetails | null> {
  try {
    const rows = await directusFetch<TeamDetails[]>(
      "/items/team_details",
      {
        fields: FIELDS,
        filter: JSON.stringify({ constructor_id: { _eq: constructorId } }),
        limit: "1",
      },
      { revalidate: 60, tags: [TEAM_DETAILS_TAG] },
    );
    return rows[0] ?? null;
  } catch (error) {
    // CMS недоступна або колекцію ще не створили — показуємо лише дані з API
    console.warn("Team details unavailable:", error);
    return null;
  }
}
