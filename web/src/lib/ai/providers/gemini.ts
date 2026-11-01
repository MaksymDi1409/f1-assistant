import { GoogleGenAI, type Content, type Part } from "@google/genai";
import type { AIProvider, ChatEvent, ChatRequest } from "../types";

// Максимум кругів «модель → інструмент → модель», щоб не зациклитись
const MAX_STEPS = 5;

export function createGeminiProvider(apiKey: string, model: string): AIProvider {
  const ai = new GoogleGenAI({ apiKey });

  return {
    name: "gemini",

    async *streamChat({ system, messages, tools }: ChatRequest): AsyncGenerator<ChatEvent> {
      // Gemini називає відповіді асистента роллю "model"
      const contents: Content[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const functionDeclarations = tools.map((t) => ({
        name: t.name,
        description: t.description,
        parametersJsonSchema: t.parameters,
      }));

      for (let step = 0; step < MAX_STEPS; step++) {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: system,
            tools: [{ functionDeclarations }],
          },
        });

        // Збираємо все, що відповіла модель, і одразу віддаємо текст
        const modelParts: Part[] = [];
        for await (const chunk of stream) {
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