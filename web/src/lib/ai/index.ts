import type { AIProvider } from "./types";
import { createGeminiProvider } from "./providers/gemini";

type ProviderOptions = {
  models?: string[]; // з CMS; якщо порожньо — з .env.local
};

// Тут з'являтимуться нові провайдери: claude, openai...
export function getProvider(options: ProviderOptions = {}): AIProvider {
  const name = process.env.AI_PROVIDER ?? "gemini";

  switch (name) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

      // "a,b,c" → ["a", "b", "c"]
      const envModels = (process.env.GEMINI_MODELS ?? "gemini-2.5-flash")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      const models = options.models?.length ? options.models : envModels;
      return createGeminiProvider(apiKey, models);
    }
    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}