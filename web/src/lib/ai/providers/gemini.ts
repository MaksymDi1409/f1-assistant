import {
  GoogleGenAI,
  type Content,
  type GenerateContentConfig,
  type Part,
} from "@google/genai";
import type { AIProvider, ChatEvent, ChatRequest } from "../types";

// Максимум кругів «модель → інструмент → модель», щоб не зациклитись
const MAX_STEPS = 5;

// 429 — ліміт вичерпано, 503 — модель перевантажена, 404 — модель прибрали.
// У цих випадках є сенс спробувати іншу модель
const FALLBACK_STATUSES = [404, 429, 503];

function getStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : undefined;
}

export function createGeminiProvider(apiKey: string, models: string[]): AIProvider {
  const ai = new GoogleGenAI({ apiKey });

  // Пробуємо моделі по черзі, починаючи з startIndex
  async function openStream(
    contents: Content[],
    config: GenerateContentConfig,
    startIndex: number,
  ) {
    for (let i = startIndex; i < models.length; i++) {
      try {
        const stream = await ai.models.generateContentStream({
          model: models[i],
          contents,
          config,
        });
        return { stream, modelIndex: i };
      } catch (error) {
        const status = getStatus(error);
        const isLast = i === models.length - 1;
        if (isLast || !status || !FALLBACK_STATUSES.includes(status)) throw error;

        console.warn(`Gemini ${models[i]} → ${status}, пробую ${models[i + 1]}`);
      }
    }
    throw new Error("No Gemini models configured");
  }

  return {
    name: "gemini",

    async *streamChat({ system, messages, tools }: ChatRequest): AsyncGenerator<ChatEvent> {
      // Gemini називає відповіді асистента роллю "model"
      const contents: Content[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const config: GenerateContentConfig = {
        systemInstruction: system,
        tools: [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parametersJsonSchema: t.parameters,
            })),
          },
        ],
      };

      // Якщо модель «впала» на першому кроці, наступні кроки
      // одразу йдуть до робочої, а не пробують зламану знову
      let modelIndex = 0;
      let announcedModel = "";

      for (let step = 0; step < MAX_STEPS; step++) {
        const opened = await openStream(contents, config, modelIndex);
        modelIndex = opened.modelIndex;

        if (models[modelIndex] !== announcedModel) {
          announcedModel = models[modelIndex];
          yield { type: "model", name: announcedModel };
        }

        // Збираємо все, що відповіла модель, і одразу віддаємо текст
        const modelParts: Part[] = [];
        for await (const chunk of opened.stream) {
          for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
            modelParts.push(part);
            if (part.text && !part.thought) {
              yield { type: "text", text: part.text };
            }
          }
        }

        // Модель не просить інструментів, значить відповідь готова
        if (!modelParts.some((p) => p.functionCall)) return;

        // Повертаємо моделі її ж відповідь (разом зі службовими полями)
        contents.push({ role: "model", parts: modelParts });

        // Виконуємо запитані функції і передаємо результати назад
        const responses: Part[] = [];
        for (const part of modelParts) {
          const call = part.functionCall;
          if (!call?.name) continue;

          yield { type: "tool", name: call.name };

          let response: Record<string, unknown>;
          try {
            const tool = tools.find((t) => t.name === call.name);
            if (!tool) throw new Error(`Unknown tool: ${call.name}`);
            response = { result: await tool.execute(call.args ?? {}) };
          } catch (error) {
            response = { error: error instanceof Error ? error.message : String(error) };
          }

          responses.push({
            functionResponse: { id: call.id, name: call.name, response },
          });
        }

        contents.push({ role: "user", parts: responses });
      }

      yield { type: "error", message: "Забагато кроків без відповіді" };
    },
  };
}