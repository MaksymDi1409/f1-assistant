import type { AIProvider } from "./types";
import { createGeminiProvider } from "./providers/gemini";

// Тут з'являтимуться нові провайдери: claude, openai...
export function getProvider(): AIProvider {
  const name = process.env.AI_PROVIDER ?? "gemini";

  switch (name) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

      // "a,b,c" → ["a", "b", "c"]
      const models = (process.env.GEMINI_MODELS ?? "gemini-2.5-flash")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      return createGeminiProvider(apiKey, models);
    }
    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}