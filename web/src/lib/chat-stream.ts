import type { StreamEvent } from "@/lib/ai/types";

// Читає відповідь /api/chat (Server-Sent Events) і викликає onEvent для кожної події
export async function readChatStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // stream: true — літера може розірватися між двома мережевими пакетами
    buffer += decoder.decode(value, { stream: true });

    // Події розділені порожнім рядком; останній шматок може бути неповним
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith("data: ")) {
        onEvent(JSON.parse(line.slice(6)) as StreamEvent);
      }
    }
  }
}