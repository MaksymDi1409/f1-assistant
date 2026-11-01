import type { AIProvider } from "./types";
import { createGeminiProvider } from "./providers/gemini";

// Тут з'являтимуться нові провайдери: claude, openai...
export function getProvider(): AIProvider {
  const name = process.env.AI_PROVIDER ?? "gemini";

  switch (name) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      return createGeminiProvider(
        apiKey,
        process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      );
    }
    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}