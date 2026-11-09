import { getProvider } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { f1Tools } from "@/lib/ai/tools";
import type { ChatMessage, StreamEvent } from "@/lib/ai/types";
import { getCurrentUser } from "@/lib/auth/session";
import { consumeChatLimit, getClientKey, getDailyLimit } from "@/lib/chat-limit";
import { getSiteSettings } from "@/lib/cms/settings";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

// Перевіряємо, що прийшло від браузера: йому не можна довіряти
function parseMessages(body: unknown): ChatMessage[] | null {
  if (typeof body !== "object" || body === null) return null;

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const isValid = messages.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.length > 0 &&
      m.content.length <= MAX_MESSAGE_LENGTH,
  );
  if (!isValid || messages.at(-1).role !== "user") return null;

  // Лише останні повідомлення; історія має починатися з користувача
  const recent = (messages as ChatMessage[]).slice(-MAX_MESSAGES);
  while (recent[0]?.role === "assistant") recent.shift();
  return recent;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messages = parseMessages(body);
  if (!messages) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const [settings, user] = await Promise.all([getSiteSettings(), getCurrentUser()]);

  // Ліміт перевіряємо до звернення до ШІ: інакше квота Gemini витрачалася б і на зайві запити
  const rate = consumeChatLimit(getClientKey(user, request.headers), getDailyLimit(user, settings));

  // Стандартні заголовки, за якими клієнт дізнається про ліміт
  const rateHeaders: Record<string, string> =
    rate.limit === null
      ? {}
      : {
          "X-RateLimit-Limit": String(rate.limit),
          "X-RateLimit-Remaining": String(rate.remaining),
        };

  if (!rate.allowed) {
    return Response.json(
      {
        error: user
          ? "Ти використав усі питання на сьогодні. Ліміт оновиться опівночі."
          : "Ліміт питань для гостей вичерпано. Зареєструйся, щоб отримати більше.",
      },
      { status: 429, headers: rateHeaders }, // 429 Too Many Requests
    );
  }

  let provider;
  try {
    provider = getProvider({ models: settings.ai_models });
  } catch (error) {
    console.error("AI provider error:", error);
    return Response.json({ error: "AI is not configured" }, { status: 500 });
  }

  const encoder = new TextEncoder();

  // Server-Sent Events: кожна подія — рядок "data: {...}" і порожній рядок
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Клієнт уже відключився, надсилати нікуди
        }
      };

      try {
        for await (const event of provider.streamChat({
          system: buildSystemPrompt(new Date(), settings.chat_instructions),
          messages,
          tools: f1Tools,
        })) {
          // Користувач натиснув «Стоп» або закрив вкладку: припиняємо роботу з ШІ
          if (request.signal.aborted) break;
          send(event);
        }
      } catch (error) {
        console.error("Chat error:", error);
        send({ type: "error", message: "Не вдалося отримати відповідь від ШІ" });
      } finally {
        send({ type: "done" });
        try {
          controller.close();
        } catch {
          // Потік уже закрито
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...rateHeaders,
    },
  });
}