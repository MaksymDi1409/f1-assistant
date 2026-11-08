"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { readChatStream } from "@/lib/chat-stream";
import ChatMessageView from "./ChatMessageView";
import type { UIMessage } from "./types";

export default function Chat({ quickQuestions }: { quickQuestions: string[] }) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Прокрутка вниз при кожному новому шматку тексту
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function updateMessage(id: string, update: (m: UIMessage) => UIMessage) {
    setMessages((prev) => prev.map((m) => (m.id === id ? update(m) : m)));
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || isLoading) return;

    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      tools: [],
    };
    const assistantId = crypto.randomUUID();
    const history = [...messages, userMessage];

    // Одразу показуємо питання і порожню відповідь, яка заповнюватиметься
    setMessages([...history, { id: assistantId, role: "assistant", content: "", tools: [] }]);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // На сервер — лише роль і текст, без службових полів
          messages: history
            .filter((m) => m.content && !m.error)
            .map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      await readChatStream(res.body, (event) => {
        switch (event.type) {
          case "text":
            updateMessage(assistantId, (m) => ({ ...m, content: m.content + event.text }));
            break;
          case "tool":
            updateMessage(assistantId, (m) => ({ ...m, tools: [...m.tools, event.name] }));
            break;
          case "model":
            updateMessage(assistantId, (m) => ({ ...m, model: event.name }));
            break;
          case "error":
            updateMessage(assistantId, (m) => ({ ...m, error: event.message }));
            break;
        }
      });
    } catch {
      if (!controller.signal.aborted) {
        updateMessage(assistantId, (m) => ({
          ...m,
          error: "Не вдалося з'єднатися з сервером",
        }));
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[420px] flex-col rounded-xl border border-line bg-surface">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted">
              Спитай про гонки, пілотів, таблиці чи історію Формули 1
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/60 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <ChatMessageView
              key={m.id}
              message={m}
              isStreaming={isLoading && i === messages.length - 1}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши питання…"
          maxLength={2000}
          className="flex-1 rounded-lg bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="rounded-lg bg-subtle-strong px-4 py-2 text-sm hover:bg-line-strong"
          >
            Стоп
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-40"
          >
            Надіслати
          </button>
        )}
      </form>
    </div>
  );
}