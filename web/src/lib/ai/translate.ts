import { GoogleGenAI } from "@google/genai";

export type ArticleText = {
  title: string;
  summary: string | null;
  content: string | null;
};

// Ті самі правила перемикання моделей, що й у чаті
const FALLBACK_STATUSES = [404, 429, 503];

function getStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : undefined;
}

// Структура відповіді: модель зобов'язана повернути саме такий JSON (structured output)
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    content: { type: "string" },
  },
  required: ["title", "summary", "content"],
};

export async function translateArticleToEnglish(
  text: ArticleText,
  models: string[],
): Promise<ArticleText> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Translate this Formula 1 news article from Ukrainian into natural English.
Rules:
- keep the Markdown formatting and all links unchanged;
- write names of drivers, teams and circuits the way they are usually written in English;
- if a field is empty, return an empty string for it.

Article (JSON):
${JSON.stringify({ title: text.title, summary: text.summary ?? "", content: text.content ?? "" })}`;

  for (let i = 0; i < models.length; i++) {
    try {
      const response = await ai.models.generateContent({
        model: models[i],
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: RESPONSE_SCHEMA,
        },
      });

      const parsed = JSON.parse(response.text ?? "") as Record<string, unknown>;
      const toText = (value: unknown) =>
        typeof value === "string" && value.trim() ? value.trim() : null;

      const title = toText(parsed.title);
      if (!title) throw new Error("Empty translation");

      return { title, summary: toText(parsed.summary), content: toText(parsed.content) };
    } catch (error) {
      const status = getStatus(error);
      const isLast = i === models.length - 1;
      if (isLast || !status || !FALLBACK_STATUSES.includes(status)) throw error;
      console.warn(`Gemini ${models[i]} → ${status}, пробую ${models[i + 1]}`);
    }
  }

  throw new Error("No Gemini models configured");
}
